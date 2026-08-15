import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import type { ReactNode } from 'react'
import useAppStore from './store/useAppStore'
import HomePage from './pages/HomePage'
const EditorPage = lazy(() => import('./pages/EditorPage'))
import ProjectsPage from './pages/ProjectsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAppStore(s => s.user)
  // Mode dev local (supabase dummy) : session factice pour valider le rendu
  // sans connexion réelle. Le backend accepte aussi (MLBLOCK_DEV_AUTH).
  const isDevDummy = import.meta.env.DEV && (import.meta.env.VITE_SUPABASE_URL ?? '').includes('dummy')
  useEffect(() => {
    if (!user && isDevDummy) {
      useAppStore.setState({ user: { id: 'd70e922c-8d40-464d-a5bf-f1b066c6b687', email: 'dev@poc.local' } })
    }
  }, [user, isDevDummy])
  if (!user && !isDevDummy) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/editor', element: <RequireAuth><Suspense fallback={<div className="h-screen flex items-center justify-center bg-bg text-text-muted font-heading text-lg">Chargement…</div>}><EditorPage /></Suspense></RequireAuth> },
  { path: '/projets', element: <RequireAuth><ProjectsPage /></RequireAuth> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/about', element: <AboutPage /> },
])
