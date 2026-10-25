import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'
import type { PipelineAnalysis } from '../../api/client'

export default function PipelineAdvisorCard({ analysis }: { analysis: PipelineAnalysis | null | undefined }) {
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
    <div className="flex flex-col gap-3 text-card-foreground">
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary shrink-0" />
          <span className="font-heading font-bold text-sm text-foreground">Score d&apos;Intelligence</span>
        </div>
        <span className={`font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-full border ${colorCls}`}>
          {score}/100 · {analysis.level}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed m-0">
        {analysis.summary}
      </p>

      {analysis.strengths.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[11px] font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 shrink-0" /> Points forts
          </span>
          <ul className="m-0 pl-4 text-xs text-foreground/90 space-y-1">
            {analysis.strengths.map((s, idx) => (
              <li key={idx} className="leading-snug">{s}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.improvements.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[11px] font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 shrink-0" /> Pistes d&apos;amélioration
          </span>
          <ul className="m-0 pl-4 text-xs text-foreground/90 space-y-1">
            {analysis.improvements.map((imp, idx) => (
              <li key={idx} className="leading-snug">{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.tips.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="size-3.5 shrink-0" /> Conseil du Prof IA
          </span>
          <ul className="m-0 pl-4 text-xs text-muted-foreground space-y-1">
            {analysis.tips.map((tip, idx) => (
              <li key={idx} className="leading-snug">{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
