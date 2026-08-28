/* eslint-disable react-refresh/only-export-components -- TanStack Route: Route + component in same file */
import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { TextInput, VStack, HStack } from '@astryxdesign/core'
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs'
import { TreeList } from '@astryxdesign/core/TreeList'
import { Heading, Text } from '@astryxdesign/core/Text'
import SiteLayout from '../components/landing/SiteLayout'
import { courses, courseTreeItems } from '../content/cours'

const base = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://mlblock-frontend.onrender.com'

export const Route = createFileRoute('/cours')({
  head: () => ({
    meta: [
      { title: 'Cours — MLBlock' },
      { name: 'description', content: 'Apprends à construire des pipelines pas à pas.' },
      { property: 'og:title', content: 'Cours — MLBlock' },
      { property: 'og:description', content: 'Apprends à construire des pipelines pas à pas.' },
      { property: 'og:image', content: `${base}/poc-logo.png` },
      { property: 'og:type', content: 'website' },
    ],
    links: [{ rel: 'canonical', href: `${base}/cours` }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Comment suivre un cours ?', acceptedAnswer: { '@type': 'Answer', text: 'Choisis un cours dans la liste et suis les sections.' } },
          ],
        }),
      },
    ],
  }),
  component: CoursCatalogPage,
})

function CoursCatalogPage() {
  const [q, setQ] = useState('')
  useEffect(() => { document.title = 'Cours — MLBlock' }, [])
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return courses.filter(c => !query || c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
  }, [q])
  const treeItems = useMemo(() => courseTreeItems(filtered), [filtered])
  const pathname = useRouterState({ select: s => s.location.pathname })
  if (pathname !== '/cours') return <Outlet />
  return (
    <SiteLayout>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 48px' }}>
        <HStack gap={6} style={{ alignItems: 'flex-start' }}>
          <VStack gap={3} style={{ width: 260, flexShrink: 0, position: 'sticky', top: 24 }}>
            <Breadcrumbs>
              <BreadcrumbItem href="/">Accueil</BreadcrumbItem>
              <BreadcrumbItem isCurrent>Cours</BreadcrumbItem>
            </Breadcrumbs>
            <Heading level={1}>Cours</Heading>
            <Text color="secondary">Apprends à construire des pipelines pas à pas.</Text>
            <TextInput label="Rechercher un cours" isLabelHidden value={q} onChange={setQ} placeholder="Rechercher un cours…" />
            <TreeList items={treeItems} />
          </VStack>
          <VStack gap={3} style={{ flex: '1 1 0%', minWidth: 0 }}>
            <HStack gap={2} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text color="secondary">{filtered.length} cours</Text>
              <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'none' }}>
                ← Accueil
              </Link>
            </HStack>
            {filtered.length === 0 ? (
              <Text color="secondary" style={{ textAlign: 'center', padding: '24px 0' }}>
                Aucun cours trouvé
              </Text>
            ) : (
              <Text color="secondary">Sélectionne un cours dans la liste à gauche.</Text>
            )}
          </VStack>
        </HStack>
      </div>
    </SiteLayout>
  )
}
