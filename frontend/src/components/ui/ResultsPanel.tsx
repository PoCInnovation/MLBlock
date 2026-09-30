import useAppStore from '../../store/useAppStore'
import { Card } from '@/components/ui/card'

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
  const header = <span className="text-xs font-semibold opacity-70 text-text-muted">{block}</span>
  switch (out.type) {
    case 'image':
      return (
        <Card className="p-2 bg-surface border-border">
          <div className="flex flex-col gap-2">
            {header}
            <img src={`data:${out.mime ?? 'image/png'};base64,${out.data}`} alt={block} className="max-w-full max-h-56 rounded-md block" />
          </div>
        </Card>
      )
    case 'curve':
      return (
        <Card className="p-2 bg-surface border-border">
          <div className="flex flex-col gap-2">
            {header}
            <Curve points={out.points} />
          </div>
        </Card>
      )
    case 'metric':
      return (
        <Card className="p-2 bg-surface border-border">
          <div className="flex flex-col gap-1">
            {header}
            <div className="font-extrabold text-lg text-success">{out.value}</div>
          </div>
        </Card>
      )
    case 'metrics':
      return (
        <Card className="p-2 bg-surface border-border">
          <div className="flex flex-col gap-2">
            {header}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {Object.entries(out.values).map(([k, v]) => (
                <div key={k} className="contents">
                  <span className="opacity-75 text-text-muted">{k}</span>
                  <span className="font-extrabold">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )
    default:
      return (
        <Card className="p-2 bg-surface border-border">
          <div className="flex flex-col gap-2">
            {header}
            <div className="font-mono text-xs whitespace-pre-wrap">{out.text}</div>
          </div>
        </Card>
      )
  }
}

export default function ResultsPanel() {
  const results = useAppStore(s => s.results)
  if (results.length === 0) {
    return <div className="p-4 text-text-muted text-xs">Aucun résultat pour ce run.</div>
  }
  return (
    <div className="flex flex-col gap-2 p-3.5 overflow-y-auto flex-1">
      {results.map((r, i) => <OutputCard key={i} block={r.block_name} raw={r.output} />)}
    </div>
  )
}
