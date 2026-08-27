import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import useAppStore from '../store/useAppStore'
import { validateGraph, updatePipeline, buildPipeline, executePipeline, getJob, getJobOutputs } from '../api/client'
import { toServerPayload } from '../utils/blockHelpers'
import { supabase } from '../services/supabase'
import axios from 'axios'
import type { Job, JobStatus, JobOutput } from '../types/catalog'
const DEFAULT_PIPELINE_NAME = 'mon-premier-modèle'

/** Erreur 4xx (hors 429) : permanente (job invalide/inexistant) — jamais
    résolue, on arrête le suivi. Réseau/5xx (backend Render en réveil) : on continue. */
function isPermanentJobError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } } | undefined)?.response?.status
  return !!status && status >= 400 && status < 500 && status !== 429
}

export function useBlockRunner() {
  // Job lancé par CE hook (un seul à la fois) — la source du suivi. Tant qu'il
  // est null, les queries de suivi sont désactivées (enabled: false).
  const [jobId, setJobId] = useState<string | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  const cancelledRef = useRef(false)
  const stoppedFor = useRef<string | null>(null)
  const handledFor = useRef<string | null>(null)

  // — Suivi du job (remplace le polling manuel) —
  // refetch toutes les 3 s jusqu'à done/error, puis s'arrête.
  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      try {
        return await getJob(jobId!)
      } catch (err) {
        if (isPermanentJobError(err) && stoppedFor.current !== jobId) {
          stoppedFor.current = jobId
          const s = useAppStore.getState()
          s.appendConsoleLines([{ k: 'sys', t: 'Statut du job indisponible — suivi arrêté.' }])
          s.setJobStatus(null)
        }
        throw err
      }
    },
    enabled: !!jobId,
    refetchInterval: (q) => {
      const d = q.state.data
      if (d && (d.status === 'done' || d.status === 'error')) return false
      // 4xx (hors 429) : erreur permanente → suivi arrêté ; réseau/5xx : on continue
      return isPermanentJobError(q.state.error) ? false : 3_000
    },
  })

  const status: JobStatus | null = jobQuery.data?.status ?? null
  const terminal = status === 'done' || status === 'error'
  const queryClient = useQueryClient()

  // — Sorties structurées en live (Realtime + polling fallback 2s) —
  const outputsQuery = useQuery({
    queryKey: ['job-outputs', jobId],
    queryFn: () => getJobOutputs(jobId!),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const d = jobQuery.data
      if (d && (d.status === 'done' || d.status === 'error')) return false
      // Poll 2s en live, Realtime est le canal principal quand dispo
      return 2_000
    },
  })

  // Realtime: Supabase channel per jobId -> maj jobOutputs instantanément
  useEffect(() => {
    if (!jobId) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('job:' + jobId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_outputs', filter: 'job_id=eq.' + jobId }, (payload) => {
          const row = payload.new as JobOutput
          // Tronque côté frontend si nécessaire
          if (row.output && row.output.length > 20000) {
            console.warn('[Inspecteur] sortie tronquée', row.block_id ?? row.block_name)
            row.output = row.output.slice(0, 20000) + '...[truncated]'
          }
          const cur = useAppStore.getState().jobOutputs
          // Évite doublon si polling déjà l'a insérée
          if (cur.some(o => o.created_at === row.created_at && o.block_id === row.block_id && o.block_name === row.block_name)) return
          useAppStore.getState().setJobOutputs([...cur, row])
          // Invalide la query pour resync polling → pas de doublon au prochain tick
          queryClient.invalidateQueries({ queryKey: ['job-outputs', jobId] })
        })
        .subscribe()
    } catch {
      // Realtime non dispo -> fallback polling 2s déjà actif
    }
    return () => {
      try { if (channel) supabase.removeChannel(channel) } catch {}
    }
  }, [jobId, queryClient])

  // Sync live outputs -> store (pour Inspecteur par block_id)
  useEffect(() => {
    if (!outputsQuery.data || !jobId) return
    // Maj même avant terminal pour le live
    useAppStore.getState().setJobOutputs(outputsQuery.data as JobOutput[])
  }, [outputsQuery.data, jobId])

  // Miroir du statut vers le store (sélecteur minimal pour ConsolePanel).
  useEffect(() => {
    useAppStore.getState().setJobStatus(status)
  }, [status])

  // Fin du run : messages console (une seule fois par job).
  useEffect(() => {
    if (!outputsQuery.data || !jobId || handledFor.current === jobId) return
    // Attendre terminal pour le message final (Console light)
    if (!terminal) return
    handledFor.current = jobId
    const outputs = outputsQuery.data as JobOutput[]
    const s = useAppStore.getState()
    s.appendConsoleLines([
      status === 'done'
        ? { k: 'ok', t: `Exécution terminée — ${outputs.length} sortie(s)` }
        : { k: 'sys', t: `Exécution en erreur : ${jobQuery.data?.error || 'inconnue'}` },
    ])
  }, [outputsQuery.data, jobId, status, jobQuery.data?.error, terminal])

  // — Lancement du run (mutation) : même séquence que l'ancien onRun —
  const runMutation = useMutation({
    mutationFn: async (): Promise<string | null> => {
      const store = useAppStore.getState()
      const { nodes, edges } = toServerPayload(store)

      if (nodes.length === 0) {
        store.appendConsoleLines([{ k: 'sys', t: 'Aucun bloc à exécuter.' }])
        return null
      }

      store.appendConsoleLines([{ k: 'sys', t: "C'est parti !" }])

      const validation = await validateGraph(nodes, edges)
      if (cancelledRef.current) return null
      if (!validation.valid) {
        store.appendConsoleLines([
          { k: 'sys', t: 'Graphe invalide :' },
          ...validation.errors.map(e => ({ k: 'sys', t: `  • ${e}` })),
        ])
        return null
      }

      let pipelineId = store.pipelineId
      if (pipelineId === null) {
        // Run sans projet : brouillon invisible (1 seul par user, nettoyé côté serveur)
        pipelineId = await store.ensureDraft()
      } else {
        // Ré-exécution : on préserve le statut (draft reste draft, projet reste projet)
        await updatePipeline(pipelineId, { name: DEFAULT_PIPELINE_NAME, description: '', nodes, edges })
      }
      if (cancelledRef.current) return null

      store.appendConsoleLines([{ k: 'info', t: `Pipeline #${pipelineId} sauvegardé` }])

      const build = await buildPipeline(pipelineId)
      if (cancelledRef.current) return null

      if (!build.success) {
        store.appendConsoleLines([{ k: 'sys', t: `Erreur de build : ${build.error ?? 'inconnue'}` }])
        return null
      }

      store.appendConsoleLines([
        { k: 'ok', t: `Build réussi — ${build.layer_count} couche(s)` },
        ...(build.output_shape
          ? [{ k: 'info', t: `  Forme de sortie : [${build.output_shape.join(', ')}]` }]
          : []),
      ])

      let job: Job | null = null
      try {
        job = await executePipeline(pipelineId)
      } catch {
        store.appendConsoleLines([{ k: 'sys', t: "Échec du lancement de l'exécution." }])
        return null
      }
      if (cancelledRef.current) return null

      if (!job?.id) {
        // Job non sérialisé (régression) : ne pas suivre un id fantôme
        store.appendConsoleLines([{ k: 'sys', t: 'Exécution lancée sans identifiant de job — statut indisponible.' }])
        return null
      }
      store.setLastJob(job)
      return job.id
    },
    onSuccess: (id) => {
      if (cancelledRef.current || !id) return
      setJobId(id)
    },
    onError: (err) => {
      console.error('Pipeline run failed:', err)
      // Affiche le détail serveur (400 build/validate…) au lieu d'un message générique
      let detail = "Erreur lors de l'exécution."
      if (axios.isAxiosError(err)) {
        const d = (err.response?.data as { detail?: unknown } | undefined)?.detail
        if (d) {
          // detail peut être une string (400 build/validate) ou un tableau
          // pydantic (422) — extraire les messages, jamais [object Object].
          const msg = typeof d === 'string'
            ? d
            : Array.isArray(d)
              ? d.map(e => (e as { msg?: string } | undefined)?.msg ?? '').filter(Boolean).join('; ')
              : JSON.stringify(d)
          detail = `Erreur : ${msg}`
        }
      }
      useAppStore.getState().appendConsoleLines([{ k: 'sys', t: detail }])
    },
  })

  const isRunning = runMutation.isPending || (jobId !== null && !terminal) || isStopping

  // Reset stopping flag once jobId is cleared
  useEffect(() => {
    if (jobId === null && isStopping) setIsStopping(false)
  }, [jobId, isStopping])

  const onRun = useCallback(() => {
    if (isRunning) return // double lancement bloqué tant que le run est actif
    cancelledRef.current = false
    runMutation.mutate()
  }, [isRunning, runMutation])

  const onStop = useCallback(() => {
    if (!isRunning) return
    setIsStopping(true)
    // Annule l'attente : isPending → false (reset) et suivi arrêté (enabled: false)
    cancelledRef.current = true
    runMutation.reset()
    setJobId(null)
    useAppStore.getState().appendConsoleLines([{ k: 'sys', t: 'Arrêté' }])
    // isStopping reste true jusqu'à ce que jobId passe à null (effet ci-dessus)
  }, [isRunning, runMutation, jobId])

  const onClear = useCallback(() => {
    const s = useAppStore.getState()
    s.commitUndoPoint()
    s.clearAll()
  }, [])

  return { onRun, onStop, onClear, isPending: isRunning, isStopping, isError: runMutation.isError, jobId, status }
}
