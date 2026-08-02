import { useEffect } from 'react'
import { useBlockRunner } from '../hooks/useBlockRunner'
import useAppStore from '../store/useAppStore'
import { fetchCatalog } from '../api/client'
import EditorHeader from '../components/editor/EditorHeader'
import EditorLayout from '../components/editor/EditorLayout'
import EditorUnavailableModal from '../components/ui/EditorUnavailableModal'
import FlowCanvas from '../components/flow/FlowCanvas'
import { theme } from '../theme'

export default function EditorPage() {
  const { onRun, onStop, onClear } = useBlockRunner()
  const catalog      = useAppStore(s => s.catalog)
  const catalogError = useAppStore(s => s.catalogError)
  const editorMode   = useAppStore(s => s.editorMode)

  useEffect(() => {
    fetchCatalog()
      .then(data => useAppStore.getState().setCatalog(data))
      .catch((err) => {
        const isNetworkError = !err?.response
        useAppStore.getState().setCatalogError(
          true,
          isNetworkError
            ? 'Impossible de joindre le serveur. Vérifie que le backend est lancé et réessaie.'
            : `Réponse inattendue du serveur (${String(err?.response?.status ?? '?')}). Vérifie la version du backend.`
        )
      })
  }, [])

  if (catalogError) return <EditorUnavailableModal />

  if (!catalog) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.color.bg, color: '#9a9088', fontFamily: theme.font.heading, fontSize: 18 }}>
        Chargement…
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: theme.color.bg, color: theme.color.text, overflow: 'hidden' }}>
      <EditorHeader onRun={onRun} onStop={onStop} onClear={onClear} />
      {editorMode === 'linear' ? <EditorLayout /> : <FlowCanvas />}
    </div>
  )
}
