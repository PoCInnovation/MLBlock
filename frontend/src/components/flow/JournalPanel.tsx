import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAppStore from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { listPipelineJobs, getJobOutputs, getPipeline, analyzePipeline, type PipelineAnalysis } from '../../api/client'
import { toServerPayload } from '../../store/pipelineDocument'
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'
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
    <svg role="img" aria-label="Courbe d'évolution des métriques" viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-28 bg-white/5 rounded-lg block">
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
      return <img src={src} alt="Graphique généré par le modèle" className="max-w-full max-h-56 rounded-md block" />
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

type Filter = 'logs' | 'outputs' | 'audit' | 'mixte'

function PipelineAdvisorCard({ analysis }: { analysis: PipelineAnalysis | null | undefined }) {
  if (!analysis) return null
  const score = analysis.score
  const colorCls =
    score >= 80
      ? 'text-success border-success/40 bg-success/10'
      : score >= 60
      ? 'text-primary border-primary/40 bg-primary/10'
      : score >= 40
      ? 'text-warning border-warning/40 bg-warning/10'
      : 'text-destructive border-destructive/40 bg-destructive/10'

  return (
    <Card className="p-4 bg-surface2 border-border flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="font-heading font-bold text-sm text-foreground">Score d&apos;Intelligence du Pipeline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-full border ${colorCls}`}>
            {score}/100 · {analysis.level}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed m-0">
        {analysis.summary}
      </p>

      {analysis.strengths.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[11px] font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Points forts
          </span>
          <ul className="m-0 pl-4 text-xs text-foreground/90 space-y-0.5">
            {analysis.strengths.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.improvements.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[11px] font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" /> Pistes d&apos;amélioration
          </span>
          <ul className="m-0 pl-4 text-xs text-foreground/90 space-y-0.5">
            {analysis.improvements.map((imp, idx) => (
              <li key={idx}>{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.tips.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="size-3.5" /> Conseils du Prof IA
          </span>
          <ul className="m-0 pl-4 text-xs text-muted-foreground space-y-0.5">
            {analysis.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

export default function JournalPanel() {
  const pipelineId = useAppStore(s => s.pipelineId)
  const consoleLines = useAppStore(s => s.consoleLines)
  const lastJobId = useAppStore(s => s.lastJobId)
  const jobStatus = useAppStore(s => s.jobStatus)
  const { flowNodes, flowEdges } = useAppStore(
    useShallow(s => ({ flowNodes: s.flowNodes, flowEdges: s.flowEdges }))
  )
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('mixte')
  const activeJobId = selectedJobId ?? lastJobId

  const analysisQuery = useQuery({
    queryKey: ['pipeline-analysis', flowNodes.length, flowEdges.length],
    queryFn: () => {
      const { nodes, edges } = toServerPayload(useAppStore.getState())
      return analyzePipeline(nodes, edges)
    },
    enabled: flowNodes.length > 0,
  })
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
                  <ToggleGroupItem value="mixte" className="text-[11px] px-2.5 py-1 h-7">Tout</ToggleGroupItem>
                  <ToggleGroupItem value="audit" className="text-[11px] px-2.5 py-1 h-7 font-bold">Score IA</ToggleGroupItem>
                  <ToggleGroupItem value="outputs" className="text-[11px] px-2.5 py-1 h-7">Sorties</ToggleGroupItem>
                  <ToggleGroupItem value="logs" className="text-[11px] px-2.5 py-1 h-7">Logs</ToggleGroupItem>
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
              {(filter === 'mixte' || filter === 'audit') && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Analyse & Recommandations IA
                  </span>
                  <PipelineAdvisorCard analysis={analysisQuery.data} />
                </div>
              )}
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
