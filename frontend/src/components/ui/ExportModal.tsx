import { useState } from 'react'
import axios from 'axios'
import { theme } from '../../theme'
import type { PipelineDetail } from '../../types/catalog'
import { generatePipelineCode } from '../../api/client'
import { downloadFile, pipelineToJson, slugify } from '../../utils/exportImport'
import { FileText, FileCode2 } from 'lucide-react'
import { Dialog, DialogTitle, DialogFooter } from './dialog'

const btnBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '14px 16px', marginBottom: 10, borderRadius: theme.radius.md, cursor: 'pointer',
  background: 'rgba(255,255,255,.05)', border: `1px solid ${theme.color.border}`,
  color: theme.color.text, fontWeight: 700, fontSize: 14.5,
}
const hint: React.CSSProperties = { fontSize: 12, color: theme.color.textMuted, fontWeight: 600, marginTop: 2 }

export type ExportProps = {
  title: string
  /** Résout la pipeline à exporter (id + contenu) — peut créer un brouillon au besoin. */
  resolve: () => Promise<PipelineDetail>
  onClose: () => void
}

/** Modal de choix [JSON | Code] puis téléchargement. */
export default function ExportModal({ title, resolve, onClose }: ExportProps) {
  const [open] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const doExport = async (kind: 'json' | 'code') => {
    setBusy(kind)
    setError(null)
    try {
      const detail = await resolve()
      const base = slugify(detail.name)
      if (kind === 'code' && detail.nodes.length === 0) {
        setError('Ajoute des blocs au pipeline avant d\u2019exporter le code.')
        return
      }
      if (kind === 'json') {
        downloadFile(`${base}.json`, pipelineToJson(detail.name, detail.nodes, detail.edges), 'application/json')
      } else {
        const { code } = await generatePipelineCode(detail.id)
        downloadFile(`${base}.py`, code, 'text/x-python')
      }
      onClose()
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const detail = (e.response?.data as { detail?: string } | undefined)?.detail
        if (detail) { setError(detail); return }
      }
      setError(e instanceof Error ? e.message : "Échec de l'export.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogTitle>{title}</DialogTitle>
      <button style={btnBase} onClick={() => doExport('json')} disabled={busy !== null}>
        <span>JSON de la pipeline</span>
        <FileText size={18} color={theme.color.file} />
        <div style={hint} />
      </button>
      <button style={btnBase} onClick={() => doExport('code')} disabled={busy !== null}>
        <span>Code (main.py)</span>
        <FileCode2 size={18} color={theme.color.accentLight} />
        <div style={hint} />
      </button>
      {error && <div style={{ color: theme.color.error, fontSize: 13, fontWeight: 700 }}>{error}</div>}
      {busy && <div style={{ color: theme.color.textMuted, fontSize: 13, marginTop: 8 }}>Préparation…</div>}
      <DialogFooter>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${theme.color.border}`, color: theme.color.textMuted, borderRadius: theme.radius.md, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
      </DialogFooter>
    </Dialog>
  )
}
