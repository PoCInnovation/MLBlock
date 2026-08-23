import { createFileRoute, redirect } from '@tanstack/react-router'
import ProjectsPage from '../pages/ProjectsPage'
import useAppStore from '../store/useAppStore'

export const Route = createFileRoute('/projets')({
  beforeLoad: () => {
    const user = useAppStore.getState().user
    const isDevDummy = import.meta.env.DEV && (import.meta.env.VITE_SUPABASE_URL ?? '').includes('dummy')
    if (!user && !isDevDummy) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProjectsPage,
})
