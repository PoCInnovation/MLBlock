import { useEffect } from 'react'
import useAppStore from './store/useAppStore'
import { getSession, onAuthStateChange } from './services/auth'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'

export default function App() {
  const screen = useAppStore(s => s.screen)
  const user  = useAppStore(s => s.user)
  const setUser = useAppStore(s => s.setUser)

  useEffect(() => {
    getSession().then(({ session }) => setUser(session?.user ?? null))
    const { data: { subscription } } = onAuthStateChange((session: any) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [setUser])

  if (screen === 'build') {
    if (!user) return <LoginPage />
    return <EditorPage />
  }
  if (screen === 'login')         return <LoginPage />
  if (screen === 'register')      return <RegisterPage />
  if (screen === 'how-it-works')  return <HowItWorksPage />
  if (screen === 'about')         return <AboutPage />
  return <HomePage />
}
