/* eslint-disable react-refresh/only-export-components -- TanStack Route: Route + component in same file */
import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-col gap-3 w-64 shrink-0 sticky top-6">
            <nav className="flex text-sm text-secondary gap-2 items-center">
              <Link to="/" className="hover:text-foreground">Accueil</Link>
              <span>/</span>
              <span className="text-foreground font-semibold">Cours</span>
            </nav>
            <h1 className="font-heading text-3xl font-extrabold text-foreground">Cours</h1>
            <p className="text-secondary text-sm">Apprends à construire des pipelines pas à pas.</p>
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un cours…" />
            <div className="flex flex-col gap-2 mt-2">
              {treeItems.map(group => (
                <div key={group.id} className="flex flex-col gap-1">
                  <div className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">{group.label}</div>
                  <div className="flex flex-col pl-2 gap-1 border-l border-border ml-1">
                    {group.children?.map((item: { id: string; label: string; href: string }) => (
                      <Link key={item.id} to={item.href} className="text-sm text-secondary hover:text-accent py-1 no-underline">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-secondary text-sm">{filtered.length} cours</p>
              <Link to="/" className="text-accent font-bold no-underline">
                ← Accueil
              </Link>
            </div>
            {filtered.length === 0 ? (
              <p className="text-secondary text-center py-12">
                Aucun cours ne correspond à ta recherche.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {filtered.map(c => (
                  <Link
                    key={c.id}
                    to="/cours/$slug"
                    params={{ slug: c.slug }}
                    className="no-underline text-inherit group"
                  >
                    <Card className="p-5 bg-card border border-border rounded-2xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-accent flex flex-col justify-between h-full">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={
                              c.difficulty === 'facile'
                                ? 'text-success border-success/30 bg-success/10'
                                : c.difficulty === 'moyen'
                                  ? 'text-warning border-warning/30 bg-warning/10'
                                  : 'text-error border-error/30 bg-error/10'
                            }
                          >
                            {c.difficulty}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                            {c.sections.length} section{c.sections.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                          {c.title}
                        </h3>
                        <p className="text-sm text-secondary line-clamp-3 leading-relaxed">
                          {c.description}
                        </p>
                      </div>
                      <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-accent">
                        <span>Commencer le cours</span>
                        <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
