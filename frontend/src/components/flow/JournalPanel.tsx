import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAppStore from '../../store/useAppStore'
import { listPipelineJobs, getJobOutputs, getPipeline } from '../../api/client'
import { Card, VStack, HStack, Button, ToggleButtonGroup, ToggleButton, Divider } from '@astryxdesign/core'
import { Text, Heading } from '@astryxdesign/core/Text'

type Filter = 'logs' | 'outputs' | 'mixte'

export default function JournalPanel() {
  const pipelineId = useAppStore(s => s.pipelineId)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('mixte')

  const jobsQuery = useQuery({
    queryKey: ['jobs', pipelineId],
    queryFn: () => listPipelineJobs(pipelineId!),
    enabled: !!pipelineId,
  })

  const selectedId = selectedJobId ?? jobsQuery.data?.[0]?.id ?? null

  const outputsQuery = useQuery({
    queryKey: ['jobOutputs', selectedId],
    queryFn: () => getJobOutputs(selectedId!),
    enabled: !!selectedId,
  })

  const jobs = jobsQuery.data ?? []
  const outputs = outputsQuery.data ?? []

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')
    } catch { return iso }
  }

  // Fused timeline: outputs + job log entries (if any)
  const fused = (() => {
    const items: Array<{ id: string; at: number; kind: 'log' | 'output'; text: string; block?: string }> = []
    // outputs as chronologically sorted
    for (const o of [...outputs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())) {
      items.push({ id: o.block_id ?? o.block_name, at: new Date(o.created_at).getTime(), kind: 'output', text: o.output, block: o.block_name })
    }
    // if selected job has global output/error, add as log
    const sel = jobs.find(j => j.id === selectedId)
    if (sel?.output) items.push({ id: 'job-log', at: new Date(sel.created_at).getTime(), kind: 'log', text: sel.output })
    if (sel?.error) items.push({ id: 'job-error', at: new Date(sel.completed_at ?? sel.created_at).getTime(), kind: 'log', text: sel.error })
    items.sort((a, b) => a.at - b.at)
    if (filter === 'logs') return items.filter(i => i.kind === 'log')
    if (filter === 'outputs') return items.filter(i => i.kind === 'output')
    return items
  })()

  const handleRestore = async () => {
    if (!pipelineId || !selectedId) return
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
        <Text type="body" color="secondary" style={{ textAlign: 'center', padding: '18px 6px' }}>Aucune Pipeline sélectionnée</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={3} style={{ minHeight: 0 }}>
      <Heading level={5}>Journal</Heading>
      {jobsQuery.isLoading ? (
        <Text type="body" color="secondary">Chargement…</Text>
      ) : jobs.length === 0 ? (
        <Text type="body" color="secondary" style={{ textAlign: 'center', padding: '18px 6px' }}>Aucune exécution</Text>
      ) : (
        <VStack gap={2}>
          <Text type="label" color="secondary">Exécutions</Text>
          <VStack gap={1}>
            {jobs.map(j => (
              <Card key={j.id} variant={selectedId === j.id ? 'default' : 'muted'} padding={2} className="cursor-pointer" onClick={() => setSelectedJobId(j.id)}>
                <HStack gap={2} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="body" style={{ fontWeight: 700 }}>{fmtTime(j.created_at)}</Text>
                  <Text type="supporting" color="secondary">{j.status}</Text>
                </HStack>
              </Card>
            ))}
          </VStack>
          <Divider />
          <ToggleButtonGroup type="single" label="Filtre" value={filter} onChange={v => v && setFilter(v as Filter)} size="sm">
            <ToggleButton label="Logs" value="logs" />
            <ToggleButton label="Outputs" value="outputs" />
            <ToggleButton label="Mixte" value="mixte" />
          </ToggleButtonGroup>
          <Button label="Restaurer cette version" variant="primary" size="sm" onClick={handleRestore} isDisabled={!selectedId} />
          <VStack gap={2} style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
            {fused.length === 0 ? (
              <Text type="body" color="secondary" style={{ textAlign: 'center', padding: '10px 6px' }}>Aucune donnée</Text>
            ) : fused.map((it, i) => (
              <Card key={`${it.id}-${i}`} variant="muted" padding={2}>
                <VStack gap={1}>
                  {it.block && <Text type="label" color="secondary">{it.block}</Text>}
                  <Text type="body" style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{it.text.slice(0, 2000)}</Text>
                  <Text type="supporting" color="secondary">{new Date(it.at).toLocaleTimeString('fr-FR')}</Text>
                </VStack>
              </Card>
            ))}
          </VStack>
        </VStack>
      )}
    </VStack>
  )
}
