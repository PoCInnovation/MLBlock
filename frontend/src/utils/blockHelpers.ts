import type { Node, Edge } from 'reactflow'
import type { PipelineNode, PipelineEdge } from '../types/catalog'
import type { BlockDefMap, Category } from '../types/catalog'
import type { GridColumn } from './gridLayout'

export const colorFor = (cat: string, categories: Category[]): string => {
  const c = categories.find(c => c.id === cat)
  return c ? c.color : '#888'
}

export type ServerPayload = { nodes: PipelineNode[]; edges: PipelineEdge[]; columns: GridColumn[] }

/** Store (canvas) → payload serveur /api/pipelines (mode avancé uniquement). */
export function toServerPayload(s: {
  flowNodes: Node[]
  flowEdges: Edge[]
  columns?: GridColumn[]
}): ServerPayload {
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
    columns: s.columns ?? [],
  }
}
