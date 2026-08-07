import type { Node, Edge } from 'reactflow'
import type { PipelineNode, PipelineEdge } from '../types/catalog'
import type { BlockDefMap, Category } from '../types/catalog'

export type Block = { id: string; type: string; fields: Record<string, string> }

let uid = 0

export const colorFor = (cat: string, categories: Category[]): string => {
  const c = categories.find(c => c.id === cat)
  return c ? c.color : '#888'
}

export const titleOf = (type: string, defs: BlockDefMap): string => {
  const d = defs[type]
  if (!d) return type
  return d.segs.map(s => s.t === 'text' ? s.v : s.def).join(' ')
}

export const instantiate = (type: string, defs: BlockDefMap): Block => {
  const d = defs[type]
  const fields: Record<string, string> = {}
  d.segs.forEach(s => { if ('k' in s) fields[s.k] = s.def })
  return { id: 'b' + (uid++), type, fields }
}

export type ServerPayload = { nodes: PipelineNode[]; edges: PipelineEdge[] }

/** Store (canvas) → payload serveur /api/pipelines. */
export function toServerPayload(s: {
  editorMode: 'linear' | 'advanced'
  script: Block[]
  flowNodes: Node[]
  flowEdges: Edge[]
}): ServerPayload {
  if (s.editorMode === 'advanced') {
    return {
      nodes: s.flowNodes.map(n => ({
        id: n.id,
        type: (n.data as { type?: string } | undefined)?.type ?? n.id,
        params: (n.data as { fields?: Record<string, unknown> } | undefined)?.fields ?? {},
        children: [],
        position: n.position,
      })),
      edges: s.flowEdges.map(e => ({
        source: e.source,
        source_port: e.sourceHandle ?? 'out_1',
        target: e.target,
        target_port: e.targetHandle ?? 'in_1',
      })),
    }
  }
  return {
    nodes: s.script.map(b => ({
      id: b.id,
      type: b.type,
      params: b.fields as Record<string, unknown>,
      children: [],
    })),
    edges: [],
  }
}
