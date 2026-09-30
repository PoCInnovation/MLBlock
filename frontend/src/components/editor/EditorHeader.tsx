import { useRef, useState } from 'react'
import { Save, Play, Upload, Download, Square, MoreVertical, FolderKanban, Trash2, LogOut, Check, Undo2, Redo2, Sparkles, Plus, Sliders, Terminal, ChevronDown, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
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
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" onClick={() => navigate({ to: '/' })} aria-label="Retour à l'accueil" className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0 m-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-btn">
            <div className="w-2.5 h-2.5 bg-white rounded-xs" />
          </div>
          <span className="font-heading font-semibold text-lg text-text">MLBlock</span>
        </button>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2 bg-surface3 border border-border px-3 py-1.5 rounded-md min-w-0">
          <span className="w-2 h-2 rounded-full bg-status inline-block shrink-0" />
          {editingName ? (
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') { setDraftName(projectName); setEditingName(false) }
              }}
              autoFocus
              placeholder="Nom du projet"
              className="h-7 text-xs w-[180px]"
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
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Dropdown 1: Blocs (Super-blocs & Baselines) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={activeSheet === 'add' ? 'default' : 'secondary'}
              size="sm"
              className="gap-1.5 font-semibold text-xs h-8"
            >
              <Boxes className="size-4 text-primary" />
              <span>Blocs</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card border-border">
            <DropdownMenuItem
              onClick={() => setActiveSheet(activeSheet === 'add' ? null : 'add')}
              className="cursor-pointer gap-2.5 py-2"
            >
              <Plus className="size-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-foreground">Ajouter Super-Bloc</span>
                <span className="text-[10px] text-muted-foreground">Créer ou configurer un super-bloc</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTemplatesOpen(true)}
              className="cursor-pointer gap-2.5 py-2"
            >
              <Sparkles className="size-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-foreground">Modèles & Baselines</span>
                <span className="text-[10px] text-muted-foreground">Charger un pipeline complet</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dropdown 2: Détails (Inspecteur & Journal) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={activeSheet === 'inspect' || activeSheet === 'journal' ? 'default' : 'secondary'}
              size="sm"
              className="gap-1.5 font-semibold text-xs h-8"
            >
              <Sliders className="size-4 text-primary" />
              <span>Détails</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-card border-border">
            <DropdownMenuItem
              onClick={() => setActiveSheet(activeSheet === 'inspect' ? null : 'inspect')}
              className="cursor-pointer gap-2.5 py-2"
            >
              <Sliders className="size-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-foreground">Inspecteur</span>
                <span className="text-[10px] text-muted-foreground">Paramètres et métadonnées</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setActiveSheet(activeSheet === 'journal' ? null : 'journal')}
              className="cursor-pointer gap-2.5 py-2"
            >
              <Terminal className="size-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-foreground">Journal</span>
                <span className="text-[10px] text-muted-foreground">Historique et sorties</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 header-actions">
        <Button
          title="Annuler (Ctrl+Z)"
          variant="ghost"
          size="icon"
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          title="Rétablir (Ctrl+Shift+Z)"
          variant="ghost"
          size="icon"
          disabled={!canRedo}
          onClick={redo}
        >
          <Redo2 className="size-4" />
        </Button>
        <Button
          variant={dirty ? 'default' : 'secondary'}
          size="sm"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          {saving ? null : dirty ? <Save className="size-4 mr-1.5" /> : <Check className="size-4 mr-1.5" />}
          {dirty ? 'Sauvegarder' : 'Sauvegardé'}
        </Button>
        {/* Dropdown 3: Lancement (Lancer & Arrêter) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isPending ? 'default' : 'secondary'}
              size="sm"
              className="gap-1.5 font-semibold text-xs h-8"
            >
              <Play className={`size-4 text-primary ${isPending ? 'animate-pulse' : ''}`} />
              <span>{isPending ? 'Exécution…' : 'Lancement'}</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-card border-border">
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => {
                setActiveSheet('journal')
                onRun()
              }}
              className="cursor-pointer gap-2.5 py-2 font-semibold text-xs text-foreground"
            >
              <Play className="size-4 text-success shrink-0" />
              <div className="flex flex-col">
                <span>Lancer</span>
                <span className="text-[10px] text-muted-foreground font-normal">Exécuter le pipeline actif</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!stopActive}
              onClick={onStop}
              className="cursor-pointer gap-2.5 py-2 font-semibold text-xs text-destructive focus:text-destructive"
            >
              <Square className="size-4 text-destructive shrink-0" />
              <div className="flex flex-col">
                <span>{isStopping ? 'Arrêt…' : 'Arrêter'}</span>
                <span className="text-[10px] text-muted-foreground font-normal">Interrompre l'exécution</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="Menu du projet">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuItem onClick={() => fileRef.current?.click()} className="cursor-pointer gap-2 text-xs">
              <Upload className="size-4" /> Importer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExportOpen(true)} className="cursor-pointer gap-2 text-xs">
              <Download className="size-4" /> Exporter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: '/projets' })} className="cursor-pointer gap-2 text-xs">
              <FolderKanban className="size-4" /> Mes projets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClear} className="cursor-pointer gap-2 text-xs">
              <Trash2 className="size-4" /> Tout effacer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const s = useAppStore.getState()
                if (s.isDirty() && s.user) setLogoutOpen(true)
                else { void signOut().then(() => { setUser(null); navigate({ to: '/' }) }) }
              }}
              className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
