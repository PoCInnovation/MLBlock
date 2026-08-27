import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAppStore from '../../store/useAppStore'
import { listPipelineJobs, getJobOutputs, getPipeline } from '../../api/client'
import { Card, VStack, HStack, Button, ToggleButtonGroup, ToggleButton, Divider } from '@astryxdesign/core'
import { Text, Heading } from '@astryxdesign/core/Text'
import { theme } from '../../theme'

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
        <Text type="body" color="secondary" style={{ textAlign: 'center', padding: '18px 6px' }}>
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
      <VStack gap={3} style={{ minHeight: 0 }}>
        <Heading level={5}>Journal</Heading>
        <Text type="body" color="secondary" style={{ textAlign: 'center', padding: '18px 6px' }}>
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
      <VStack gap={3} style={{ minHeight: 0 }}>
        <button
          onClick={() => setSelectedJobId(null)}
          style={{
            background: 'none',
            border: 'none',
            color: theme.color.textMuted,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            textAlign: 'left',
            padding: 0,
          }}
        >
          ← Retour au journal
        </button>
        <Heading level={5}>
          {sel ? `${fmtTime(sel.created_at)} · ${sel.status}` : 'Exécution'}
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
        <VStack gap={2} style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
          {fused.length === 0 ? (
            <Text type="body" color="secondary" style={{ textAlign: 'center', padding: '10px 6px' }}>
              Aucune donnée
            </Text>
          ) : (
            fused.map((it, i) => (
              <Card key={`${it.id}-${i}`} variant="muted" padding={2}>
                <VStack gap={1}>
                  {it.block && <Text type="label" color="secondary">{it.block}</Text>}
                  <Text type="body" style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {it.text.slice(0, 2000)}
                  </Text>
                  <Text type="supporting" color="secondary">
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
    <VStack gap={3} style={{ minHeight: 0 }}>
      <Heading level={5}>Journal</Heading>
      <Text type="label" color="secondary">
        Exécutions
      </Text>
      <VStack gap={1}>
        {jobs.map(j => (
          <Card key={j.id} variant="muted" padding={2} className="cursor-pointer" onClick={() => setSelectedJobId(j.id)}>
            <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="body" style={{ fontWeight: 700 }}>
                {fmtTime(j.created_at)}
              </Text>
              <Text type="supporting" color="secondary">
                {j.status}
              </Text>
            </HStack>
          </Card>
        ))}
      </VStack>
    </VStack>
  )
}
