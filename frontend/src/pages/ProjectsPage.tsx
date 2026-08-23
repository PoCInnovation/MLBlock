import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import useAppStore, { fingerprintOf } from '../store/useAppStore'
import { listPipelines, getPipeline, deletePipeline } from '../api/client'
import type { PipelineSummary } from '../types/catalog'
import { usePipelineImport } from '../hooks/usePipelineImport'
import ExportModal from '../components/ui/ExportModal'
import SkipLink from '../components/ui/SkipLink'
import { Upload } from 'lucide-react'
import { Card, Button } from '@astryxdesign/core'

const MAX_PROJECTS = 20

const pageStyle =
  'min-h-screen bg-bg text-text font-body px-4 py-8 md:px-8 md:py-12'
const headerStyle =
  'max-w-[980px] mx-auto mb-7 flex items-center justify-between'
const titleStyle =
  'font-heading text-[28px] font-extrabold m-0'
const subStyle =
  'text-text-muted text-sm mt-1'
const gridStyle =
  'max-w-[980px] mx-auto grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4'
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
          <Button label="Importer" variant="secondary" icon={<Upload size={15} />} onClick={() => fileRef.current?.click()} />
          <Button
            label="+ Nouveau projet"
            variant="primary"
            isDisabled={atLimit}
            tooltip={atLimit ? 'Limite de 20 projets atteinte.' : undefined}
            onClick={() => { useAppStore.getState().clearAll(); useAppStore.setState({ pipelineId: null, projectName: 'mon-premier-modèle', savedFingerprint: fingerprintOf({ flowNodes: [], flowEdges: [], projectName: 'mon-premier-modèle' }), undoStack: [], redoStack: [] }); navigate({ to: '/editor' }) }}
          />
        </div>
      </div>

      {error && <div className="max-w-[980px] mx-auto mt-15 text-center text-error text-[15px] font-semibold">{error}</div>}

      {projects !== null && projects.length === 0 && !error && (
        <div className={emptyStyle}>
          Aucun projet pour l&apos;instant. Crée ton premier pipeline avec « + Nouveau projet » ou importe un fichier JSON.
        </div>
      )}

      <div className={gridStyle}>
        {projects?.map(p => (
          <Card key={p.id} className="hover-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color .15s ease, transform .15s ease' }}>
            <div style={{ fontWeight: 800, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Modifié le {fmtDate(p.updated_at)}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Button label="Ouvrir" variant="primary" size="sm" onClick={() => openProject(p)} />
              <Button label="Exporter" variant="secondary" size="sm" onClick={() => setExporting(p)} />
              <Button label="Supprimer" variant="destructive" size="sm" onClick={() => removeProject(p)} />
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
    </div>
  )
}
