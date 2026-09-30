import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import useAppStore, { fingerprintOf } from '../store/useAppStore'
import { listPipelines, getPipeline, deletePipeline } from '../api/client'
import type { PipelineSummary } from '../types/catalog'
import { usePipelineImport } from '../hooks/usePipelineImport'
import ExportModal from '../components/ui/ExportModal'
import TemplateModal from '../components/ui/TemplateModal'
import SkipLink from '../components/ui/SkipLink'
import { Upload, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ExoTemplate } from '../types/catalog'

const MAX_PROJECTS = 20

const pageStyle =
  'min-h-screen bg-bg text-text font-body px-4 py-8 md:px-8 md:py-12'
const headerStyle =
  'max-w-5xl mx-auto mb-7 flex items-center justify-between'
const titleStyle =
  'font-heading text-3xl font-extrabold m-0'
const subStyle =
  'text-text-muted text-sm mt-1'
const gridStyle =
  'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
const emptyStyle =
  'max-w-5xl mx-auto mt-16 text-center text-text-muted text-base font-semibold'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectsQuery = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => listPipelines(100),
  })
  const projects = projectsQuery.data?.items ?? null
  const [actionError, setActionError] = useState<string | null>(null)
  const listError = projectsQuery.isError ? 'Impossible de charger tes projets. Le serveur est peut-être en veille.' : null
  const [importError, setImportError] = useState<string | null>(null)
  const error = actionError ?? listError ?? importError
  const [exporting, setExporting] = useState<PipelineSummary | null>(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { importFile } = usePipelineImport()

  const onSelectTemplate = (template: ExoTemplate) => {
    useAppStore.getState().clearAll()
    useAppStore.getState().loadPipeline(template.nodes, template.edges, '', template.name)
    navigate({ to: '/editor' })
  }

  const openProject = async (p: PipelineSummary) => {
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ['pipeline', p.id],
        queryFn: () => getPipeline(p.id),
      })
      useAppStore.getState().loadPipeline(detail.nodes, detail.edges, detail.id, detail.name)
      navigate({ to: '/editor' })
    } catch {
      setActionError('Impossible d’ouvrir ce projet.')
    }
  }

  const removeProject = async (p: PipelineSummary) => {
    if (!window.confirm(`Supprimer le projet « ${p.name} » ? Cette action est définitive.`)) return
    try {
      await deletePipeline(p.id)
      setActionError(null)
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    } catch {
      setActionError('Impossible de supprimer ce projet.')
    }
  }

  const onImportFile = async (file: File) => {
    setActionError(null)
    const err = await importFile(file)
    if (err) setImportError(err)
    else navigate({ to: '/editor' })
  }

  const atLimit = (projects?.length ?? 0) >= MAX_PROJECTS

  return (
    <div id="main" className={pageStyle}>
      <SkipLink />
      <div className={headerStyle}>
        <div>
          <h1 className={titleStyle}>Mes projets</h1>
          <div className={subStyle}>
            {projects === null ? 'Chargement…' : `${projects.length} projet${projects.length > 1 ? 's' : ''} sur ${MAX_PROJECTS} maximum`}
          </div>
        </div>
        <div className="flex gap-2.5">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = '' }}
          />
          <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)} className="gap-2 font-bold">
            <Sparkles className="size-4" /> Baselines
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2 font-bold">
            <Upload className="size-4" /> Importer
          </Button>
          <Button
            disabled={atLimit}
            title={atLimit ? 'Limite de 20 projets atteinte.' : undefined}
            onClick={() => { useAppStore.getState().clearAll(); useAppStore.setState({ pipelineId: null, projectName: 'mon-premier-modèle', savedFingerprint: fingerprintOf({ flowNodes: [], flowEdges: [], projectName: 'mon-premier-modèle' }), undoStack: [], redoStack: [] }); navigate({ to: '/editor' }) }}
            className="font-bold"
          >
            + Nouveau projet
          </Button>
        </div>
      </div>

      {error && <div className="max-w-5xl mx-auto mt-16 text-center text-error text-base font-semibold">{error}</div>}

      {projects !== null && projects.length === 0 && !error && (
        <div className={emptyStyle}>
          Aucun projet pour l&apos;instant. Crée ton premier pipeline avec « + Nouveau projet » ou importe un fichier JSON.
        </div>
      )}

      <div className={gridStyle}>
        {projects?.map(p => (
          <Card key={p.id} className="hover-card flex flex-col gap-2.5 transition-all p-6 bg-card border border-border rounded-2xl shadow-sm">
            <div className="font-extrabold text-base truncate text-foreground" title={p.name}>{p.name}</div>
            <div className="text-text-muted text-xs font-semibold">Modifié le {fmtDate(p.updated_at)}</div>
            <div className="flex gap-2 mt-1">
              <Button size="sm" onClick={() => openProject(p)} className="font-bold">Ouvrir</Button>
              <Button size="sm" variant="outline" onClick={() => setExporting(p)} className="font-bold">Exporter</Button>
              <Button size="sm" variant="destructive" onClick={() => removeProject(p)} className="font-bold">Supprimer</Button>
            </div>
          </Card>
        ))}
      </div>

      {exporting && (
        <ExportModal
          title={`Exporter « ${exporting.name} »`}
          resolve={() => queryClient.fetchQuery({
            queryKey: ['pipeline', exporting.id],
            queryFn: () => getPipeline(exporting.id),
          })}
          onClose={() => setExporting(null)}
        />
      )}

      <TemplateModal
        isOpen={templateOpen}
        onSelect={onSelectTemplate}
        onClose={() => setTemplateOpen(false)}
      />
    </div>
  )
}
