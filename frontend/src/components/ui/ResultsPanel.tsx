import useAppStore from '../../store/useAppStore'
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
function OutputCard({ block, raw }: { block: string; raw: string }) {
  const out = parseOutput(raw)
  const header = <Text type="label" className="opacity-70">{block}</Text>
  switch (out.type) {
    case 'image':
      return (
        <Card variant="muted" padding={2}>
          <VStack gap={2}>
            {header}
            <img src={`data:${out.mime ?? 'image/png'};base64,${out.data}`} alt={block} className="max-w-full max-h-56 rounded-md block" />
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
            <Text className="font-extrabold text-lg text-success">{out.value}</Text>
          </VStack>
        </Card>
      )
    case 'metrics':
      return (
        <Card variant="muted" padding={2}>
          <VStack gap={2}>
            {header}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {Object.entries(out.values).map(([k, v]) => (
                <div key={k} className="contents">
                  <AstryxText type="label" className="opacity-75">{k}</AstryxText>
                  <AstryxText type="body" className="font-extrabold">{String(v)}</AstryxText>
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
            <AstryxText type="body" className="font-mono text-xs">{out.text}</AstryxText>
          </VStack>
        </Card>
      )
  }
}

export default function ResultsPanel() {
  const results = useAppStore(s => s.results)
  if (results.length === 0) {
    return <Text type="body" className="p-4 text-text-muted">Aucun résultat pour ce run.</Text>
  }
  return (
    <VStack gap={2} className="p-3.5 overflow-y-auto flex-1">
      {results.map((r, i) => <OutputCard key={i} block={r.block_name} raw={r.output} />)}
    </VStack>
  )
}
