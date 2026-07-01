import { useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { runPipeline } from '../api/client'
import type { GraphPayload } from '../types/catalog'

export function useBlockRunner() {
  const onRun = useCallback(async () => {
    const { script, running, startRun } = useAppStore.getState()
    if (running) return
    if (script.length === 0) {
      useAppStore.getState().appendConsoleLines([{ k: 'sys', t: '⚠ Aucun bloc à exécuter.' }])
      return
    }
    startRun()
    const graph: GraphPayload = {
      nodes: script.map(b => ({ id: b.id, type: b.type, fields: b.fields })),
      edges: [], // TODO: wire real edges once graph model is defined
    }
    try {
      const result = await runPipeline(graph)
      if (useAppStore.getState().running) {
        useAppStore.getState().finishRun(result)
      }
    } catch (err) {
      console.error('Pipeline run failed:', err)
      // TODO: show real error UI once error shape is known
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
