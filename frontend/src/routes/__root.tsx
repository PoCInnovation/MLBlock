import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { getSession, onAuthStateChange } from '../services/auth'
import { toServerPayload } from '../utils/blockHelpers'
import { writeStash } from '../utils/pending-stash'
import '../index.css'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral/theme.css'

export const Route = createRootRoute({
  component: function RootComponent() {
    const [queryClient] = useState(() => new QueryClient())
    const setUser = useAppStore((s) => s.setUser)
    const [authReady, setAuthReady] = useState(false)

    useEffect(() => {
      getSession()
        .then(({ session }) => {
          setUser(session?.user ?? null)
          setAuthReady(true)
        })
        .catch(() => {
          setUser(null)
          setAuthReady(true)
        })
      const {
        data: { subscription },
      } = onAuthStateChange((session) => {
        const s = useAppStore.getState()
        const prev = s.user as { id?: string } | null
        if (!session && prev?.id && s.isDirty()) {
          const { nodes, edges } = toServerPayload(s)
          writeStash(prev.id, {
            name: s.projectName,
            nodes,
            edges,
            pipelineId: s.pipelineId,
            savedAt: new Date().toISOString(),
          })
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

    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    )
  },
})
