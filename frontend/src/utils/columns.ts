import { fetchFileColumns } from '../api/client'
import type { Edge, Node } from '@xyflow/react'

/** Columns of a stored CSV (cached upstream). Null = unresolvable. */
export async function resolveColumnsForPath(path: string | undefined): Promise<string[] | null> {
  if (!path || !path.startsWith('https://')) return null
  return fetchFileColumns(path)
}

/** Linear mode: nearest preceding load_csv path. */
export function resolveLinearSourcePath(script: { type: string; fields: Record<string, string> }[], index: number): string | undefined {
  for (let i = index - 1; i >= 0; i--) {
    const b = script[i]
    if (b.type === 'load_csv' && b.fields.path) return b.fields.path
  }
  return undefined
}

/** Advanced mode: walk incoming edges back to the first load_csv node. */
export function resolveFlowSourcePath(nodes: Node[], edges: Edge[], nodeId: string): string | undefined {
  const seen = new Set<string>()
  const walk = (id: string): string | undefined => {
    if (seen.has(id)) return undefined
    seen.add(id)
    const n = nodes.find(x => x.id === id)
    const data = n?.data as Record<string, unknown> | undefined
    if (data && typeof data.type === 'string' && data.type === 'load_csv') {
      const fields = data.fields as Record<string, unknown> | undefined
      const p = fields?.path
      return typeof p === 'string' ? p : undefined
    }
    for (const e of edges) {
      if (e.target === id) {
        const p = walk(e.source)
        if (p) return p
      }
    }
    return undefined
  }
  return walk(nodeId)
}
