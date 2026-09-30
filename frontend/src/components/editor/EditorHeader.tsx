import { useRef, useState } from 'react'
import { Save, Play, Upload, Download, Square, MoreVertical, FolderKanban, Trash2, LogOut, Check, Undo2, Redo2, Sparkles, Plus, Sliders, Terminal } from 'lucide-react'
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
import TemplateModal from '../ui/TemplateModal'
import type { ExoTemplate } from '../../types/catalog'
import { clearStash } from '../../utils/pending-stash'
export default function EditorHeader() {
  const navigate    = useNavigate()
  const projectName = useAppStore(s => s.projectName)
  const setProjectName = useAppStore(s => s.setProjectName)
  const setUser     = useAppStore(s => s.setUser)
  const savePipeline = useAppStore(s => s.savePipeline)
  const ensureDraft = useAppStore(s => s.ensureDraft)
  const showToast   = useAppStore(s => s.showToast)
  const activeSheet = useAppStore(s => s.activeSheet)
  const setActiveSheet = useAppStore(s => s.setActiveSheet)
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
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onSelectTemplate = (template: ExoTemplate) => {
    useAppStore.getState().commitUndoPoint()
    useAppStore.getState().loadPipeline(template.nodes, template.edges, '', template.name)
    showToast({ kind: 'success', message: `Modèle « ${template.name} » chargé dans le canvas.` })
  }

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
      className="editor-header floating-panel shrink-0 flex items-center justify-between bg-surface border border-border rounded-2xl shadow-xl backdrop-blur-md z-20 gap-4 transition-all will-change-transform"
    >
      <HStack gap={3} className="min-w-0 items-center">
        <button type="button" onClick={() => navigate({ to: '/' })} aria-label="Retour à l'accueil" className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0 m-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-btn">
            <div className="w-2.5 h-2.5 bg-white rounded-xs" />
          </div>
          <span className="font-heading font-semibold text-lg text-text">MLBlock</span>
        </button>
        <div className="w-px h-6 bg-border" />
        <HStack gap={2} className="items-center bg-surface3 border border-border px-3 py-1.5 rounded-md min-w-0">
          <span className="w-2 h-2 rounded-full bg-status inline-block shrink-0" />
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
              className="project-name font-extrabold text-sm cursor-pointer border-b border-dashed border-white/30 bg-transparent p-0 m-0 text-text"
            >
              {projectName}
            </button>
          )}
        </HStack>
      </HStack>
      <HStack gap={2} className="items-center">
        <Button
          label="Modèles & Baselines"
          variant="secondary"
          size="sm"
          icon={<Icon icon={Sparkles} size="sm" />}
          onClick={() => setTemplatesOpen(true)}
        />
        <Button
          label="Ajouter Super-Bloc"
          variant={activeSheet === 'add' ? 'primary' : 'secondary'}
          size="sm"
          icon={<Icon icon={Plus} size="sm" />}
          onClick={() => setActiveSheet(activeSheet === 'add' ? null : 'add')}
        />
        <Button
          label="Inspecteur"
          variant={activeSheet === 'inspect' ? 'primary' : 'secondary'}
          size="sm"
          icon={<Icon icon={Sliders} size="sm" />}
          onClick={() => setActiveSheet(activeSheet === 'inspect' ? null : 'inspect')}
        />
        <Button
          label="Journal"
          variant={activeSheet === 'journal' ? 'primary' : 'secondary'}
          size="sm"
          icon={<Icon icon={Terminal} size="sm" />}
          onClick={() => setActiveSheet(activeSheet === 'journal' ? null : 'journal')}
        />
      </HStack>

      <HStack gap={2} className="header-actions items-center">
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
          onClick={() => {
            setActiveSheet('journal')
            onRun()
          }}
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

      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onImportPicked(f); e.target.value = '' }} />

      {importError && (
        <div className="fixed bottom-5 right-5 bg-surface3 border border-error text-error-light px-4 py-2.5 rounded-md font-bold text-xs z-50">
          {importError}
          <button onClick={() => setImportError(null)} aria-label="Fermer" className="ml-2.5 bg-transparent border-none text-error-light cursor-pointer font-black">×</button>
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

      <TemplateModal
        isOpen={templatesOpen}
        onSelect={onSelectTemplate}
        onClose={() => setTemplatesOpen(false)}
      />
    </div>
  )
}
