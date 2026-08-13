import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore, { fingerprintOf } from '../store/useAppStore'
import { listPipelines, getPipeline, deletePipeline } from '../api/client'
import type { PipelineSummary } from '../types/catalog'
import { usePipelineImport } from '../hooks/usePipelineImport'
import ExportModal from '../components/ui/ExportModal'
import { theme } from '../theme'
import { Upload } from 'lucide-react'

const MAX_PROJECTS = 20

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', background: theme.color.bg, color: theme.color.text,
  fontFamily: theme.font.body, padding: '48px 32px',
}
const headerStyle: React.CSSProperties = {
  maxWidth: 980, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}
const titleStyle: React.CSSProperties = {
  fontFamily: theme.font.heading, fontSize: 28, fontWeight: 800, margin: 0,
}
const subStyle: React.CSSProperties = { color: theme.color.textMuted, fontSize: 14, marginTop: 4 }
const primaryBtn: React.CSSProperties = {
  background: theme.color.accent, color: '#fff', border: 'none', padding: '11px 18px',
  borderRadius: theme.radius.md, fontWeight: 800, fontSize: 14, cursor: 'pointer',
  boxShadow: theme.shadow.btn, display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'filter .15s ease, transform .15s ease',
}
const ghostBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,.06)', color: theme.color.textLight, border: `1px solid ${theme.color.border}`,
  padding: '11px 18px', borderRadius: theme.radius.md, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background .15s ease',
}
const gridStyle: React.CSSProperties = {
  maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16,
}
const cardStyle: React.CSSProperties = {
  background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg,
  padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color .15s ease, transform .15s ease',
}
const cardName: React.CSSProperties = { fontWeight: 800, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const cardMeta: React.CSSProperties = { color: theme.color.textMuted, fontSize: 12.5, fontWeight: 600 }
const cardActions: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 4 }
const cardBtn: React.CSSProperties = { transition: 'background .15s ease',
  background: 'rgba(255,255,255,.06)', color: theme.color.textLight, border: 'none',
  padding: '6px 12px', borderRadius: theme.radius.sm, fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
}
const cardBtnDanger: React.CSSProperties = { ...cardBtn, color: theme.color.errorLight }
const emptyStyle: React.CSSProperties = {
  maxWidth: 980, margin: '60px auto 0', textAlign: 'center', color: theme.color.textMuted,
  fontSize: 15, fontWeight: 600,
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<PipelineSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<PipelineSummary | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { importFile } = usePipelineImport()

  const reload = useCallback(async () => {
    try {
      setProjects((await listPipelines()).items)
      setError(null)
    } catch {
      setError('Impossible de charger tes projets. Le serveur est peut-être en veille.')
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const openProject = async (p: PipelineSummary) => {
    try {
      const detail = await getPipeline(p.id)
      useAppStore.getState().loadPipeline(detail.nodes, detail.edges, detail.id, detail.name, detail.columns)
      navigate('/editor')
    } catch {
      setError('Impossible d’ouvrir ce projet.')
    }
  }

  const removeProject = async (p: PipelineSummary) => {
    if (!window.confirm(`Supprimer le projet « ${p.name} » ? Cette action est définitive.`)) return
    try {
      await deletePipeline(p.id)
      reload()
    } catch {
      setError('Impossible de supprimer ce projet.')
    }
  }

  const onImportFile = async (file: File) => {
    setError(null)
    const err = await importFile(file)
    if (err) setImportError(err)
    else navigate('/editor')
  }

  const atLimit = (projects?.length ?? 0) >= MAX_PROJECTS

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Mes projets</h1>
          <div style={subStyle}>
            {projects === null ? 'Chargement…' : `${projects.length} projet${projects.length > 1 ? 's' : ''} sur ${MAX_PROJECTS} maximum`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = '' }}
          />
          <button className="hover-bright" style={ghostBtn} onClick={() => fileRef.current?.click()}><Upload size={15} /> Importer</button>
          <button
            style={{ ...primaryBtn, opacity: atLimit ? 0.5 : 1, cursor: atLimit ? 'not-allowed' : 'pointer' }}
            disabled={atLimit}
            title={atLimit ? 'Limite de 20 projets atteinte. Supprime un projet pour en créer un nouveau.' : undefined}
            onClick={() => { useAppStore.getState().clearAll(); useAppStore.setState({ pipelineId: null, projectName: 'mon-premier-modèle', savedFingerprint: fingerprintOf({ flowNodes: [], flowEdges: [], projectName: 'mon-premier-modèle', columns: [] }), undoStack: [], redoStack: [] }); navigate('/editor') }}
          >
            + Nouveau projet
          </button>
        </div>
      </div>

      {error && <div style={{ ...emptyStyle, color: theme.color.error }}>{error}</div>}

      {projects !== null && projects.length === 0 && !error && (
        <div style={emptyStyle}>
          Aucun projet pour l'instant. Crée ton premier pipeline avec « + Nouveau projet » ou importe un fichier JSON.
        </div>
      )}

      <div style={gridStyle}>
        {projects?.map(p => (
          <div key={p.id} className="hover-card" style={cardStyle}>
            <div style={cardName} title={p.name}>{p.name}</div>
            <div style={cardMeta}>Modifié le {fmtDate(p.updated_at)} · {p.node_count} bloc{p.node_count > 1 ? 's' : ''}</div>
            <div style={cardActions}>
              <button style={{ ...cardBtn, background: theme.color.auth, color: '#fff' }} onClick={() => openProject(p)}>Ouvrir</button>
              <button style={cardBtn} onClick={() => setExporting(p)}>Exporter</button>
              <button style={cardBtnDanger} onClick={() => removeProject(p)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {exporting && (
        <ExportModal
          title={`Exporter « ${exporting.name} »`}
          resolve={() => getPipeline(exporting.id)}
          onClose={() => setExporting(null)}
        />
      )}
    </div>
  )
}
