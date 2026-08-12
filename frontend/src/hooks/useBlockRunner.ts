import { useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { validateGraph, updatePipeline, buildPipeline, executePipeline, getJob, getJobOutputs } from '../api/client'
import { toServerPayload } from '../utils/blockHelpers'
import axios from 'axios'

const DEFAULT_PIPELINE_NAME = 'mon-premier-modèle'

/** Suit le job jusqu'à done/error puis charge les sorties structurées. */
function pollJob(jobId: string): void {
  let tries = 0
  const timer = setInterval(async () => {
    tries++
    try {
      const job = await getJob(jobId)
      useAppStore.getState().setJobStatus(job.status)
      if (job.status === 'done' || job.status === 'error') {
        clearInterval(timer)
        const outputs = await getJobOutputs(jobId)
        useAppStore.getState().setResults(outputs)
        useAppStore.getState().appendConsoleLines([
          job.status === 'done'
            ? { k: 'ok', t: `Exécution terminée — ${outputs.length} sortie(s)` }
            : { k: 'sys', t: `Exécution en erreur : ${job.error || 'inconnue'}` },
        ])
      } else if (tries > 40) {
        clearInterval(timer)
      }
    } catch (err) {
      // 4xx (hors 429) : erreur permanente (job invalide/inexistant) — jamais
      // résolue, on arrête. Réseau/5xx (backend Render en réveil) : on continue.
      const status = (err as { response?: { status?: number } } | undefined)?.response?.status
      if (status && status >= 400 && status < 500 && status !== 429) {
        clearInterval(timer)
        useAppStore.getState().appendConsoleLines([{ k: 'sys', t: 'Statut du job indisponible — suivi arrêté.' }])
      }
    }
  }, 3000)
}

export function useBlockRunner() {
  const onRun = useCallback(async () => {
    const store = useAppStore.getState()
    if (store.running) return

    const { nodes, edges } = toServerPayload(store)

    if (nodes.length === 0) {
      store.appendConsoleLines([{ k: 'sys', t: 'Aucun bloc à exécuter.' }])
      return
    }

    store.startRun()

    try {
      const validation = await validateGraph(nodes, edges)
      if (!validation.valid) {
        useAppStore.getState().appendConsoleLines([
          { k: 'sys', t: 'Graphe invalide :' },
          ...validation.errors.map(e => ({ k: 'sys', t: `  • ${e}` })),
        ])
        useAppStore.getState().failRun()
        return
      }

      let pipelineId = useAppStore.getState().pipelineId

      if (pipelineId === null) {
        // Run sans projet : brouillon invisible (1 seul par user, nettoyé côté serveur)
        pipelineId = await useAppStore.getState().ensureDraft()
      } else {
        // Ré-exécution : on préserve le statut (draft reste draft, projet reste projet)
        await updatePipeline(pipelineId, { name: DEFAULT_PIPELINE_NAME, description: '', nodes, edges })
      }

      useAppStore.getState().appendConsoleLines([{ k: 'info', t: `Pipeline #${pipelineId} sauvegardé` }])

      const build = await buildPipeline(pipelineId)

      if (!useAppStore.getState().running) return

      if (build.success) {
        const lines = [{ k: 'ok', t: `Build réussi — ${build.layer_count} couche(s)` }]
        if (build.output_shape) {
          lines.push({ k: 'info', t: `  Forme de sortie : [${build.output_shape.join(', ')}]` })
        }
        useAppStore.getState().appendConsoleLines(lines)

        // Exécution réelle (GPU ou subprocess local en mode mock) — les résultats
        // remontent via callbacks vers le job.
        try {
          const job = await executePipeline(pipelineId)
          if (!job?.id) {
            // Job non sérialisé (régression) : ne pas poller un id fantôme
            useAppStore.getState().appendConsoleLines([{ k: 'sys', t: 'Exécution lancée sans identifiant de job — statut indisponible.' }])
            useAppStore.getState().failRun()
            return
          }
          useAppStore.getState().setLastJob(job)
          if (job.status === 'error') {
            // Échec immédiat (ex. location GPU refusée) : message backend, pas de polling
            useAppStore.getState().appendConsoleLines([{ k: 'sys', t: `Exécution en erreur : ${job.error || 'inconnue'}` }])
            useAppStore.getState().failRun()
            return
          }
          pollJob(job.id)
        } catch {
          useAppStore.getState().appendConsoleLines([{ k: 'sys', t: "Échec du lancement de l'exécution." }])
        }
        useAppStore.getState().finishRun(build)
      } else {
        useAppStore.getState().appendConsoleLines([
          { k: 'sys', t: `Erreur de build : ${build.error ?? 'inconnue'}` },
        ])
        useAppStore.getState().failRun()
      }
    } catch (err) {
      console.error('Pipeline run failed:', err)
      if (useAppStore.getState().running) {
        useAppStore.getState().failRun()
        // Affiche le détail serveur (400 build/validate…) au lieu d'un message générique
        let detail = "Erreur lors de l'exécution."
        if (axios.isAxiosError(err)) {
          const d = (err.response?.data as { detail?: string } | undefined)?.detail
          if (d) detail = `Erreur : ${d}`
        }
        useAppStore.getState().appendConsoleLines([{ k: 'sys', t: detail }])
      }
    }
  }, [])

  const onStop = useCallback(() => {
    if (!useAppStore.getState().running) return
    useAppStore.getState().stopRun()
  }, [])

  const onClear = useCallback(() => {
    const s = useAppStore.getState()
    s.commitUndoPoint()
    s.clearAll()
  }, [])

  return { onRun, onStop, onClear }
}
