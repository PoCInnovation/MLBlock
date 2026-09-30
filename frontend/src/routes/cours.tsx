/* eslint-disable react-refresh/only-export-components -- TanStack Route: Route + component in same file */
import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
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
              <p className="text-secondary text-center py-6">
                Aucun cours trouvé
              </p>
            ) : (
              <p className="text-secondary text-sm">Sélectionne un cours dans la liste à gauche.</p>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
