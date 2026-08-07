import type { PipelineNode, PipelineEdge } from '../types/catalog'

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'projet'
}

/** Sérialise une pipeline au format MLBlock (symétrique avec l'import). */
export function pipelineToJson(name: string, nodes: PipelineNode[], edges: PipelineEdge[]): string {
  return JSON.stringify({ name, nodes, edges }, null, 2)
}

export type ImportedPipeline = {
  name: string
  nodes: PipelineNode[]
  edges: PipelineEdge[]
}

/** Valide un fichier JSON au format MLBlock. Lève une Error (message FR) si invalide. */
export async function parseImportFile(file: File): Promise<ImportedPipeline> {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Fichier JSON invalide.')
  }
  const obj = data as Record<string, unknown>
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    throw new Error('Format MLBlock invalide : « nodes » et « edges » sont requis.')
  }
  const nodes: PipelineNode[] = []
  for (const raw of obj.nodes) {
    const n = raw as Record<string, unknown>
    if (!n || typeof n.id !== 'string' || typeof n.type !== 'string') {
      throw new Error('Format MLBlock invalide : chaque nœud doit avoir « id » et « type ».')
    }
    nodes.push({
      id: n.id,
      type: n.type,
      params: (n.params as Record<string, unknown>) ?? {},
      children: Array.isArray(n.children) ? n.children : [],
      position: n.position as PipelineNode['position'] | undefined,
    })
  }
  const edges: PipelineEdge[] = obj.edges.map((e: unknown) => {
    const raw = e as Record<string, unknown>
    return {
      source: String(raw.source ?? ''),
      source_port: String(raw.source_port ?? 'out_1'),
      target: String(raw.target ?? ''),
      target_port: String(raw.target_port ?? 'in_1'),
    }
  })
  return {
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name : file.name.replace(/\.json$/i, ''),
    nodes,
    edges,
  }
}
