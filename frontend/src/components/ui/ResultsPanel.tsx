import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { Card, VStack, Text } from '@astryxdesign/core'
import { Text as AstryxText } from '@astryxdesign/core/Text'

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
    /* pas du JSON → texte */
  }
  return { type: 'text', text: raw }
}

function Curve({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div style={{ color: theme.color.textMuted, fontSize: 12 }}>Courbe insuffisante ({points.length} point(s))</div>
  }
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const pts = points
    .map((v, i) => `${((i / (points.length - 1)) * 100).toFixed(2)},${(50 - ((v - min) / span) * 45 - 2.5).toFixed(2)}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ width: '100%', height: 110, background: 'rgba(255,255,255,.03)', borderRadius: 8, display: 'block' }}>
      <polyline points={pts} fill="none" stroke={theme.color.accentLight} strokeWidth="1.5" />
    </svg>
  )
}

function OutputCard({ block, raw }: { block: string; raw: string }) {
  const out = parseOutput(raw)
  const header = <Text type="label" style={{ opacity: 0.7 }}>{block}</Text>
  switch (out.type) {
    case 'image':
      return (
        <Card variant="muted" padding={2}>
          <VStack gap={2}>
            {header}
            <img src={`data:${out.mime ?? 'image/png'};base64,${out.data}`} alt={block} style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 6, display: 'block' }} />
          </VStack>
        </Card>
      )
    case 'curve':
      return (
        <Card variant="muted" padding={2}>
          <VStack gap={2}>
            {header}
            <Curve points={out.points} />
          </VStack>
        </Card>
      )
    case 'metric':
      return (
        <Card variant="muted" padding={2}>
          <VStack gap={1}>
            {header}
            <Text style={{ fontWeight: 800, fontSize: 18, color: theme.color.success }}>{out.value}</Text>
          </VStack>
        </Card>
      )
    case 'metrics':
      return (
        <Card variant="muted" padding={2}>
          <VStack gap={2}>
            {header}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 14px', fontSize: 13 }}>
              {Object.entries(out.values).map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <AstryxText type="label" style={{ opacity: 0.75 }}>{k}</AstryxText>
                  <AstryxText type="body" style={{ fontWeight: 800 }}>{String(v)}</AstryxText>
                </div>
              ))}
            </div>
          </VStack>
        </Card>
      )
    default:
      return (
        <Card variant="muted" padding={2}>
          <VStack gap={2}>
            {header}
            <AstryxText type="body" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}>{out.text}</AstryxText>
          </VStack>
        </Card>
      )
  }
}

export default function ResultsPanel() {
  const results = useAppStore(s => s.results)
  if (results.length === 0) {
    return <Text type="body" style={{ padding: 18, color: theme.color.textMuted }}>Aucun résultat pour ce run.</Text>
  }
  return (
    <VStack gap={2} style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
      {results.map((r, i) => <OutputCard key={i} block={r.block_name} raw={r.output} />)}
    </VStack>
  )
}
