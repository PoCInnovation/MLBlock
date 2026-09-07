import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import EditorPage from '../pages/EditorPage'
import useAppStore from '../store/useAppStore'
import { getSession } from '../services/auth'

const editorSearchSchema = z.object({
  pipeline: z.string().uuid().optional(),
})

export const Route = createFileRoute('/editor')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = editorSearchSchema.safeParse(search)
    return parsed.success ? parsed.data : { pipeline: undefined }
  },
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
        // ignore
      }
    }
    const isDevDummy = import.meta.env.DEV && (import.meta.env.VITE_SUPABASE_URL ?? '').includes('dummy')
    if (!user && !isDevDummy) {
      throw redirect({ to: '/login' })
    }
  },
  component: EditorPage,
})
