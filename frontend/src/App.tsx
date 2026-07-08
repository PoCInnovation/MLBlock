import useAppStore from './store/useAppStore'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'

export default function App() {
  const screen = useAppStore(s => s.screen)
  return screen === 'build' ? <EditorPage /> : <HomePage />
}
