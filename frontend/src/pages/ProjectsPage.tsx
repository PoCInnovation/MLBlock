import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import useAppStore, { fingerprintOf } from '../store/useAppStore'
import { listPipelines, getPipeline, deletePipeline } from '../api/client'
import type { PipelineSummary } from '../types/catalog'
import { usePipelineImport } from '../hooks/usePipelineImport'
import ExportModal from '../components/ui/ExportModal'
import SkipLink from '../components/ui/SkipLink'
import { Upload } from 'lucide-react'

const MAX_PROJECTS = 20

const pageStyle =
  'min-h-screen bg-bg text-text font-body px-4 py-8 md:px-8 md:py-12'
const headerStyle =
  'max-w-[980px] mx-auto mb-7 flex items-center justify-between'
const titleStyle =
  'font-heading text-[28px] font-extrabold m-0'
const subStyle =
  'text-text-muted text-sm mt-1'
const primaryBtn =
  'bg-accent text-white border-none px-[18px] py-[11px] rounded-md font-extrabold text-sm cursor-pointer shadow-btn inline-flex items-center gap-2'
const ghostBtn =
  'bg-[rgba(255,255,255,.06)] text-text-light border border-border px-[18px] py-[11px] rounded-md font-bold text-sm cursor-pointer'
const gridStyle =
  'max-w-[980px] mx-auto grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4'
const cardStyle =
  'bg-surface2 border border-border rounded-lg px-5 py-[18px] flex flex-col gap-2.5'
const cardName =
  'font-extrabold text-base overflow-hidden text-ellipsis whitespace-nowrap'
const cardMeta =
  'text-text-muted text-[13px] font-semibold'
const cardActions =
  'flex gap-2 mt-1'
const cardBtn =
  'bg-[rgba(255,255,255,.06)] text-text-light border-none px-3 py-1.5 rounded-sm font-bold text-[13px] cursor-pointer'
const cardBtnDanger =
  'bg-[rgba(255,255,255,.06)] text-error-light border-none px-3 py-1.5 rounded-sm font-bold text-[13px] cursor-pointer'
const emptyStyle =
  'max-w-[980px] mx-auto mt-15 text-center text-text-muted text-[15px] font-semibold'

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
  // Erreurs d'action (ouverture/suppression) distinctes de l'erreur de liste
  const [actionError, setActionError] = useState<string | null>(null)
  const listError = projectsQuery.isError ? 'Impossible de charger tes projets. Le serveur est peut-être en veille.' : null
  const [importError, setImportError] = useState<string | null>(null)
  const error = actionError ?? listError ?? importError
  const [exporting, setExporting] = useState<PipelineSummary | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { importFile } = usePipelineImport()

  const openProject = async (p: PipelineSummary) => {
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ['pipeline', p.id],
        queryFn: () => getPipeline(p.id),
      })
      useAppStore.getState().loadPipeline(detail.nodes, detail.edges, detail.id, detail.name)
      navigate('/editor')
    } catch {
      setActionError('Impossible d’ouvrir ce projet.')
    }
  }

  const removeProject = async (p: PipelineSummary) => {
    if (!window.confirm(`Supprimer le projet « ${p.name} » ? Cette action est définitive.`)) return
    try {
      await deletePipeline(p.id)
      setActionError(null)
      // Garde le pending jusqu'à la fin du refetch de la liste
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    } catch {
      setActionError('Impossible de supprimer ce projet.')
    }
  }

  const onImportFile = async (file: File) => {
    setActionError(null)
    const err = await importFile(file)
    if (err) setImportError(err)
    else navigate('/editor')
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
          <button className={`hover-bright ${ghostBtn}`} style={{ transition: 'background .15s ease' }} onClick={() => fileRef.current?.click()}><Upload size={15} /> Importer</button>
          <button
            className={primaryBtn}
            style={{ opacity: atLimit ? 0.5 : 1, cursor: atLimit ? 'not-allowed' : 'pointer', transition: 'filter .15s ease, transform .15s ease' }}
            disabled={atLimit}
            title={atLimit ? 'Limite de 20 projets atteinte. Supprime un projet pour en créer un nouveau.' : undefined}
            onClick={() => { useAppStore.getState().clearAll(); useAppStore.setState({ pipelineId: null, projectName: 'mon-premier-modèle', savedFingerprint: fingerprintOf({ flowNodes: [], flowEdges: [], projectName: 'mon-premier-modèle' }), undoStack: [], redoStack: [] }); navigate('/editor') }}
          >
            + Nouveau projet
          </button>
        </div>
      </div>

      {error && <div className="max-w-[980px] mx-auto mt-15 text-center text-error text-[15px] font-semibold">{error}</div>}

      {projects !== null && projects.length === 0 && !error && (
        <div className={emptyStyle}>
          Aucun projet pour l'instant. Crée ton premier pipeline avec « + Nouveau projet » ou importe un fichier JSON.
        </div>
      )}

      <div className={gridStyle}>
        {projects?.map(p => (
          <div key={p.id} className={`hover-card ${cardStyle}`} style={{ transition: 'border-color .15s ease, transform .15s ease' }}>
            <div className={cardName} title={p.name}>{p.name}</div>
            <div className={cardMeta}>Modifié le {fmtDate(p.updated_at)}</div>
            <div className={cardActions}>
              <button className="bg-auth text-white border-none px-3 py-1.5 rounded-sm font-bold text-[13px] cursor-pointer" style={{ transition: 'background .15s ease' }} onClick={() => openProject(p)}>Ouvrir</button>
              <button className={cardBtn} style={{ transition: 'background .15s ease' }} onClick={() => setExporting(p)}>Exporter</button>
              <button className={cardBtnDanger} style={{ transition: 'background .15s ease' }} onClick={() => removeProject(p)}>Supprimer</button>
            </div>
          </div>
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
    </div>
  )
}
