import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import { getSession, onAuthStateChange } from './services/auth'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'

export default function App() {
  const user  = useAppStore(s => s.user)
  const setUser = useAppStore(s => s.setUser)

  useEffect(() => {
    getSession().then(({ session }) => setUser(session?.user ?? null))
    const { data: { subscription } } = onAuthStateChange((session: any) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/editor" element={user ? <EditorPage /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
