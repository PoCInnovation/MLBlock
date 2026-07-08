import { useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { validateGraph, createPipeline, updatePipeline, buildPipeline } from '../api/client'
import type { PipelineNode, PipelineEdge } from '../types/catalog'

const DEFAULT_PIPELINE_NAME = 'mon-premier-modèle'

function buildNodes(script: { id: string; type: string; fields: Record<string, string> }[]): PipelineNode[] {
  return script.map(b => ({
    id: b.id,
    type: b.type,
    params: b.fields as Record<string, unknown>,
    children: [],
  }))
}

export function useBlockRunner() {
  const onRun = useCallback(async () => {
    const store = useAppStore.getState()
    if (store.running) return
    if (store.script.length === 0) {
      store.appendConsoleLines([{ k: 'sys', t: '⚠ Aucun bloc à exécuter.' }])
      return
    }

    store.startRun()

    const nodes: PipelineNode[] = buildNodes(store.script)
    const edges: PipelineEdge[] = []

    try {
      const validation = await validateGraph(nodes, edges)
      if (!validation.valid) {
        useAppStore.getState().appendConsoleLines([
          { k: 'sys', t: '⚠ Graphe invalide :' },
          ...validation.errors.map(e => ({ k: 'sys', t: `  • ${e}` })),
        ])
        useAppStore.getState().stopRun()
        return
      }

      let pipelineId = useAppStore.getState().pipelineId
      const payload = { name: DEFAULT_PIPELINE_NAME, description: '', nodes, edges }

      if (pipelineId === null) {
        const created = await createPipeline(payload)
        pipelineId = created.id
        useAppStore.getState().setPipelineId(pipelineId)
      } else {
        await updatePipeline(pipelineId, payload)
      }

      useAppStore.getState().appendConsoleLines([{ k: 'info', t: `📦 Pipeline #${pipelineId} sauvegardé` }])

      const build = await buildPipeline(pipelineId)

      if (!useAppStore.getState().running) return

      if (build.success) {
        const lines = [{ k: 'ok', t: `✓ Build réussi — ${build.layer_count} couche(s)` }]
        if (build.output_shape) {
          lines.push({ k: 'info', t: `  Forme de sortie : [${build.output_shape.join(', ')}]` })
        }
        useAppStore.getState().appendConsoleLines(lines)
        useAppStore.getState().finishRun(build)
      } else {
        useAppStore.getState().appendConsoleLines([
          { k: 'sys', t: `⚠ Erreur de build : ${build.error ?? 'inconnue'}` },
        ])
        useAppStore.getState().stopRun()
      }
    } catch (err) {
      console.error('Pipeline run failed:', err)
      if (useAppStore.getState().running) {
        useAppStore.getState().stopRun()
        useAppStore.getState().appendConsoleLines([{ k: 'sys', t: "⚠ Erreur lors de l'exécution." }])
      }
    }
  }, [])

  const onStop = useCallback(() => {
    if (!useAppStore.getState().running) return
    useAppStore.getState().stopRun()
  }, [])

  const onClear = useCallback(() => {
    useAppStore.getState().clearAll()
  }, [])

  return { onRun, onStop, onClear }
}
