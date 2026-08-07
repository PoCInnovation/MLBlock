import { useCallback, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { createPipeline } from '../api/client'
import { parseImportFile } from '../utils/exportImport'
import axios from 'axios'

/** Import d'un fichier JSON MLBlock : valide, crée le projet et le charge dans l'éditeur. */
export function usePipelineImport() {
  const [importing, setImporting] = useState(false)

  const importFile = useCallback(async (file: File): Promise<string | null> => {
    setImporting(true)
    try {
      const imported = await parseImportFile(file)
      const detail = await createPipeline({ name: imported.name, description: '', is_draft: false, nodes: imported.nodes, edges: imported.edges })
      useAppStore.getState().loadPipeline(detail.nodes, detail.edges, detail.id, detail.name)
      return null
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const detail = (e.response?.data as { detail?: string } | undefined)?.detail
        if (detail) return detail
      }
      return e instanceof Error ? e.message : "Échec de l'import."
    } finally {
      setImporting(false)
    }
  }, [])

  return { importFile, importing }
}
