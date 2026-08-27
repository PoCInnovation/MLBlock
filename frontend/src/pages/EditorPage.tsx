import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBlocker, useNavigate, useSearch } from '@tanstack/react-router'
import { useUndoRedo } from '../hooks/useUndoRedo'
import useAppStore from '../store/useAppStore'
import { fetchCatalog, listPipelineJobs, getJobOutputs, getPipeline } from '../api/client'
import { toServerPayload } from '../utils/blockHelpers'
import { writeStash, readStash, clearStash } from '../utils/pending-stash'
import EditorHeader from '../components/editor/EditorHeader'
import SkipLink from '../components/ui/SkipLink'
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
  useUndoRedo()
  const search = useSearch({ from: '/editor' })
  const navigate = useNavigate({ from: '/editor' })
  const catalog      = useAppStore(s => s.catalog)
  const catalogError = useAppStore(s => s.catalogError)
  const pipelineId   = useAppStore(s => s.pipelineId)
  const restoredWork = useAppStore(s => s.restoredWork)
  const setRestoredWork = useAppStore(s => s.setRestoredWork)

  // Lectures serveur via TanStack Query (le store reste consommateur du catalogue)
  const urlPipelineId = (search.pipeline as string | undefined) ?? null
  const catalogQuery = useQuery({
    queryKey: ['catalog'],
    queryFn: fetchCatalog,
    staleTime: Infinity,
  })
  const pipelineQuery = useQuery({
    queryKey: ['pipeline', urlPipelineId],
    queryFn: () => getPipeline(urlPipelineId!),
    enabled: !!urlPipelineId,
  })

  // Garde de navigation : bloque toute sortie avec modifications non sauvegardées
  const blocker = useBlocker({
    shouldBlockFn: () => useAppStore.getState().isDirty(),
    withResolver: true,
    enableBeforeUnload: () => useAppStore.getState().isDirty(),
  })
  const [guardOpen, setGuardOpen] = useState(false)
  const [guardBusy, setGuardBusy] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronisation avec un état externe (bloqueur) : seule façon de réagir au passage en « blocked ».
    if (blocker.status === 'blocked') setGuardOpen(true)
  }, [blocker.status])

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

  // Pipeline de l'URL : chargé via Query, appliqué seulement si le canvas
  // est vide et qu'aucun travail restauré n'a la priorité.
  useEffect(() => {
    const d = pipelineQuery.data
    if (!d) return
    const s = useAppStore.getState()
    if (s.flowNodes.length === 0 && !s.restoredWork) {
      s.loadPipeline(d.nodes, d.edges, d.id, d.name)
    }
  }, [pipelineQuery.data])

  // Miroir zustand → URL : le pipeline ouvert est partageable
  // pony: ne pas effacer ?pipeline=xxx au refresh tant que le store est vide (la query charge encore)
  useEffect(() => {
    if (urlPipelineId && !pipelineId) return
    const nextSearch = pipelineId ? { pipeline: pipelineId } : {}
    const curr = (search.pipeline as string | undefined) ?? null
    if (curr !== pipelineId) {
      navigate({ search: nextSearch as never, replace: true })
    }
  }, [pipelineId, urlPipelineId, navigate, search.pipeline])

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

  // Catalogue : synchronisation Query → store (le store reste la source du rendu)
  useEffect(() => {
    if (catalogQuery.data) useAppStore.getState().setCatalog(catalogQuery.data)
  }, [catalogQuery.data])

  useEffect(() => {
    if (catalogQuery.error) {
      useAppStore.getState().setCatalogError(
        true,
        'Impossible de joindre le serveur. Le backend est peut-être en veille, réessaie dans quelques minutes.'
      )
    }
  }, [catalogQuery.error])

  if (catalogError) return <EditorUnavailableModal />

  if (!catalog) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg text-text-muted font-heading text-lg">
        Chargement…
      </div>
    )
  }
  return (
    <main id="main" style={{ height: '100vh', background: theme.color.bg, color: theme.color.text, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SkipLink />
      <div
        className="editor-outer"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
          flex: 1,
          minHeight: 0,
        }}
      >
        <EditorHeader />
        {restoredWork && (
          <div className="flex items-center justify-between gap-3 px-4 py-[9px] bg-[rgba(143,209,168,.13)] border border-[rgba(143,209,168,.35)] text-success-muted text-[13px] font-bold shrink-0" style={{ borderRadius: theme.radius.xl }}>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} /> Travail récupéré — clique sur Sauvegarder pour conserver</span>
            <button onClick={() => setRestoredWork(false)} className="bg-none border-none text-success-muted cursor-pointer font-black text-sm" aria-label="Fermer">×</button>
          </div>
        )}
        <div
          className="floating-panel floating-canvas"
          style={{
            flex: 1,
            borderRadius: theme.radius.xl,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,.12)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: theme.color.canvas,
          }}
        >
          <FlowCanvas />
        </div>
      </div>
      <Toast />
      <UnsavedChangesDialog
        open={guardOpen}
        busy={guardBusy}
        onSave={() => leaveGuard(true)}
        onDiscard={() => leaveGuard(false)}
        onCancel={() => { setGuardOpen(false); blocker.reset?.() }}
      />
    </main>
  )
}
