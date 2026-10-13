import { createRootRoute, Outlet, HeadContent } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '../components/ui/sonner'
import useAppStore from '../store/useAppStore'
import { getSession, onAuthStateChange } from '../services/auth'
import { toServerPayload } from '../store/pipelineDocument'
import { writeStash } from '../utils/pending-stash'
import '../index.css'

export const Route = createRootRoute({
  beforeLoad: async () => {
    try {
      const { session } = await getSession()
      useAppStore.getState().setUser(session?.user ?? null)
    } catch {
      useAppStore.getState().setUser(null)
    }
  },
  component: function RootComponent() {
    const [queryClient] = useState(() => new QueryClient())
    const setUser = useAppStore((s) => s.setUser)

    useEffect(() => {
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

    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <HeadContent />
          <Outlet />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    )
  },
})
