import { useState } from 'react'
import axios from 'axios'
import type { PipelineDetail } from '../../types/catalog'
import { generatePipelineCode } from '../../api/client'
import { downloadFile, pipelineToJson, slugify } from '../../utils/exportImport'
import { FileText, FileCode2 } from 'lucide-react'
import { Dialog, DialogTitle, DialogFooter } from './dialog'
import { Button } from './button'
const btnBase = "flex items-center justify-between w-full p-4 mb-2.5 rounded-md cursor-pointer bg-surface2 border border-border text-text font-bold text-sm disabled:opacity-50"

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
    <Dialog isOpen={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogTitle>{title}</DialogTitle>
      <Button variant="outline" className={btnBase} onClick={() => doExport('json')} disabled={busy !== null}>
        <span>JSON de la pipeline</span>
        <FileText className="size-5" />
      </Button>
      <Button variant="outline" className={btnBase} onClick={() => doExport('code')} disabled={busy !== null}>
        <span>Code (main.py)</span>
        <FileCode2 className="size-5" />
      </Button>
      {error && <div className="text-error text-xs font-bold">{error}</div>}
      {busy && <div className="text-text-muted text-xs mt-2">Préparation…</div>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose} className="bg-transparent border border-border text-text-muted rounded-md px-4 py-2 font-bold text-xs cursor-pointer">
          Annuler
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
