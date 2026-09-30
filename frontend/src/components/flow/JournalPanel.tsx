import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAppStore from '../../store/useAppStore'
import { listPipelineJobs, getJobOutputs, getPipeline } from '../../api/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type TypedOutput =
  | { type: 'image'; mime: string; data: string }
  | { type: 'curve'; points: number[] }
  | { type: 'metric'; value: number }
  | { type: 'metrics'; values: Record<string, number | string | boolean> }
  | { type: 'text'; text: string }

function parseOutput(raw: string): TypedOutput {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'type' in parsed) {
      return parsed as TypedOutput
    }
  } catch {
    /* pas du JSON -> texte */
  }
  return { type: 'text', text: raw }
}

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
  const out = parseOutput(raw)
  switch (out.type) {
    case 'image':
      return <img src={`data:${out.mime ?? 'image/png'};base64,${out.data}`} alt="output" className="max-w-full max-h-56 rounded-md block" />
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
      return <div className="font-mono text-xs whitespace-pre-wrap">{out.text}</div>
  }
}

type Filter = 'logs' | 'outputs' | 'mixte'

export default function JournalPanel() {
  const pipelineId = useAppStore(s => s.pipelineId)
  const consoleLines = useAppStore(s => s.consoleLines)
  const lastJobId = useAppStore(s => s.lastJobId)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('mixte')

  const jobsQuery = useQuery({
    queryKey: ['pipeline-jobs', pipelineId],
    queryFn: () => listPipelineJobs(pipelineId!),
    enabled: !!pipelineId,
    refetchInterval: 3000,
  })

  const jobs = jobsQuery.data ?? []

  const outputsQuery = useQuery({
    queryKey: ['job-outputs', selectedJobId],
    queryFn: () => getJobOutputs(selectedJobId!),
    enabled: !!selectedJobId,
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
    if (!pipelineId || !selectedJobId) return
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
        Chargement du journal…
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col gap-3 min-h-0">
        <div className="text-secondary text-center py-4 px-1.5 text-xs text-text-muted">
          Aucune exécution
        </div>
      </div>
    )
  }

  // Detail view: execution's fused timeline
  if (selectedJobId) {
    const sel = jobs.find(j => j.id === selectedJobId)

    const fused = (() => {
      const items: Array<{ id: string; at: number; kind: 'log' | 'output'; text: string; block?: string }> = []
      for (const o of [...outputs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )) {
        items.push({
          id: o.block_id ?? o.block_name,
          at: new Date(o.created_at).getTime(),
          kind: 'output',
          text: o.output,
          block: o.block_name,
        })
      }
      if (sel) {
        const typeLabel = `Exécution ${execType(sel)}`
        items.push({ id: 'exec-type', at: new Date(sel.created_at).getTime() - 1, kind: 'log', text: typeLabel })
      }
      if (sel?.output) items.push({ id: 'job-log', at: new Date(sel.created_at).getTime(), kind: 'log', text: sel.output })
      if (sel?.error)
        items.push({
          id: 'job-error',
          at: new Date(sel.completed_at ?? sel.created_at).getTime(),
          kind: 'log',
          text: sel.error,
        })
      if (selectedJobId === lastJobId) {
        for (const [idx, line] of consoleLines.entries()) {
          // eslint-disable-next-line react-hooks/purity -- timestamp for live log ordering, stable per render
          items.push({ id: `console-${idx}`, at: Date.now() + idx, kind: 'log', text: line.t })
        }
      }
      items.sort((a, b) => a.at - b.at)
      if (filter === 'logs') return items.filter(i => i.kind === 'log')
      if (filter === 'outputs') return items.filter(i => i.kind === 'output')
      return items
    })()

    return (
      <div className="flex flex-col gap-3 min-h-0 flex-1 h-full overflow-hidden p-3">
        <button
          onClick={() => setSelectedJobId(null)}
          className="bg-transparent border-none text-text-muted cursor-pointer text-xs font-bold text-left p-0 font-body hover:text-text-light"
        >
          ← Retour au journal
        </button>
        <h5 className="text-sm font-extrabold text-text-light m-0">
          {sel ? `${fmtTime(sel.created_at)} · ${sel.status} · ${execType(sel)}` : 'Exécution'}
        </h5>
        {outputsQuery.isLoading ? (
          <div className="text-secondary text-xs text-text-muted">
            Chargement…
          </div>
        ) : null}
        <ToggleGroup type="single" value={filter} onValueChange={v => v && setFilter(v as Filter)} className="justify-start">
          <ToggleGroupItem value="logs" aria-label="Logs" className="text-xs px-2.5 py-1">Logs</ToggleGroupItem>
          <ToggleGroupItem value="outputs" aria-label="Outputs" className="text-xs px-2.5 py-1">Outputs</ToggleGroupItem>
          <ToggleGroupItem value="mixte" aria-label="Mixte" className="text-xs px-2.5 py-1">Mixte</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="default" size="sm" onClick={handleRestore} disabled={!selectedJobId} className="text-xs">
          Restaurer cette version
        </Button>
        <Separator />
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-0.5">
          {fused.length === 0 ? (
            <div className="text-secondary text-center py-2.5 px-1.5 text-xs text-text-muted">
              Aucune donnée
            </div>
          ) : (
            fused.map(item => (
              <Card key={item.id} className="p-2.5 bg-surface border-border">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold">
                    <span>{fmtTime(new Date(item.at).toISOString())}</span>
                    {item.block && <span className="font-extrabold text-accent">{item.block}</span>}
                  </div>
                  {item.kind === 'output' ? (
                    <OutputRenderer raw={item.text} />
                  ) : (
                    <div className="font-mono text-xs whitespace-pre-wrap text-text-light">{item.text}</div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  // List view: all Jobs
  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1 h-full overflow-hidden p-3">
      <h5 className="text-sm font-extrabold text-text-light m-0">Journal</h5>
      <span className="text-xs text-text-muted font-semibold">
        Exécutions
      </span>
      <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto pr-0.5">
        {jobs.map(j => (
          <Card key={j.id} className="p-2.5 bg-surface border-border cursor-pointer hover:border-accent transition-colors" onClick={() => setSelectedJobId(j.id)}>
            <div className="flex flex-col gap-1">
              <div className="flex gap-2 justify-between items-center">
                <div className="flex gap-1.5 items-center">
                  <span className="font-bold text-xs text-text-light">
                    {fmtTime(j.created_at)}
                  </span>
                  <Badge variant={execType(j) === 'Locale' ? 'outline' : 'secondary'} className="text-[10px] px-1 py-0">
                    {execType(j)}
                  </Badge>
                </div>
                <span className="text-[10px] text-text-muted font-semibold">
                  {j.status}
                </span>
              </div>
              {j.status === 'error' && j.error ? (
                <div className="text-xs text-error whitespace-pre-wrap break-words">
                  {j.error.slice(0, 220)}
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
