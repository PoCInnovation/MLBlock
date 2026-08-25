import { useState, useMemo } from 'react'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { TextInput, ToggleButtonGroup, ToggleButton, Grid, Card, Stack } from '@astryxdesign/core'
import SiteLayout from '../components/landing/SiteLayout'
import { courses } from '../content/cours'

export const Route = createFileRoute('/cours')({
  component: CoursCatalogPage,
})

function CoursCatalogPage() {
  const [q, setQ] = useState('')
  const [difficulty, setDifficulty] = useState('Tous')
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return courses.filter(c => {
      const matchQ = !query || c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
      const norm = difficulty.toLowerCase()
      const matchD = norm === 'tous' || norm === 'all' || c.difficulty === norm
      return matchQ && matchD
    })
  }, [q, difficulty])
  const pathname = useRouterState({ select: s => s.location.pathname })
  if (pathname !== '/cours') return <Outlet />
  return (
    <SiteLayout>
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px 0' }}>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 46, letterSpacing: '-.02em', margin: '0 0 8px' }}>Cours</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16, fontWeight: 600, margin: '0 0 24px' }}>
          Apprends à construire des pipelines pas à pas.
        </p>
        <Stack direction="vertical" gap={3}>
          <TextInput label="Rechercher un cours" isLabelHidden value={q} onChange={setQ} placeholder="Rechercher un cours…" />
          <ToggleButtonGroup type="single" label="Difficulté" value={difficulty} onChange={v => setDifficulty((v as string) || 'Tous')} size="sm">
            <Grid columns={4} gap={1.5}>
              <ToggleButton label="Tous" value="Tous" />
              <ToggleButton label="Facile" value="facile" />
              <ToggleButton label="Moyen" value="moyen" />
              <ToggleButton label="Difficile" value="difficile" />
            </Grid>
          </ToggleButtonGroup>
        </Stack>
      </section>
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 48px 64px' }}>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontWeight: 600 }}>Aucun cours disponible</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontWeight: 600 }}>Aucun cours trouvé</p>
        ) : (
          <Grid columns={3} gap={4}>
            {filtered.map(c => (
              <Link key={c.slug} to="/cours/$slug" params={{ slug: c.slug }} style={{ textDecoration: 'none' }}>
                <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{c.difficulty}</span>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--color-text)' }}>{c.title}</span>
                  <span style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{c.description}</span>
                </Card>
              </Link>
            ))}
          </Grid>
        )}
      </section>
    </SiteLayout>
  )
}
