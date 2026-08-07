import { useCallback, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { createPipeline } from '../api/client'
import { parseImportFile } from '../utils/exportImport'

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
      return e instanceof Error ? e.message : "Échec de l'import."
    } finally {
      setImporting(false)
    }
  }, [])

  return { importFile, importing }
}
