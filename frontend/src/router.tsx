import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import useAppStore from './store/useAppStore'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import ProjectsPage from './pages/ProjectsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAppStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/editor', element: <RequireAuth><EditorPage /></RequireAuth> },
  { path: '/projets', element: <RequireAuth><ProjectsPage /></RequireAuth> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/about', element: <AboutPage /> },
])
