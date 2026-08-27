import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Badge, Divider, HStack, VStack } from '@astryxdesign/core'
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs'
import { Markdown } from '@astryxdesign/core'
import { TreeList } from '@astryxdesign/core/TreeList'
import { Outline } from '@astryxdesign/core/Outline'
import { Heading, Text } from '@astryxdesign/core/Text'
import SiteLayout from '../components/landing/SiteLayout'
import { courses, getCourse } from '../content/cours'

export const Route = createFileRoute('/cours/$slug')({
  component: CoursDetailPage,
})

function CoursDetailPage() {
  const { slug } = Route.useParams()
  const course = getCourse(slug)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = course ? `${course.title} — MLBlock` : 'Cours introuvable — MLBlock'
    if (!course) return
    const desc = course.description
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = desc
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    const href = `${window.location.origin}/cours/${course.slug}`
    if (link) link.href = href
    else { const l = document.createElement('link'); l.rel = 'canonical'; l.href = href; document.head.appendChild(l) }
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: desc,
      provider: { '@type': 'Organization', name: 'MLBlock' },
      educationalLevel: course.difficulty,
    }
    let s = document.getElementById('ld-course') as HTMLScriptElement | null
    if (!s) { s = document.createElement('script'); s.id = 'ld-course'; s.type = 'application/ld+json'; document.head.appendChild(s) }
    s.textContent = JSON.stringify(ld)
  }, [course])

  if (!course) {
    return (
      <SiteLayout>
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px' }}>
          <Heading level={1}>Cours introuvable</Heading>
          <Text color="secondary">Ce cours n’existe pas. <Link to="/cours" style={{ color: 'var(--color-accent)' }}>Retour au catalogue</Link></Text>
        </section>
      </SiteLayout>
    )
  }

  const difficultyVariant = course.difficulty === 'facile' ? 'neutral' : course.difficulty === 'moyen' ? 'info' : 'warning'
  const treeItems = [
    { id: 'facile', label: 'Facile', isExpanded: true, children: courses.filter(c => c.difficulty === 'facile').map(c => ({ id: c.slug, label: c.title, onClick: () => navigate({ to: '/cours/$slug', params: { slug: c.slug } }) })) },
    { id: 'moyen', label: 'Moyen', isExpanded: true, children: courses.filter(c => c.difficulty === 'moyen').map(c => ({ id: c.slug, label: c.title, onClick: () => navigate({ to: '/cours/$slug', params: { slug: c.slug } }) })) },
    { id: 'difficile', label: 'Difficile', isExpanded: true, children: courses.filter(c => c.difficulty === 'difficile').map(c => ({ id: c.slug, label: c.title, onClick: () => navigate({ to: '/cours/$slug', params: { slug: c.slug } }) })) },
  ]
  const outlineItems = (course.sections ?? []).map(s => ({ id: s.id, label: s.title, level: 2 as const }))

  return (
    <SiteLayout>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 48px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 260, flexShrink: 0, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
          <TreeList items={treeItems} />
        </div>
        <VStack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Breadcrumbs>
            <BreadcrumbItem href="/">Accueil</BreadcrumbItem>
            <BreadcrumbItem href="/cours">Cours</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{course.title}</BreadcrumbItem>
          </Breadcrumbs>
          <VStack gap={2}>
            <Heading level={1}>{course.title}</Heading>
            <Text color="secondary">{course.description}</Text>
            <HStack gap={2} style={{ alignItems: 'center' }}>
              <Badge label={course.difficulty} variant={difficultyVariant as never} />
            </HStack>
          </VStack>
          <Divider />
          <div>
            <Markdown>{course.body}</Markdown>
          </div>
        </VStack>
        {outlineItems.length > 0 && (
          <div style={{ width: 240, flexShrink: 0, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
            <Outline items={outlineItems} />
          </div>
        )}
      </div>
    </SiteLayout>
  )
}
