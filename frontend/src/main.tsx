/* eslint-disable react-refresh/only-export-components -- Fichier d'entrée Vite : les
   composants racine sont définis ici volontairement, aucun HMR attendu sur l'entrée. */
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import useAppStore from './store/useAppStore'
import { getSession, onAuthStateChange } from './services/auth'
import { toServerPayload } from './utils/blockHelpers'
import { writeStash } from './utils/pending-stash'
import { routeTree } from './routeTree.gen'
import '@astryxdesign/core/astryx.css'
import './index.css'
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function Root() {
  const setUser = useAppStore(s => s.setUser)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    getSession()
      .then(({ session }) => {
        setUser(session?.user ?? null)
        setAuthReady(true)
      })
      .catch(() => {
        // Session illisible (refresh réseau, localStorage corrompu) : on rend
        // quand même (landing/login) — jamais de splash infini.
        setUser(null)
        setAuthReady(true)
      })
    const { data: { subscription } } = onAuthStateChange((session) => {
      // Session perdue (expiration, logout externe) avec travail non sauvegardé :
      // stash le pipeline pour récupération après reconnexion.
      const s = useAppStore.getState()
      const prev = s.user as { id?: string } | null
      if (!session && prev?.id && s.isDirty()) {
        const { nodes, edges } = toServerPayload(s)
        writeStash(prev.id, { name: s.projectName, nodes, edges, pipelineId: s.pipelineId, savedAt: new Date().toISOString() })
      }
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [setUser])

  if (!authReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg text-text-muted font-heading text-lg">
        Chargement…
      </div>
    )
  }

  return <RouterProvider router={router} />
}

function App() {
  // Client Query singleton (état serveur) — recréé une seule fois.
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
