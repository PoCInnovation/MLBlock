import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAppStore from '../../store/useAppStore'
import { listPipelineJobs, getJobOutputs, getPipeline } from '../../api/client'
import { Badge, Card, VStack, HStack, Button, ToggleButtonGroup, ToggleButton, Divider } from '@astryxdesign/core'
import { Text, Heading } from '@astryxdesign/core/Text'
type TypedOutput =
  | { type: 'image'; mime: string; data: string }
  | { type: 'curve'; points: number[] }
  | { type: 'metric'; value: number }
  | { type: 'metrics'; values: Record<string, number | string | boolean> }
  | { type: 'text'; text: string }

function parseOutput(raw: string): TypedOutput {
  try {
    const v = JSON.parse(raw)
    if (v && typeof v === 'object' && typeof v.type === 'string') return v as TypedOutput
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
      return (
        <div className="mt-1">
          <img src={`data:${out.mime ?? 'image/png'};base64,${out.data}`} alt="Résultat" className="max-w-full max-h-60 rounded-md block" />
        </div>
      )
    case 'curve':
      return (
        <div className="mt-1">
          <Curve points={out.points} />
        </div>
      )
    case 'metric':
      return (
        <div className="mt-1 flex items-baseline gap-1.5">
          <Text className="font-extrabold text-xl text-success">{out.value}</Text>
        </div>
      )
    case 'metrics':
      return (
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {Object.entries(out.values).map(([k, v]) => (
            <div key={k} className="contents">
              <span className="text-text-muted font-semibold">{k} :</span>
              <span className="font-extrabold text-text">{String(v)}</span>
            </div>
          ))}
        </div>
      )
    default:
      return (
        <Text type="body" className="text-xs whitespace-pre-wrap break-words font-mono">
          {raw.slice(0, 2000)}
        </Text>
      )
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
    queryKey: ['jobs', pipelineId],
    queryFn: () => listPipelineJobs(pipelineId!),
    enabled: !!pipelineId,
  })

  const jobs = jobsQuery.data ?? []

  const outputsQuery = useQuery({
    queryKey: ['jobOutputs', selectedJobId],
    queryFn: () => getJobOutputs(selectedJobId!),
    enabled: !!selectedJobId,
  })

  const outputs = outputsQuery.data ?? []

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')
    } catch {
      return iso
    }
  }

  const execType = (j: { vast_instance_id: string }) => {
    const id = j.vast_instance_id ?? ''
    const isLocal = id === 'local-instance-id' || id.startsWith('mock-') || !id
    return isLocal ? 'Locale' : 'GPU Vast.ai'
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
      <VStack gap={2}>
        <Heading level={5}>Journal</Heading>
        <Text type="body" color="secondary" className="text-center py-4 px-1.5">
          Aucune Pipeline sélectionnée
        </Text>
      </VStack>
    )
  }

  if (jobsQuery.isLoading) {
    return (
      <VStack gap={2}>
        <Heading level={5}>Journal</Heading>
        <Text type="body" color="secondary">
          Chargement…
        </Text>
      </VStack>
    )
  }

  if (jobs.length === 0) {
    return (
      <VStack gap={3} className="min-h-0">
        <Heading level={5}>Journal</Heading>
        <Text type="body" color="secondary" className="text-center py-4 px-1.5">
          Aucune exécution
        </Text>
      </VStack>
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
      <VStack gap={3} className="min-h-0 flex-1 h-full overflow-hidden">
        <button
          onClick={() => setSelectedJobId(null)}
          className="bg-transparent border-none text-text-muted cursor-pointer text-xs font-bold text-left p-0"
        >
          ← Retour au journal
        </button>
        <Heading level={5}>
          {sel ? `${fmtTime(sel.created_at)} · ${sel.status} · ${execType(sel)}` : 'Exécution'}
        </Heading>
        {outputsQuery.isLoading ? (
          <Text type="body" color="secondary">
            Chargement…
          </Text>
        ) : null}
        <ToggleButtonGroup type="single" label="Filtre" value={filter} onChange={v => v && setFilter(v as Filter)} size="sm">
          <ToggleButton label="Logs" value="logs" />
          <ToggleButton label="Outputs" value="outputs" />
          <ToggleButton label="Mixte" value="mixte" />
        </ToggleButtonGroup>
        <Button label="Restaurer cette version" variant="primary" size="sm" onClick={handleRestore} isDisabled={!selectedJobId} />
        <Divider />
        <VStack gap={2} className="flex-1 min-h-0 overflow-y-auto pr-0.5">
          {fused.length === 0 ? (
            <Text type="body" color="secondary" className="text-center py-2.5 px-1.5">
              Aucune donnée
            </Text>
          ) : (
            fused.map((it, i) => (
              <Card key={`${it.id}-${i}`} variant="muted" padding={2}>
                <VStack gap={1}>
                  <HStack gap={2} className="justify-between items-center">
                    {it.block && <Text type="label" color="secondary">{it.block}</Text>}
                    <Badge label={it.kind === 'output' ? 'Sortie' : 'Log'} variant={it.kind === 'output' ? 'success' : 'neutral'} />
                  </HStack>
                  {it.kind === 'output' ? (
                    <OutputRenderer raw={it.text} />
                  ) : (
                    <Text type="body" className="text-xs whitespace-pre-wrap break-words font-mono">
                      {it.text.slice(0, 2000)}
                    </Text>
                  )}
                  <Text type="supporting" color="secondary" className="text-xs">
                    {new Date(it.at).toLocaleTimeString('fr-FR')}
                  </Text>
                </VStack>
              </Card>
            ))
          )}
        </VStack>
      </VStack>
    )
  }

  // List view: all Jobs
  return (
    <VStack gap={3} className="min-h-0 flex-1 h-full overflow-hidden">
      <Heading level={5}>Journal</Heading>
      <Text type="label" color="secondary">
        Exécutions
      </Text>
      <VStack gap={1} className="flex-1 min-h-0 overflow-y-auto pr-0.5">
        {jobs.map(j => (
          <Card key={j.id} variant="muted" padding={2} className="cursor-pointer" onClick={() => setSelectedJobId(j.id)}>
            <VStack gap={1}>
              <HStack gap={2} className="justify-between items-center">
                <HStack gap={1} className="items-center">
                  <Text type="body" className="font-bold">
                    {fmtTime(j.created_at)}
                  </Text>
                  <Badge label={execType(j)} variant={execType(j) === 'Locale' ? 'neutral' : 'info'} />
                </HStack>
                <Text type="supporting" color="secondary">
                  {j.status}
                </Text>
              </HStack>
              {j.status === 'error' && j.error ? (
                <Text type="body" className="text-xs text-error whitespace-pre-wrap break-words">
                  {j.error.slice(0, 220)}
                </Text>
              ) : null}
            </VStack>
          </Card>
        ))}
      </VStack>
    </VStack>
  )
}
