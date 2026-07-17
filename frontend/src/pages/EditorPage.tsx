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
        const status = err?.response?.status
        const isNetworkError = !err?.response
        useAppStore.getState().setCatalogError(
          true,
          isNetworkError
            ? 'Impossible de joindre le serveur. Vérifie que le backend est lancé et réessaie.'
            : status === 401
            ? 'Authentification manquante — token de dev requis. Active VITE_DEV_MODE=true dans .env.local.'
            : `Réponse inattendue du serveur (${String(status ?? '?')}). Vérifie la version du backend.`
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
