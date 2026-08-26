/** PipelineDocument — deep module (pure, no React).
 * Owns fingerprintOf, toServerPayload, backfill, undo/redo 50, isDirty.
 * Zustand remains thin glue; Persistence via injected PersistenceAdapter.
 * Two adapters justify the seam: real api/client (prod) and in-memory fake (tests).
 */
import type { InternalCatalog } from '../types/catalog'
import type { PipelineNode, PipelineEdge } from '../types/catalog'
import type { Node, Edge } from '@xyflow/react'

export type PersistenceAdapter = {
  createPipeline: (body: { name: string; description: string; is_draft: boolean; nodes: PipelineNode[]; edges: PipelineEdge[] }) => Promise<{ id: string; name: string }>
  updatePipeline: (id: string, body: { name?: string; description?: string; is_draft?: boolean; nodes?: PipelineNode[]; edges?: PipelineEdge[] }) => Promise<{ id: string; name: string }>
}

export type UndoSnapshot = { nodes: Node[]; edges: Edge[]; name: string }

export function fingerprintOf(s: { flowNodes: Node[]; flowEdges: Edge[]; projectName: string }): string {
  return JSON.stringify({
    nodes: s.flowNodes.map(n => ({
      id: n.id,
      type: (n.data as { type?: string } | undefined)?.type,
      fields: (n.data as { fields?: Record<string, string> } | undefined)?.fields,
      segs: (n.data as { segs?: unknown } | undefined)?.segs,
      position: n.position,
    })),
    edges: s.flowEdges.map(e => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
    projectName: s.projectName,
  })
}

export function toServerPayload(s: { flowNodes: Node[]; flowEdges: Edge[] }): { nodes: PipelineNode[]; edges: PipelineEdge[] } {
  const nodes: PipelineNode[] = s.flowNodes.map(n => {
    const d = n.data as { type?: string; fields?: Record<string, string> } | undefined
    return {
      id: n.id,
      type: d?.type ?? '',
      params: { ...(d?.fields ?? {}) },
      position: n.position,
    } as PipelineNode
  })
  const edges: PipelineEdge[] = s.flowEdges.map(e => ({
    source: e.source,
    source_port: (e.sourceHandle as string) ?? 'out_1',
    target: e.target,
    target_port: (e.targetHandle as string) ?? 'in_1',
  }))
  return { nodes, edges }
}

export function backfillNodes(flowNodes: Node[], catalog: InternalCatalog): Node[] {
  const needsBackfill = flowNodes.length > 0 && flowNodes.some(n => !((n.data as { segs?: unknown[] } | undefined)?.segs?.length))
  if (!needsBackfill) return flowNodes
  return flowNodes.map(n => {
    const d = n.data as { type?: string; fields?: Record<string, string>; segs?: unknown[] } | undefined
    if (d?.segs?.length) return n
    const def = d?.type ? catalog.blocks[d.type] : undefined
    const first = def?.segs[0]
    return {
      ...n,
      data: {
        type: d?.type ?? '',
        label: first?.t === 'text' ? first.v : (d?.type ?? ''),
        category: def?.cat ?? 'unknown',
        categoryColor: catalog.categories.find(c => c.id === def?.cat)?.color ?? '#888',
        segs: def?.segs ?? [],
        fields: d?.fields ?? {},
        inputs: def?.inputs ?? [],
        outputs: def?.outputs ?? [],
      },
    }
  })
}

export class PipelineDocument {
  private undoStack: UndoSnapshot[] = []
  private redoStack: UndoSnapshot[] = []

  commitUndoPoint(nodes: Node[], edges: Edge[], name: string) {
    this.undoStack = [...this.undoStack.slice(-49), { nodes, edges, name }]
    this.redoStack = []
  }
  undo(current: UndoSnapshot): UndoSnapshot | null {
    if (!this.undoStack.length) return null
    const snap = this.undoStack[this.undoStack.length - 1]
    this.undoStack = this.undoStack.slice(0, -1)
    this.redoStack = [...this.redoStack, current]
    return snap
  }
  redo(current: UndoSnapshot): UndoSnapshot | null {
    if (!this.redoStack.length) return null
    const snap = this.redoStack[this.redoStack.length - 1]
    this.redoStack = this.redoStack.slice(0, -1)
    this.undoStack = [...this.undoStack, current]
    return snap
  }
  canUndo() { return this.undoStack.length > 0 }
  canRedo() { return this.redoStack.length > 0 }
}
