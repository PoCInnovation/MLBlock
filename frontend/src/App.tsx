import useAppStore from './store/useAppStore'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AboutPage from './pages/AboutPage'

export default function App() {
  const screen = useAppStore(s => s.screen)
  if (screen === 'build')         return <EditorPage />
  if (screen === 'how-it-works')  return <HowItWorksPage />
  if (screen === 'about')         return <AboutPage />
  return <HomePage />
}
