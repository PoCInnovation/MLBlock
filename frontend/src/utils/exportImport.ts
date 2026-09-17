import type { PipelineNode, PipelineEdge } from '../types/catalog'
import { arrangeGraph } from './layout'
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
  let rawNodes: unknown[] | null = null
  let rawEdges: unknown[] | null = null
  let isGraphWrapper = false

  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
      rawNodes = obj.nodes
      rawEdges = obj.edges
    } else if (obj.graph && typeof obj.graph === 'object') {
      const g = obj.graph as Record<string, unknown>
      if (Array.isArray(g.nodes) && Array.isArray(g.edges)) {
        rawNodes = g.nodes
        rawEdges = g.edges
        isGraphWrapper = true
      }
    }
  }
  if (!rawNodes || !rawEdges) {
    throw new Error('Format MLBlock invalide : « nodes » et « edges » sont requis.')
  }

  const nodes: PipelineNode[] = []
  for (const raw of rawNodes) {
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
  const edges: PipelineEdge[] = rawEdges.map((e: unknown) => {
    const raw = e as Record<string, unknown>
    return {
      source: String(raw.source ?? ''),
      source_port: String(raw.source_port ?? 'out_1'),
      target: String(raw.target ?? ''),
      target_port: String(raw.target_port ?? 'in_1'),
    }
  })

  // If positions are missing (e.g. raw exercise config), compute a clean Dagre layout
  const hasPositions = nodes.some(n => n.position && typeof n.position.x === 'number')
  if (isGraphWrapper && !hasPositions && nodes.length > 0) {
    const layoutNodes = nodes.map(n => ({ id: n.id, width: 220, height: 100 }))
    const layoutEdges = edges.map(e => ({ source: e.source, target: e.target }))
    const positions = arrangeGraph(layoutNodes, layoutEdges)
    for (const n of nodes) {
      if (positions[n.id]) {
        n.position = positions[n.id]
      }
    }
  }

  return {
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name : file.name.replace(/\.json$/i, ''),
    nodes,
    edges,
  }
}
