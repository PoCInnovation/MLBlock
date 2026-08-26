import { useRef, useState } from 'react'
import { Save, Play, Loader2, Upload, Download, Square, MoreVertical, FolderKanban, Trash2, LogOut, Check, Undo2, Redo2 } from 'lucide-react'
import { DropdownMenu } from '../ui/dropdown-menu'
import { useNavigate } from '@tanstack/react-router'
import useAppStore from '../../store/useAppStore'
import { signOut } from '../../services/auth'
import { getPipeline } from '../../api/client'
import { usePipelineImport } from '../../hooks/usePipelineImport'
import { useBlockRunner } from '../../hooks/useBlockRunner'
import ExportModal from '../ui/ExportModal'
import UnsavedChangesDialog from '../ui/UnsavedChangesDialog'
import { clearStash } from '../../utils/pending-stash'
import { theme } from '../../theme'

const ghostBtn: React.CSSProperties = { background: theme.color.surface3, color: theme.color.textLight, border: `1px solid ${theme.color.border}`, padding: '8px 14px', borderRadius: theme.radius.md, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 44, transition: 'background .15s ease, transform .15s ease' }
const actionBtn: React.CSSProperties = { ...ghostBtn, color: '#cfc6bd', padding: '9px 14px' }

export default function EditorHeader() {
  const navigate    = useNavigate()
  const projectName = useAppStore(s => s.projectName)
  const setProjectName = useAppStore(s => s.setProjectName)
  const setUser     = useAppStore(s => s.setUser)
  const savePipeline = useAppStore(s => s.savePipeline)
  const ensureDraft = useAppStore(s => s.ensureDraft)
  const showToast   = useAppStore(s => s.showToast)
  // Run : isPending = mutation + suivi job (start → terminal), isStopping = annulation en cours
  const { onRun, onStop, onClear, isPending, isStopping } = useBlockRunner() as { onRun: () => void; onStop: () => void; onClear: () => void; isPending: boolean; isStopping: boolean; jobId: string | null }
  // Arrêter actif tant qu'un run est en cours (isPending inclut jobId non terminal + stopping)
  const stopActive = isPending
  // Sélecteur dérivé : re-render uniquement quand l'état dirty change
  const dirty = useAppStore(s => s.isDirty())
  const canUndo = useAppStore(s => s.canUndo())
  const canRedo = useAppStore(s => s.canRedo())
  const undo = useAppStore(s => s.undo)
  const redo = useAppStore(s => s.redo)
  const { importFile } = usePipelineImport()

  const [saving, setSaving] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const commitName = () => {
    const name = draftName.trim()
    if (!name) return
    useAppStore.getState().commitUndoPoint()
    setProjectName(name)
    setEditingName(false)
  }

  const onSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePipeline(projectName.trim() || 'mon-premier-modèle')
      showToast({ kind: 'success', message: 'Projet sauvegardé' })
    } catch {
      showToast({ kind: 'error', message: 'Échec de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const onImportPicked = async (file: File) => {
    setImportError(null)
    const err = await importFile(file)
    if (err) setImportError(err)
  }

  return (
    <div
      className="editor-header floating-panel"
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.color.surface,
        border: `1px solid ${theme.color.border}`,
        borderRadius: theme.radius.xl,
        boxShadow: '0 8px 32px rgba(0,0,0,.12)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 20,
        gap: 16,
        transition: 'transform 200ms ease, opacity 200ms ease',
        willChange: 'transform, opacity',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <button type="button" onClick={() => navigate({ to: '/' })} aria-label="Retour à l'accueil" style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', background: 'none', border: 'none', padding: 0, margin: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadow.btn }}>
            <div style={{ width: 11, height: 11, background: '#fff', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: 19 }}>MLBlock</span>
        </button>
        <div style={{ width: 1, height: 26, background: theme.color.border }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.color.surface3, border: `1px solid ${theme.color.border}`, padding: '6px 12px', borderRadius: theme.radius.md, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.color.status, display: 'inline-block', flexShrink: 0 }} />
          {editingName ? (
            <input
              value={draftName}
              autoFocus
              onChange={e => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') { setDraftName(projectName); setEditingName(false) }
              }}
              style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.color.auth}`, outline: 'none', color: theme.color.text, fontWeight: 800, fontSize: 14, width: 'min(180px, 30vw)' }}
            />
          ) : (
            <button
              type="button"
              onClick={() => { setDraftName(projectName); setEditingName(true) }}
              title="Cliquer pour renommer"
              aria-label="Modifier le nom du projet"
              className="project-name"
              style={{ fontWeight: 800, fontSize: 14, cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,.28)', background: 'none', border: 'none', padding: 0, margin: 0 }}
            >
              {projectName}
            </button>
          )}
        </div>
      </div>
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Annuler (Ctrl+Z)"
          aria-label="Annuler"
          style={{ ...ghostBtn, padding: '9px 10px', opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'default' }}
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Rétablir (Ctrl+Shift+Z)"
          aria-label="Rétablir"
          style={{ ...ghostBtn, padding: '9px 10px', opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'default' }}
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={onSave}
          disabled={!dirty || saving}
          title={dirty ? 'Sauvegarder les modifications' : 'Aucune modification à sauvegarder'}
          style={{
            ...actionBtn,
            background: dirty ? 'rgba(34,197,94,.14)' : theme.color.surface3,
            color: dirty ? '#8fd1a8' : theme.color.textDim,
            border: dirty ? '1px solid rgba(34,197,94,.35)' : `1px solid ${theme.color.border}`,
            fontWeight: 800,
            opacity: saving ? 0.6 : 1,
            cursor: dirty && !saving ? 'pointer' : 'default',
          }}
        >
          {saving ? <Loader2 size={15} style={{ animation: 'mlbSpin .8s linear infinite' }} /> : dirty ? <Save size={15} /> : <Check size={15} />}
          {dirty ? 'Sauvegarder' : 'Sauvegardé'}
        </button>
        <button onClick={onStop} disabled={!stopActive} style={{ ...actionBtn, background: 'rgba(224,112,95,.16)', color: theme.color.accentLight, border: '1px solid rgba(224,112,95,.4)', fontWeight: 800, opacity: stopActive ? 1 : 0.35, cursor: stopActive ? 'pointer' : 'default' }}>
          {isStopping ? <Loader2 size={13} style={{ animation: 'mlbSpin .8s linear infinite' }} /> : <Square size={13} fill="currentColor" />} {isStopping ? 'Arrêt…' : 'Arrêter'}
        </button>
        <button onClick={onRun} disabled={isPending} style={{ color: '#fff', border: 'none', padding: '9px 20px', borderRadius: theme.radius.md, fontWeight: 800, fontSize: 14, minHeight: 44, cursor: isPending ? 'default' : 'pointer', boxShadow: theme.shadow.btn, display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.accent, opacity: isPending ? 0.6 : 1, transition: 'filter .15s ease, transform .15s ease' }}>
          {isPending ? <Loader2 size={15} style={{ animation: 'mlbSpin .8s linear infinite' }} /> : <Play size={15} fill="currentColor" />}
          {isPending ? 'Exécution…' : 'Lancer'}
        </button>
        <DropdownMenu
          button={{ label: 'Menu du projet', icon: <MoreVertical size={17} />, isIconOnly: true, variant: 'secondary' }}
          items={[
            { label: 'Importer', icon: <Upload size={15} />, onClick: () => fileRef.current?.click() },
            { label: 'Exporter', icon: <Download size={15} />, onClick: () => setExportOpen(true) },
            { type: 'divider' },
            { label: 'Mes projets', icon: <FolderKanban size={15} />, onClick: () => navigate({ to: '/projets' }) },
            { label: 'Tout effacer', icon: <Trash2 size={15} />, onClick: onClear },
            { type: 'divider' },
            { label: 'Déconnexion', icon: <LogOut size={15} />, variant: 'destructive', onClick: () => {
                const s = useAppStore.getState()
                if (s.isDirty() && s.user) setLogoutOpen(true)
                else { void signOut().then(() => { setUser(null); navigate({ to: '/' }) }) }
              } },
          ]}
        />
      </div>

      <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onImportPicked(f); e.target.value = '' }} />

      {importError && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, background: theme.color.surface3, border: `1px solid ${theme.color.error}`, color: theme.color.errorLight, padding: '10px 16px', borderRadius: theme.radius.md, fontWeight: 700, fontSize: 13, zIndex: 120 }}>
          {importError}
          <button onClick={() => setImportError(null)} aria-label="Fermer" style={{ marginLeft: 10, background: 'none', border: 'none', color: theme.color.errorLight, cursor: 'pointer', fontWeight: 900 }}>×</button>
        </div>
      )}

      {exportOpen && (
        <ExportModal
          title="Exporter"
          resolve={async () => {
            // Garantit une pipeline existante (brouillon si besoin) pour générer le code
            const id = await ensureDraft()
            return getPipeline(id)
          }}
          onClose={() => setExportOpen(false)}
        />
      )}

      <UnsavedChangesDialog
        open={logoutOpen}
        busy={logoutBusy}
        onSave={async () => {
          setLogoutBusy(true)
          try {
            const s = useAppStore.getState()
            await s.savePipeline(s.projectName.trim() || 'mon-premier-modèle')
            setLogoutOpen(false)
            await signOut()
            setUser(null)
            navigate({ to: '/' })
          } catch {
            useAppStore.getState().showToast({ kind: 'error', message: "Échec de la sauvegarde — la déconnexion est annulée" })
          } finally {
            setLogoutBusy(false)
          }
        }}
        onDiscard={() => {
          const u = useAppStore.getState().user as { id?: string } | null
          if (u?.id) clearStash(u.id)
          setLogoutOpen(false)
          // setUser(null) AVANT signOut : le handler de session-expirée (main.tsx)
          // ne doit pas re-stasher un logout intentionnel (user déjà null → skip)
          setUser(null)
          void signOut().then(() => navigate({ to: '/' }))
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  )
}
