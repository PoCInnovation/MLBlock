import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { TextInput, VStack, HStack } from '@astryxdesign/core'
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs'
import { TreeList } from '@astryxdesign/core/TreeList'
import { Heading, Text } from '@astryxdesign/core/Text'
import SiteLayout from '../components/landing/SiteLayout'
import { courses } from '../content/cours'

export const Route = createFileRoute('/cours')({
  component: CoursCatalogPage,
})

function CoursCatalogPage() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  useEffect(() => { document.title = 'Cours — MLBlock' }, [])
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return courses.filter(c => !query || c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
  }, [q])
  const treeItems = useMemo(() => {
    const byDiff = (diff: string) => filtered.filter(c => c.difficulty === diff).map(c => ({ id: c.slug, label: c.title, onClick: () => navigate({ to: '/cours/$slug', params: { slug: c.slug } }) }))
    return [
      { id: 'facile', label: 'Facile', isExpanded: true, children: byDiff('facile') },
      { id: 'moyen', label: 'Moyen', isExpanded: true, children: byDiff('moyen') },
      { id: 'difficile', label: 'Difficile', isExpanded: true, children: byDiff('difficile') },
    ]
  }, [filtered, navigate])
  const pathname = useRouterState({ select: s => s.location.pathname })
  if (pathname !== '/cours') return <Outlet />
  return (
    <SiteLayout>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 48px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 260, flexShrink: 0, position: 'sticky', top: 24 }}>
          <VStack gap={3}>
            <Breadcrumbs>
              <BreadcrumbItem href="/">Accueil</BreadcrumbItem>
              <BreadcrumbItem isCurrent>Cours</BreadcrumbItem>
            </Breadcrumbs>
            <Heading level={1}>Cours</Heading>
            <Text color="secondary">Apprends à construire des pipelines pas à pas.</Text>
            <TextInput label="Rechercher un cours" isLabelHidden value={q} onChange={setQ} placeholder="Rechercher un cours…" />
            <TreeList items={treeItems} />
          </VStack>
        </div>
        <VStack gap={3} style={{ flex: 1, minWidth: 0 }}>
          <HStack gap={2} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Text color="secondary">{filtered.length} cours</Text>
            <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'none' }}>← Accueil</Link>
          </HStack>
          {filtered.length === 0 ? (
            <Text color="secondary" style={{ textAlign: 'center', padding: '24px 0' }}>Aucun cours trouvé</Text>
          ) : (
            <Text color="secondary">Sélectionne un cours dans la liste à gauche.</Text>
          )}
        </VStack>
      </div>
    </SiteLayout>
  )
}
