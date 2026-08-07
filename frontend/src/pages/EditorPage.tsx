import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { useBlockRunner } from '../hooks/useBlockRunner'
import useAppStore from '../store/useAppStore'
import { fetchCatalog, listPipelineJobs, getJobOutputs } from '../api/client'
import { toServerPayload } from '../utils/blockHelpers'
import { writeStash, readStash, clearStash } from '../utils/pending-stash'
import EditorHeader from '../components/editor/EditorHeader'
import EditorUnavailableModal from '../components/ui/EditorUnavailableModal'
import UnsavedChangesDialog from '../components/ui/UnsavedChangesDialog'
import Toast from '../components/ui/Toast'
import { CheckCircle2 } from 'lucide-react'
import FlowCanvas from '../components/flow/FlowCanvas'
import { theme } from '../theme'

function stashIfDirty(): void {
  const s = useAppStore.getState()
  const u = s.user as { id?: string } | null
  if (!u?.id || !s.isDirty()) return
  const { nodes, edges } = toServerPayload(s)
  writeStash(u.id, { name: s.projectName, nodes, edges, pipelineId: s.pipelineId, savedAt: new Date().toISOString() })
}

export default function EditorPage() {
  const { onRun, onStop, onClear } = useBlockRunner()
  const catalog      = useAppStore(s => s.catalog)
  const catalogError = useAppStore(s => s.catalogError)
  const pipelineId   = useAppStore(s => s.pipelineId)
  const restoredWork = useAppStore(s => s.restoredWork)
  const setRestoredWork = useAppStore(s => s.setRestoredWork)

  // Garde de navigation : bloque toute sortie avec modifications non sauvegardées
  const blocker = useBlocker(() => useAppStore.getState().isDirty())
  const [guardOpen, setGuardOpen] = useState(false)
  const [guardBusy, setGuardBusy] = useState(false)

  useEffect(() => {
    if (blocker.state === 'blocked') setGuardOpen(true)
  }, [blocker.state])

  const leaveGuard = async (save: boolean) => {
    setGuardBusy(true)
    try {
      if (save) {
        const s = useAppStore.getState()
        await s.savePipeline(s.projectName.trim() || 'mon-premier-modèle')
      } else {
        const u = useAppStore.getState().user as { id?: string } | null
        if (u?.id) clearStash(u.id)
      }
      setGuardOpen(false)
      blocker.proceed?.()
    } catch {
      useAppStore.getState().showToast({ kind: 'error', message: "Échec de la sauvegarde — le projet n'a pas été enregistré" })
    } finally {
      setGuardBusy(false)
    }
  }

  // Refresh / fermeture d'onglet : stash de récupération + prompt natif
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      stashIfDirty()
      if (useAppStore.getState().isDirty()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Restauration d'un travail non sauvegardé (session expirée ou refresh)
  useEffect(() => {
    const s = useAppStore.getState()
    const u = s.user as { id?: string } | null
    if (!u?.id) return
    const stash = readStash(u.id)
    if (!stash) return
    clearStash(u.id)
    s.loadPipeline(stash.nodes, stash.edges, stash.pipelineId ?? '', stash.name)
    if (!stash.pipelineId) useAppStore.setState({ pipelineId: null })
    // Le toast sera montré par l'effet catalogue, une fois le rendu final en place
    useAppStore.getState().setRestoredWork(true)
  }, [])

  // Projet ouvert : recharge les résultats du dernier run (persistés en db)
  useEffect(() => {
    if (!pipelineId) return
    const store = useAppStore.getState()
    if (store.lastJobId) return
    let cancelled = false
    listPipelineJobs(pipelineId)
      .then(jobs => {
        if (cancelled || jobs.length === 0) return
        const last = jobs[0]
        store.setLastJob(last)
        return getJobOutputs(last.id)
      })
      .then(outputs => {
        if (!cancelled && outputs) store.setResults(outputs)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pipelineId])

  useEffect(() => {
    let cancelled = false
    let retries = 0
    const MAX_RETRIES = 5

    async function tryLoad() {
      try {
        const data = await fetchCatalog()
        if (!cancelled) {
          useAppStore.getState().setCatalog(data)
        }
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
      {restoredWork && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 16px', background: 'rgba(143,209,168,.13)', borderBottom: '1px solid rgba(143,209,168,.35)', color: theme.color.successMuted, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={15} /> Travail récupéré — clique sur Sauvegarder pour conserver</span>
          <button onClick={() => setRestoredWork(false)} style={{ background: 'none', border: 'none', color: theme.color.successMuted, cursor: 'pointer', fontWeight: 900, fontSize: 14 }} aria-label="Fermer">×</button>
        </div>
      )}
      <FlowCanvas />
      <Toast />
      <UnsavedChangesDialog
        open={guardOpen}
        busy={guardBusy}
        onSave={() => leaveGuard(true)}
        onDiscard={() => leaveGuard(false)}
        onCancel={() => { setGuardOpen(false); blocker.reset?.() }}
      />
    </div>
  )
}
