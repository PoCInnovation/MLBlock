import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button, Divider, Stack } from '@astryxdesign/core'
import { Markdown } from '@astryxdesign/core'
import SiteLayout from '../components/landing/SiteLayout'
import { getCourse } from '../content/cours'

export const Route = createFileRoute('/cours/$slug')({
  component: CoursDetailPage,
})

function CoursDetailPage() {
  const { slug } = Route.useParams()
  const course = getCourse(slug)
  const containerRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  const sections = course?.sections ?? []

  useEffect(() => {
    document.title = course ? `${course.title} — MLBlock` : 'Cours introuvable — MLBlock'
  }, [course])

  const jump = (i: number) => {
    const id = sections[i]?.id
    if (!id || !containerRef.current) return
    const el = containerRef.current.querySelector(`#${CSS.escape(id)}`)
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'start' })
      setIdx(i)
    } else {
      // fallback: heading via markdown heading component may use same id
      document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
      setIdx(i)
    }
  }

  if (!course) {
    return (
      <SiteLayout>
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px' }}>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, fontWeight: 600 }}>Cours introuvable</h1>
          <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Ce cours n’existe pas. <Link to="/cours" style={{ color: 'var(--color-accent)' }}>Retour au catalogue</Link>
          </p>
        </section>
      </SiteLayout>
    )
  }

  const hasNav = sections.length > 0

  return (
    <SiteLayout>
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '32px 48px 16px' }}>
        <Link to="/cours" style={{ color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>← Retour au catalogue</Link>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 38, margin: '12px 0 6px' }}>{course.title}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 600, margin: 0 }}>{course.description}</p>
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{course.difficulty}</div>
      </section>
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 48px 24px' }}>
        <Stack direction="horizontal" gap={2} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--color-bg)', padding: '8px 0' }}>
          <Button label="Précédent" variant="ghost" onClick={() => jump(idx - 1)} isDisabled={!hasNav || idx === 0} />
          <Button label="Suivant" variant="ghost" onClick={() => jump(idx + 1)} isDisabled={!hasNav || idx === sections.length - 1} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', alignSelf: 'center', marginLeft: 8 }}>
            {hasNav ? `${idx + 1} / ${sections.length}` : ''}
          </span>
        </Stack>
        <div ref={containerRef} style={{ marginTop: 16 }}>
          <Markdown>{course.body}</Markdown>
        </div>
        {hasNav && <Divider style={{ margin: '24px 0 16px' }} />}
        <Stack direction="horizontal" gap={2} style={{ justifyContent: 'space-between' }}>
          <Button label="Précédent" variant="ghost" onClick={() => jump(idx - 1)} isDisabled={idx === 0} />
          <Button label="Suivant" variant="ghost" onClick={() => jump(idx + 1)} isDisabled={idx === sections.length - 1} />
        </Stack>
      </section>
    </SiteLayout>
  )
}
