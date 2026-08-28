/* eslint-disable react-refresh/only-export-components -- TanStack Route: Route + component in same file */
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Badge, Blockquote, Divider, HStack, VStack } from '@astryxdesign/core'
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs'
import { Markdown } from '@astryxdesign/core'
import { TreeList } from '@astryxdesign/core/TreeList'
import { Outline, parseOutlineFromMarkdown } from '@astryxdesign/core/Outline'
import { Heading, Text } from '@astryxdesign/core/Text'
import SiteLayout from '../components/landing/SiteLayout'
import { courses, courseTreeItems, getCourse } from '../content/cours'

const base = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://mlblock-frontend.onrender.com'

export const Route = createFileRoute('/cours/$slug')({
  loader: ({ params }) => {
    const course = getCourse(params.slug)
    if (!course) throw notFound()
    return { course }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.course) return { meta: [{ title: 'Cours introuvable — MLBlock' }] }
    const c = loaderData.course
    return {
      meta: [
        { title: `${c.title} — MLBlock` },
        { name: 'description', content: c.description },
        { property: 'og:title', content: c.title },
        { property: 'og:description', content: c.description },
        { property: 'og:image', content: `${base}/poc-logo.png` },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [{ rel: 'canonical', href: `${base}/cours/${c.slug}` }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: c.title,
            description: c.description,
            provider: { '@type': 'Organization', name: 'MLBlock' },
            educationalLevel: c.difficulty,
          }),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: `Comment suivre ${c.title} ?`, acceptedAnswer: { '@type': 'Answer', text: c.description } },
            ],
          }),
        },
      ],
    }
  },
  component: CoursDetailPage,
})

function CoursDetailPage() {
  const { course } = Route.useLoaderData()

  if (!course) {
    return (
      <SiteLayout>
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 48px' }}>
          <Heading level={1}>Cours introuvable</Heading>
          <Text color="secondary">
            Ce cours n’existe pas. <Link to="/cours" style={{ color: 'var(--color-accent)' }}>Retour au catalogue</Link>
          </Text>
        </section>
      </SiteLayout>
    )
  }

  const difficultyVariant = course.difficulty === 'facile' ? 'neutral' : course.difficulty === 'moyen' ? 'info' : 'warning'
  const treeItems = courseTreeItems(courses)
  const outlineItems = parseOutlineFromMarkdown(course.body)
  const markdownSections = course.body.split(/(?=^## )/m).filter(Boolean)
  const markdownComponents = {
    blockquote: ({ children }: { children: React.ReactNode }) => <Blockquote>{children}</Blockquote>,
  }

  return (
    <SiteLayout>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 48px' }}>
        <HStack gap={6} style={{ alignItems: 'flex-start' }}>
          <VStack style={{ width: 260, flexShrink: 0, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
            <TreeList items={treeItems} />
          </VStack>
          <VStack gap={4} style={{ flex: '1 1 0%', minWidth: 0 }}>
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
            <VStack gap={4}>
              {markdownSections.map((section, idx) => (
                <VStack key={idx} gap={4}>
                  <Divider />
                  <Markdown components={markdownComponents}>{section}</Markdown>
                </VStack>
              ))}
            </VStack>
          </VStack>
          {outlineItems.length > 0 && (
            <VStack style={{ width: 240, flexShrink: 0, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
              <Outline items={outlineItems} />
            </VStack>
          )}
        </HStack>
      </div>
    </SiteLayout>
  )
}
