import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import { signOut } from '../../services/auth'
import { getPipeline } from '../../api/client'
import { usePipelineImport } from '../../hooks/usePipelineImport'
import ExportModal from '../ui/ExportModal'
import { theme } from '../../theme'

const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,.06)', color: theme.color.textLight, border: '1px solid rgba(255,255,255,.1)', padding: '8px 14px', borderRadius: theme.radius.md, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }
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
  const editorMode  = useAppStore(s => s.editorMode)
  const setEditorMode = useAppStore(s => s.setEditorMode)
  const savePipeline = useAppStore(s => s.savePipeline)
  const ensureDraft = useAppStore(s => s.ensureDraft)
  const showToast   = useAppStore(s => s.showToast)
  const { importFile } = usePipelineImport()

  const [saving, setSaving] = useState(false)
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
      showToast({ kind: 'convert', message: '✓ Projet sauvegardé' })
    } catch {
      showToast({ kind: 'error', message: '⚠ Échec de la sauvegarde' })
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
        <button onClick={() => setEditorMode(editorMode === 'linear' ? 'advanced' : 'linear')} style={editorMode === 'advanced' ? { ...ghostBtn, background: theme.color.auth, color: '#fff', border: '1px solid transparent' } : ghostBtn}>
          {editorMode === 'linear' ? 'Avancé' : 'Linéaire'}
        </button>
        <button style={ghostBtn} onClick={() => fileRef.current?.click()}>↧ Importer</button>
        <button style={ghostBtn} onClick={() => setExportOpen(true)}>↥ Exporter</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button onClick={() => navigate('/projets')} style={ghostBtn}>Mes projets</button>
        <button onClick={async () => { await signOut(); setUser(null); navigate('/') }} style={ghostBtn}>Déconnexion</button>
        <button onClick={onClear} style={actionBtn}>Tout effacer</button>
        <button onClick={onSave} style={{ ...actionBtn, background: 'rgba(34,197,94,.14)', color: '#8fd1a8', border: '1px solid rgba(34,197,94,.35)', fontWeight: 800, opacity: saving ? 0.6 : 1 }}>💾 Sauvegarder</button>
        <button onClick={onStop} style={{ ...actionBtn, background: 'rgba(224,112,95,.16)', color: theme.color.accentLight, border: '1px solid rgba(224,112,95,.4)', fontWeight: 800 }}>
          <span style={{ fontSize: 10 }}>■</span> Arrêter
        </button>
        <button onClick={onRun} style={{ color: '#fff', border: 'none', padding: '9px 20px', borderRadius: theme.radius.md, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: theme.shadow.btn, display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.accent, opacity: running ? 0.6 : 1 }}>
          <span style={{ fontSize: 11 }}>▶</span> Lancer
        </button>
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
    </div>
  )
}
