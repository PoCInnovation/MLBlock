import { useRef, useState } from 'react'
import { Save, Play, Loader2, Upload, Download, Square, MoreVertical, FolderKanban, Trash2, LogOut, Check, Undo2, Redo2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
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
  // Run : isPending de la mutation = source de vérité (l'état serveur ne
  // vit plus dans le store zustand).
  const { onRun, onStop, onClear, isPending, jobId } = useBlockRunner()
  // Un run est annulable pendant la mutation OU pendant le suivi du job.
  const stopActive = isPending || jobId !== null
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
    <div style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: theme.color.surface, borderBottom: `1px solid ${theme.color.border}`, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadow.btn }}>
            <div style={{ width: 11, height: 11, background: '#fff', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: 19 }}>MLBlock</span>
        </div>
        <div style={{ width: 1, height: 26, background: theme.color.border }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.color.surface3, border: `1px solid ${theme.color.border}`, padding: '6px 12px', borderRadius: theme.radius.md }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.color.status, display: 'inline-block' }} />
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
              style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.color.auth}`, outline: 'none', color: theme.color.text, fontWeight: 800, fontSize: 14, width: 180 }}
            />
          ) : (
            <span
              onClick={() => { setDraftName(projectName); setEditingName(true) }}
              title="Cliquer pour renommer"
              style={{ fontWeight: 800, fontSize: 14, cursor: 'text', borderBottom: '1px dashed rgba(255,255,255,.28)' }}
            >
              {projectName}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
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
          <Square size={13} fill="currentColor" /> Arrêter
        </button>
        <button onClick={onRun} disabled={isPending} style={{ color: '#fff', border: 'none', padding: '9px 20px', borderRadius: theme.radius.md, fontWeight: 800, fontSize: 14, minHeight: 44, cursor: isPending ? 'default' : 'pointer', boxShadow: theme.shadow.btn, display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.accent, opacity: isPending ? 0.6 : 1, transition: 'filter .15s ease, transform .15s ease' }}>
          {isPending ? <Loader2 size={15} style={{ animation: 'mlbSpin .8s linear infinite' }} /> : <Play size={15} fill="currentColor" />}
          {isPending ? 'Exécution…' : 'Lancer'}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="hover-bright"
                style={{ ...ghostBtn, padding: '9px 11px' }}
                aria-label="Menu du projet"
                title="Menu du projet"
              >
                <MoreVertical size={17} />
              </button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> Importer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExportOpen(true)}>
              <Download size={15} /> Exporter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/projets')}>
              <FolderKanban size={15} /> Mes projets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClear}>
              <Trash2 size={15} /> Tout effacer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                const s = useAppStore.getState()
                if (s.isDirty() && s.user) setLogoutOpen(true)
                else { void signOut().then(() => { setUser(null); navigate('/') }) }
              }}
            >
              <LogOut size={15} /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onImportPicked(f); e.target.value = '' }} />

      {importError && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, background: theme.color.surface3, border: `1px solid ${theme.color.error}`, color: theme.color.errorLight, padding: '10px 16px', borderRadius: theme.radius.md, fontWeight: 700, fontSize: 13, zIndex: 120 }}>
          {importError}
          <button onClick={() => setImportError(null)} style={{ marginLeft: 10, background: 'none', border: 'none', color: theme.color.errorLight, cursor: 'pointer', fontWeight: 900 }}>×</button>
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
            navigate('/')
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
          void signOut().then(() => navigate('/'))
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  )
}
