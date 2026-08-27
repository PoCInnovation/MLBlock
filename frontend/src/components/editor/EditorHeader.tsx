import { useRef, useState } from 'react'
import { Save, Play, Upload, Download, Square, MoreVertical, FolderKanban, Trash2, LogOut, Check, Undo2, Redo2 } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import { HStack, IconButton, Button } from '@astryxdesign/core'
import { TextInput } from '@astryxdesign/core/TextInput'
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
      <HStack gap={3} style={{ minWidth: 0, alignItems: 'center' }}>
        <button type="button" onClick={() => navigate({ to: '/' })} aria-label="Retour à l'accueil" style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', background: 'none', border: 'none', padding: 0, margin: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadow.btn }}>
            <div style={{ width: 11, height: 11, background: '#fff', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: 19 }}>MLBlock</span>
        </button>
        <div style={{ width: 1, height: 26, background: theme.color.border }} />
        <HStack gap={2} style={{ alignItems: 'center', background: theme.color.surface3, border: `1px solid ${theme.color.border}`, padding: '6px 12px', borderRadius: theme.radius.md, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.color.status, display: 'inline-block', flexShrink: 0 }} />
          {editingName ? (
            <TextInput
              label="Nom du projet"
              isLabelHidden
              value={draftName}
              onChange={(v) => setDraftName(v)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') { setDraftName(projectName); setEditingName(false) }
              }}
              hasAutoFocus
              placeholder="Nom du projet"
              size="sm"
              width={180}
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
        </HStack>
      </HStack>
      <HStack gap={2} className="header-actions" style={{ alignItems: 'center' }}>
        <IconButton
          label="Annuler (Ctrl+Z)"
          icon={<Icon icon={Undo2} size="sm" />}
          variant="ghost"
          size="sm"
          isDisabled={!canUndo}
          onClick={undo}
        />
        <IconButton
          label="Rétablir (Ctrl+Shift+Z)"
          icon={<Icon icon={Redo2} size="sm" />}
          variant="ghost"
          size="sm"
          isDisabled={!canRedo}
          onClick={redo}
        />
        <Button
          label={dirty ? 'Sauvegarder' : 'Sauvegardé'}
          variant={dirty ? 'primary' : 'secondary'}
          size="sm"
          isDisabled={!dirty || saving}
          isLoading={saving}
          icon={saving ? undefined : dirty ? <Icon icon={Save} size="sm" /> : <Icon icon={Check} size="sm" />}
          onClick={onSave}
        />
        <Button
          label={isStopping ? 'Arrêt…' : 'Arrêter'}
          variant="destructive"
          size="sm"
          isDisabled={!stopActive}
          isLoading={isStopping}
          icon={!isStopping ? <Icon icon={Square} size="sm" /> : undefined}
          onClick={onStop}
        />
        <Button
          label={isPending ? 'Exécution…' : 'Lancer'}
          variant="primary"
          size="sm"
          isDisabled={isPending}
          isLoading={isPending}
          icon={!isPending ? <Icon icon={Play} size="sm" /> : undefined}
          onClick={onRun}
        />
        <DropdownMenu
          button={{ label: 'Menu du projet', icon: <Icon icon={MoreVertical} size="sm" />, isIconOnly: true, variant: 'secondary' }}
          items={[
            { label: 'Importer', icon: <Icon icon={Upload} size="sm" />, onClick: () => fileRef.current?.click() },
            { label: 'Exporter', icon: <Icon icon={Download} size="sm" />, onClick: () => setExportOpen(true) },
            { type: 'divider' },
            { label: 'Mes projets', icon: <Icon icon={FolderKanban} size="sm" />, onClick: () => navigate({ to: '/projets' }) },
            { label: 'Tout effacer', icon: <Icon icon={Trash2} size="sm" />, onClick: onClear },
            { type: 'divider' },
            { label: 'Déconnexion', icon: <Icon icon={LogOut} size="sm" />, variant: 'destructive', onClick: () => {
                const s = useAppStore.getState()
                if (s.isDirty() && s.user) setLogoutOpen(true)
                else { void signOut().then(() => { setUser(null); navigate({ to: '/' }) }) }
              } },
          ]}
        />
      </HStack>

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
