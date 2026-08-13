import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import { getSession, onAuthStateChange } from './services/auth'
import { toServerPayload } from './utils/blockHelpers'
import { writeStash } from './utils/pending-stash'
import { router } from './router'
import { theme } from './theme'
import './index.css'

const splashStyle: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.color.bg,
  color: theme.color.textMuted,
  fontFamily: theme.font.heading,
  fontSize: 18,
}

function Root() {
  const setUser = useAppStore(s => s.setUser)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    getSession().then(({ session }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    const { data: { subscription } } = onAuthStateChange((session: any) => {
      // Session perdue (expiration, logout externe) avec travail non sauvegardé :
      // stash le pipeline pour récupération après reconnexion.
      const s = useAppStore.getState()
      const prev = s.user as { id?: string } | null
      if (!session && prev?.id && s.isDirty()) {
        const { nodes, edges } = toServerPayload(s)
        writeStash(prev.id, { name: s.projectName, nodes, edges, pipelineId: s.pipelineId, savedAt: new Date().toISOString(), columns: s.columns })
      }
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [setUser])

  if (!authReady) {
    return <div style={splashStyle}>Chargement…</div>
  }

  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
