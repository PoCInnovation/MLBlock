/* eslint-disable react-refresh/only-export-components -- TanStack Route: Route + component in same file */
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
        <div className="max-w-7xl mx-auto px-12 py-16 flex flex-col gap-3">
          <h1 className="font-heading text-3xl font-extrabold text-foreground">Cours introuvable</h1>
          <p className="text-secondary text-base">
            Ce cours n’existe pas. <Link to="/cours" className="text-accent font-bold">Retour au catalogue</Link>
          </p>
        </div>
      </SiteLayout>
    )
  }

  const treeItems = courseTreeItems(courses)
  const markdownSections = course.body.split(/(?=^## )/m).filter(Boolean)

  return (
    <SiteLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-6 max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-2">
              <div className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Sommaire des cours</div>
              {treeItems.map(group => (
                <div key={group.id} className="flex flex-col gap-1 mt-2">
                  <div className="font-heading font-bold text-xs text-foreground uppercase tracking-wider text-muted-foreground">{group.label}</div>
                  <div className="flex flex-col pl-2 gap-1 border-l border-border ml-1">
                    {group.children?.map((item: { id: string; label: string; href: string }) => (
                      <Link key={item.id} to={item.href} className={`text-sm py-1 no-underline ${item.id === course.slug ? 'text-accent font-bold' : 'text-secondary hover:text-foreground'}`}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6 flex-1 min-w-0">
            <nav className="flex text-sm text-secondary gap-2 items-center">
              <Link to="/" className="hover:text-foreground">Accueil</Link>
              <span>/</span>
              <Link to="/cours" className="hover:text-foreground">Cours</Link>
              <span>/</span>
              <span className="text-foreground font-semibold truncate">{course.title}</span>
            </nav>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground">{course.title}</h1>
              <p className="text-secondary text-base">{course.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={course.difficulty === 'facile' ? 'secondary' : course.difficulty === 'moyen' ? 'default' : 'destructive'} className="uppercase">
                  {course.difficulty}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {markdownSections.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-4">
                  {idx > 0 && <Separator className="my-2" />}
                  <div className="max-w-none text-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {section}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
