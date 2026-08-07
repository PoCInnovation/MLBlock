import { useRef, useState } from 'react'
import { Save, Play, Loader2, Upload, Download, Square, MoreVertical, FolderKanban, Trash2, LogOut } from 'lucide-react'
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
import ExportModal from '../ui/ExportModal'
import UnsavedChangesDialog from '../ui/UnsavedChangesDialog'
import { clearStash } from '../../utils/pending-stash'
import { theme } from '../../theme'

const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,.06)', color: theme.color.textLight, border: '1px solid rgba(255,255,255,.1)', padding: '8px 14px', borderRadius: theme.radius.md, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'background .15s ease, transform .15s ease' }
const actionBtn: React.CSSProperties = { ...ghostBtn, color: '#cfc6bd', padding: '9px 14px' }

type EditorHeaderProps = {
  onRun: () => void
  onStop: () => void
  onClear: () => void
}

export default function EditorHeader({ onRun, onStop, onClear }: EditorHeaderProps) {
  const navigate    = useNavigate()
  const projectName = useAppStore(s => s.projectName)
  const setProjectName = useAppStore(s => s.setProjectName)
  const running     = useAppStore(s => s.running)
  const setUser     = useAppStore(s => s.setUser)
  const savePipeline = useAppStore(s => s.savePipeline)
  const ensureDraft = useAppStore(s => s.ensureDraft)
  const showToast   = useAppStore(s => s.showToast)
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
    if (name) setProjectName(name)
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
    <div style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: theme.color.surface, borderBottom: '1px solid rgba(255,255,255,.07)', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadow.btn }}>
            <div style={{ width: 11, height: 11, background: '#fff', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: 19 }}>MLBlock</span>
        </div>
        <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '6px 12px', borderRadius: theme.radius.md }}>
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
        <button onClick={onSave} style={{ ...actionBtn, background: 'rgba(34,197,94,.14)', color: '#8fd1a8', border: '1px solid rgba(34,197,94,.35)', fontWeight: 800, opacity: saving ? 0.6 : 1 }}>{saving ? <Loader2 size={15} style={{ animation: 'mlbSpin .8s linear infinite' }} /> : <Save size={15} />} Sauvegarder</button>
        <button onClick={onStop} style={{ ...actionBtn, background: 'rgba(224,112,95,.16)', color: theme.color.accentLight, border: '1px solid rgba(224,112,95,.4)', fontWeight: 800 }}>
          <Square size={13} fill="currentColor" /> Arrêter
        </button>
        <button onClick={onRun} style={{ color: '#fff', border: 'none', padding: '9px 20px', borderRadius: theme.radius.md, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: theme.shadow.btn, display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.accent, opacity: running ? 0.6 : 1, transition: 'filter .15s ease, transform .15s ease' }}>
          <Play size={15} fill="currentColor" /> Lancer
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
              destructive
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
