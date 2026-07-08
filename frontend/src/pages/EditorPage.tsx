import { useEffect } from 'react'
import { useBlockRunner } from '../hooks/useBlockRunner'
import useAppStore from '../store/useAppStore'
import { fetchCatalog } from '../api/client'
import EditorHeader from '../components/editor/EditorHeader'
import EditorLayout from '../components/editor/EditorLayout'
import EditorUnavailableModal from '../components/ui/EditorUnavailableModal'

export default function EditorPage() {
  const { onRun, onStop, onClear } = useBlockRunner()
  const catalog      = useAppStore(s => s.catalog)
  const catalogError = useAppStore(s => s.catalogError)

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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#171311', color: '#9a9088', fontFamily: "'Fredoka', sans-serif", fontSize: 18 }}>
        Chargement…
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#171311', color: '#f0e9e3', overflow: 'hidden' }}>
      <EditorHeader onRun={onRun} onStop={onStop} onClear={onClear} />
      <EditorLayout />
    </div>
  )
}
