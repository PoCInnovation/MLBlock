import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import useAppStore from '../store/useAppStore'
import { validateGraph, updatePipeline, buildPipeline, executePipeline, getJob, getJobOutputs, cancelJob } from '../api/client'
import { toServerPayload } from '../store/pipelineDocument'
import { supabase } from '../services/supabase'
import axios from 'axios'
import type { Job, JobStatus, JobOutput } from '../types/catalog'
const DEFAULT_PIPELINE_NAME = 'mon-premier-modèle'

function isPermanentJobError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } } | undefined)?.response?.status
  return !!status && status >= 400 && status < 500 && status !== 429
}

export function useJobRunner() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  const cancelledRef = useRef(false)
  const stoppedFor = useRef<string | null>(null)
  const handledFor = useRef<string | null>(null)

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
      return isPermanentJobError(q.state.error) ? false : 3_000
    },
  })

  const status: JobStatus | null = jobQuery.data?.status ?? null
  const terminal = status === 'done' || status === 'error'
  const queryClient = useQueryClient()

  const outputsQuery = useQuery({
    queryKey: ['job-outputs', jobId],
    queryFn: () => getJobOutputs(jobId!),
    enabled: !!jobId,
    refetchInterval: () => {
      const d = jobQuery.data
      if (d && (d.status === 'done' || d.status === 'error')) return false
      return 2_000
    },
  })

  useEffect(() => {
    if (!jobId) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('job:' + jobId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_outputs', filter: 'job_id=eq.' + jobId }, (payload) => {
          const row = payload.new as JobOutput
          if (row.output && row.output.length > 20000) {
            row.output = row.output.slice(0, 20000) + '...[truncated]'
          }
          const cur = useAppStore.getState().jobOutputs
          if (cur.some(o => o.created_at === row.created_at && o.block_id === row.block_id && o.block_name === row.block_name)) return
          useAppStore.getState().setJobOutputs([...cur, row])
          queryClient.invalidateQueries({ queryKey: ['job-outputs', jobId] })
        })
        .subscribe()
    } catch {
      // Realtime not available
    }
    return () => {
      try { if (channel) supabase.removeChannel(channel) } catch {}
    }
  }, [jobId, queryClient])

  useEffect(() => {
    if (!outputsQuery.data || !jobId) return
    useAppStore.getState().setJobOutputs(outputsQuery.data as JobOutput[])
  }, [outputsQuery.data, jobId])

  useEffect(() => {
    useAppStore.getState().setJobStatus(status)
  }, [status])

  useEffect(() => {
    if (!outputsQuery.data || !jobId || handledFor.current === jobId) return
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
        pipelineId = await store.ensureDraft()
      } else {
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
        store.appendConsoleLines([{ k: 'sys', t: 'Exécution lancée sans identifiant de job — statut indisponible.' }])
        return null
      }
      store.setLastJob(job)
      queryClient.setQueryData(['job', job.id], job)
      if (job.status === 'error') {
        store.appendConsoleLines([{ k: 'sys', t: `Exécution en erreur : ${job.error || 'inconnue'}` }])
        handledFor.current = job.id
      }
      return job.id
    },
    onSuccess: (id) => {
      if (cancelledRef.current || !id) return
      setJobId(id)
    },
    onError: (err) => {
      let detail = "Erreur lors de l'exécution."
      if (axios.isAxiosError(err)) {
        const d = (err.response?.data as { detail?: unknown } | undefined)?.detail
        if (d) {
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

  useEffect(() => {
    if (jobId === null && isStopping) queueMicrotask(() => setIsStopping(false))
  }, [jobId, isStopping])

  const onRun = useCallback(() => {
    if (isRunning) return
    cancelledRef.current = false
    runMutation.mutate()
  }, [isRunning, runMutation])

  const onStop = useCallback(async () => {
    if (!isRunning) return
    setIsStopping(true)
    cancelledRef.current = true
    if (jobId) {
      try {
        await cancelJob(jobId)
        useAppStore.getState().appendConsoleLines([{ k: 'sys', t: 'Exécution interrompue' }])
      } catch {
        useAppStore.getState().appendConsoleLines([{ k: 'sys', t: "Échec de l'annulation côté serveur" }])
      }
    }
    runMutation.reset()
    setJobId(null)
  }, [isRunning, jobId, runMutation])

  const onClear = useCallback(() => {
    const s = useAppStore.getState()
    s.commitUndoPoint()
    s.clearAll()
  }, [])

  return { onRun, onStop, onClear, isPending: isRunning, isStopping, isError: runMutation.isError, jobId, status }
}
