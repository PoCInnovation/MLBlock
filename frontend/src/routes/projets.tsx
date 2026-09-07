import { createFileRoute, redirect } from '@tanstack/react-router'
import ProjectsPage from '../pages/ProjectsPage'
import useAppStore from '../store/useAppStore'
import { getSession } from '../services/auth'
export const Route = createFileRoute('/projets')({
  beforeLoad: async () => {
    let user = useAppStore.getState().user
    if (!user) {
      try {
        const { session } = await getSession()
        if (session?.user) {
          useAppStore.getState().setUser(session.user)
          user = session.user
        }
      } catch {
        // ignore, will redirect
      }
    }
    const isDevDummy = import.meta.env.DEV && (import.meta.env.VITE_SUPABASE_URL ?? '').includes('dummy')
    if (!user && !isDevDummy) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProjectsPage,
})
