import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import { getSession, onAuthStateChange } from './services/auth'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import ProjectsPage from './pages/ProjectsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'
import { theme } from './theme'

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

export default function App() {
  const user  = useAppStore(s => s.user)
  const setUser = useAppStore(s => s.setUser)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    getSession().then(({ session }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    const { data: { subscription } } = onAuthStateChange((session: any) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [setUser])

  if (!authReady) {
    return <div style={splashStyle}>Chargement…</div>
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/editor" element={user ? <EditorPage /> : <Navigate to="/login" replace />} />
      <Route path="/projets" element={user ? <ProjectsPage /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
