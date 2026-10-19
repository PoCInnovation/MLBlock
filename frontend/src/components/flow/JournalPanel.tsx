import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAppStore from '../../store/useAppStore'
import { listPipelineJobs, getJobOutputs, getPipeline } from '../../api/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { decodeOutput, type TypedOutput } from '../../utils/outputCodec'

function Curve({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div className="text-text-muted text-xs">Courbe insuffisante ({points.length} point(s))</div>
  }
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const pts = points
    .map((v, i) => `${((i / (points.length - 1)) * 100).toFixed(2)},${(50 - ((v - min) / span) * 45 - 2.5).toFixed(2)}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-28 bg-white/5 rounded-lg block">
      <polyline points={pts} fill="none" className="stroke-accent-light" strokeWidth="1.5" />
    </svg>
  )
}

function OutputRenderer({ raw }: { raw: string }) {
  const [out, setOut] = useState<TypedOutput | null>(null)
  useEffect(() => {
    let live = true
    decodeOutput(raw).then(o => {
      if (live) setOut(o)
    })
    return () => {
      live = false
    }
  }, [raw])
  if (!out) {
    return <div className="text-text-muted text-xs">Décodage…</div>
  }
  switch (out.type) {
    case 'image': {
      const src = out.url ?? (out.data ? `data:${out.mime ?? 'image/png'};base64,${out.data}` : '')
      if (!src) return <div className="text-text-muted text-xs">[image vide]</div>
      return <img src={src} alt="output" className="max-w-full max-h-56 rounded-md block" />
    }
    case 'curve':
      return <Curve points={out.points} />
    case 'metric':
      return <div className="font-extrabold text-sm text-success">{out.value}</div>
    case 'metrics':
      return (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {Object.entries(out.values).map(([k, v]) => (
            <div key={k} className="contents">
              <span className="opacity-75 text-text-muted">{k}</span>
              <span className="font-extrabold">{String(v)}</span>
            </div>
          ))}
        </div>
      )
    default:
      if (out.type === 'gzip') return <div className="text-text-muted text-xs">[sortie illisible]</div>
      return <div className="font-mono text-xs whitespace-pre-wrap">{out.text}</div>
  }
}

type Filter = 'logs' | 'outputs' | 'mixte'

export default function JournalPanel() {
  const pipelineId = useAppStore(s => s.pipelineId)
  const consoleLines = useAppStore(s => s.consoleLines)
  const lastJobId = useAppStore(s => s.lastJobId)
  const jobStatus = useAppStore(s => s.jobStatus)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('mixte')
  const activeJobId = selectedJobId ?? lastJobId

  const jobsQuery = useQuery({
    queryKey: ['pipeline-jobs', pipelineId],
    queryFn: () => listPipelineJobs(pipelineId!),
    enabled: !!pipelineId,
    refetchInterval: 3000,
  })

  const jobs = jobsQuery.data ?? []

  const outputsQuery = useQuery({
    queryKey: ['job-outputs', activeJobId],
    queryFn: () => getJobOutputs(activeJobId!),
    enabled: !!activeJobId,
  })
  const outputs = outputsQuery.data ?? []

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return iso
    }
  }

  const execType = (j: { vast_instance_id: string }) => {
    return j.vast_instance_id ? `Vast #${j.vast_instance_id}` : 'Locale'
  }

  const handleRestore = async () => {
    if (!pipelineId || !activeJobId) return
    const store = useAppStore.getState()
    store.commitUndoPoint()
    try {
      const snap = await getPipeline(pipelineId)
      store.loadPipeline(snap.nodes, snap.edges, snap.id, snap.name)
      store.showToast({ kind: 'success', message: 'Pipeline restaurée' })
    } catch {
      store.showToast({ kind: 'error', message: 'Échec restauration' })
    }
  }

  if (!pipelineId) {
    return (
      <div className="flex flex-col gap-3 p-4 text-text-muted text-xs">
        Aucun pipeline actif.
      </div>
    )
  }

  if (jobsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 text-text-muted text-xs">
        Chargement des exécutions...
      </div>
    )
  }

  return (
    <div className="flex h-full w-full bg-surface overflow-hidden">
      {/* Sidebar: list of jobs */}
      <div className="w-72 border-r border-border flex flex-col shrink-0 bg-surface2/50">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-text">Exécutions ({jobs.length})</span>
          {jobStatus && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 animate-pulse border-accent text-accent-light">
              {jobStatus}
            </Badge>
          )}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {jobs.length === 0 ? (
            <div className="p-4 text-text-muted text-xs text-center">Aucune exécution enregistrée.</div>
          ) : (
            jobs.map(j => {
              const isSelected = j.id === activeJobId
              const isDone = j.status === 'done'
              const isError = j.status === 'error'
              return (
                <button
                  key={j.id}
                  onClick={() => setSelectedJobId(j.id)}
                  className={`w-full text-left p-3 transition-colors flex flex-col gap-1 cursor-pointer ${
                    isSelected ? 'bg-accent/15 border-l-2 border-accent' : 'hover:bg-surface2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-text-muted">{fmtTime(j.created_at)}</span>
                    <Badge
                      variant={isDone ? 'default' : isError ? 'destructive' : 'secondary'}
                      className={`text-[10px] px-1 py-0 ${isDone ? 'bg-success/20 text-success border-success/30' : isError ? 'bg-error/20 text-error border-error/30' : ''}`}
                    >
                      {j.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>{execType(j)}</span>
                    <span className="font-mono text-[10px]">#{j.id.slice(0, 6)}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main content: selected job details / outputs / logs */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {!activeJobId ? (
          <div className="flex-1 flex items-center justify-center text-text-muted text-xs">
            Sélectionnez une exécution pour voir ses détails.
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header toolbar */}
            <div className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0 bg-surface2/30">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-text">
                  Job <span className="font-mono text-accent-light">#{activeJobId.slice(0, 8)}</span>
                </span>
                <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} className="bg-surface2 border border-border rounded-lg p-0.5">
                  <ToggleGroupItem value="logs" className="text-[11px] px-2.5 py-1 h-7">Logs</ToggleGroupItem>
                  <ToggleGroupItem value="outputs" className="text-[11px] px-2.5 py-1 h-7">Sorties</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  className="h-7 text-xs text-text border-border hover:bg-surface3"
                >
                  Restaurer cet état
                </Button>
              </div>
            </div>

            {/* Content view */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {(filter === 'mixte' || filter === 'logs') && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Console & Logs</span>
                  <Card className="p-3 bg-surface2 border-border font-mono text-xs flex flex-col gap-1">
                    {consoleLines.length === 0 ? (
                      <span className="text-text-muted italic">Aucun log récent.</span>
                    ) : (
                      consoleLines.map((l, idx) => (
                        <div
                          key={idx}
                          className={`${
                            l.k === 'ok' ? 'text-success' : l.k === 'info' ? 'text-accent-light' : l.k === 'sys' ? 'text-warning' : 'text-text'
                          }`}
                        >
                          {l.t}
                        </div>
                      ))
                    )}
                  </Card>
                </div>
              )}

              {(filter === 'mixte' || filter === 'outputs') && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Sorties des blocs ({outputs.length})</span>
                  {outputsQuery.isLoading ? (
                    <div className="text-text-muted text-xs">Chargement des sorties...</div>
                  ) : outputs.length === 0 ? (
                    <div className="text-text-muted text-xs italic">Aucune sortie enregistrée pour cette exécution.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {outputs.map(out => (
                        <Card key={out.id} className="p-3 bg-surface2 border-border flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                            <span className="font-semibold text-text">{out.block_name}</span>
                            <span className="font-mono text-[10px] text-text-muted">{fmtTime(out.created_at)}</span>
                          </div>
                          <div className="py-1">
                            <OutputRenderer raw={out.output} />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
