import { useEffect } from 'react'
import { useBlockRunner } from '../hooks/useBlockRunner'
import useAppStore from '../store/useAppStore'
import { fetchCatalog } from '../api/client'
import EditorHeader from '../components/editor/EditorHeader'
import EditorLayout from '../components/editor/EditorLayout'
import EditorUnavailableModal from '../components/ui/EditorUnavailableModal'
import Toast from '../components/ui/Toast'
import FlowCanvas from '../components/flow/FlowCanvas'
import { theme } from '../theme'

export default function EditorPage() {
  const { onRun, onStop, onClear } = useBlockRunner()
  const catalog      = useAppStore(s => s.catalog)
  const catalogError = useAppStore(s => s.catalogError)
  const editorMode   = useAppStore(s => s.editorMode)

  useEffect(() => {
    let cancelled = false
    let retries = 0
    const MAX_RETRIES = 5

    async function tryLoad() {
      try {
        const data = await fetchCatalog()
        if (!cancelled) useAppStore.getState().setCatalog(data)
      } catch {
        retries++
        if (!cancelled && retries < MAX_RETRIES) {
          setTimeout(tryLoad, 15_000)
        } else if (!cancelled) {
          useAppStore.getState().setCatalogError(
            true,
            'Impossible de joindre le serveur. Le backend est peut-être en veille, réessaie dans quelques minutes.'
          )
        }
      }
    }

    tryLoad()
    return () => { cancelled = true }
  }, [])

  if (catalogError) return <EditorUnavailableModal />

  if (!catalog) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.color.bg, color: theme.color.textMuted, fontFamily: theme.font.heading, fontSize: 18 }}>
        Chargement…
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: theme.color.bg, color: theme.color.text, overflow: 'hidden' }}>
      <EditorHeader onRun={onRun} onStop={onStop} onClear={onClear} />
      {editorMode === 'linear' ? <EditorLayout /> : <FlowCanvas />}
      <Toast />
    </div>
  )
}
