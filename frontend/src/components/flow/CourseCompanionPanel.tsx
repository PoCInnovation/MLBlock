import { memo, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, Lightbulb, X } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { courses, getCourse } from '../../content/cours'
import { evaluateCourseProgress } from '../../utils/courseWatcher'

const DIFFICULTY_LABEL = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' } as const

/** Découpe le corps Markdown en sections `## Titre` (le titre est retiré du corps). */
function splitSections(body: string): { title: string; text: string }[] {
  return body
    .split(/\n(?=##\s)/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [head, ...rest] = part.split('\n')
      return { title: head.replace(/^##\s+/, ''), text: rest.join('\n').trim() }
    })
}

/** Rendu minimal d'une ligne : `code` et **gras** (pas de lib Markdown dans le projet). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') ? (
          <code key={i} className="font-mono text-[0.85em] bg-muted px-1 py-0.5 rounded">{p.slice(1, -1)}</code>
        ) : p.startsWith('**') ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

function SectionBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter(Boolean)
  return (
    <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-foreground">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        if (lines.every(l => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="m-0 pl-5 list-disc flex flex-col gap-1">
              {lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*[-*]\s+/, '')} /></li>)}
            </ul>
          )
        }
        return <p key={i} className="m-0"><Inline text={block.replace(/\n/g, ' ')} /></p>
      })}
    </div>
  )
}

function Catalog({ onPick }: { onPick: (slug: string) => void }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter(c => !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="flex flex-col gap-3 p-4 min-h-0">
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher un cours…"
        aria-label="Rechercher un cours"
        className="h-9 text-sm"
      />
      <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Aucun cours trouvé.</p>}
        {filtered.map(c => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onPick(c.slug)}
            className="text-left rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors p-3 flex flex-col gap-1.5 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-heading font-bold text-sm text-foreground">{c.title}</span>
              <Badge variant="outline" className="text-[10px] uppercase shrink-0">{DIFFICULTY_LABEL[c.difficulty]}</Badge>
            </div>
            <span className="text-xs text-muted-foreground leading-snug">{c.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ActiveCourse({ slug }: { slug: string }) {
  const course = getCourse(slug)
  const { flowNodes, flowEdges } = useAppStore(useShallow(s => ({ flowNodes: s.flowNodes, flowEdges: s.flowEdges })))
  const [step, setStep] = useState(0)

  const sections = useMemo(() => (course ? splitSections(course.body) : []), [course])
  const evaluation = useMemo(
    () => (course ? evaluateCourseProgress(flowNodes, flowEdges, course.expected) : null),
    [course, flowNodes, flowEdges],
  )

  if (!course || !evaluation) {
    return <p className="p-4 text-sm text-muted-foreground">Cours introuvable.</p>
  }

  const current = sections[Math.min(step, sections.length - 1)]

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto min-h-0">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-bold text-base text-foreground m-0">{course.title}</h2>
          <Badge variant="outline" className="text-[10px] uppercase">{DIFFICULTY_LABEL[course.difficulty]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground m-0">{course.description}</p>
      </div>

      {/* Retour réactif : progression + indices dérivés du canvas */}
      <Card
        className="p-3 gap-2 border-border bg-muted/20"
        role="status"
        aria-live="polite"
        aria-label="Progression de l'exercice"
      >
        <div className="flex items-center justify-between text-xs font-bold">
          <span>Progression</span>
          <span className="font-mono">{evaluation.progressPercent}%</span>
        </div>
        <Progress value={evaluation.progressPercent} aria-label="Progression de l'exercice" />
        {evaluation.isComplete ? (
          <p className="flex items-center gap-1.5 m-0 text-xs font-bold text-success">
            <CheckCircle2 className="size-4 shrink-0" /> Objectif atteint ! Ton pipeline correspond au cours.
          </p>
        ) : (
          <ul className="m-0 pl-0 list-none flex flex-col gap-1">
            {evaluation.activeHints.map(h => (
              <li key={h} className="flex items-start gap-1.5 text-xs text-foreground/90">
                <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-warning" /> {h}
              </li>
            ))}
            {evaluation.missingTypes.length === 0 && evaluation.edgeMismatch && (
              <li className="flex items-start gap-1.5 text-xs text-foreground/90">
                <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-warning" />
                Tous les blocs sont posés : relie-les dans l&apos;ordre décrit par le cours.
              </li>
            )}
          </ul>
        )}
      </Card>

      {current && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-sm text-foreground m-0">{current.title}</h3>
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
              Étape {Math.min(step, sections.length - 1) + 1} sur {sections.length}
            </span>
          </div>
          <SectionBody text={current.text} />
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={step <= 0}
              onClick={() => setStep(s => Math.max(0, s - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="size-3.5" /> Précédent
            </Button>
            <Button
              size="sm"
              disabled={step >= sections.length - 1}
              onClick={() => setStep(s => Math.min(sections.length - 1, s + 1))}
              className="gap-1 text-xs"
            >
              Suivant <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Panneau compagnon : catalogue des cours, ou cours actif + retour réactif sur le canvas. */
function CourseCompanionPanel({ onClose }: { onClose?: () => void }) {
  const activeCourseSlug = useAppStore(s => s.activeCourseSlug)
  const setActiveCourseSlug = useAppStore(s => s.setActiveCourseSlug)
  const setCoursePanelOpen = useAppStore(s => s.setCoursePanelOpen)

  const close = onClose ?? (() => setCoursePanelOpen(false))

  return (
    <div className="flex flex-col h-full min-h-0 bg-card text-card-foreground" aria-label="Cours guidés">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {activeCourseSlug ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Retour au catalogue des cours"
              onClick={() => setActiveCourseSlug(null)}
            >
              <ArrowLeft className="size-4" />
            </Button>
          ) : (
            <GraduationCap className="size-4 text-primary shrink-0" aria-hidden="true" />
          )}
          <span className="font-heading font-bold text-sm truncate">
            {activeCourseSlug ? 'Cours en cours' : 'Cours guidés'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Fermer le panneau des cours" onClick={close}>
          <X className="size-4" />
        </Button>
      </div>

      {activeCourseSlug ? (
        <ActiveCourse key={activeCourseSlug} slug={activeCourseSlug} />
      ) : (
        <Catalog onPick={setActiveCourseSlug} />
      )}
    </div>
  )
}

export default memo(CourseCompanionPanel)
