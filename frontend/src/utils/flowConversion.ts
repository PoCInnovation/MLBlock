import type { Node, Edge } from 'reactflow'
import type { InternalCatalog, BlockDefMap } from '../types/catalog'

export type FlowBlock = {
  id: string
  type: string
  fields: Record<string, string>
}

export function segsToParams(def: BlockDefMap[string] | undefined): Record<string, { type: string; default?: unknown }> {
  const params: Record<string, { type: string; default?: unknown }> = {}
  if (!def) return params
  for (const seg of def.segs) {
    if (seg.t === 'num') params[seg.k] = { type: 'num', default: seg.def }
    else if (seg.t === 'sel') params[seg.k] = { type: 'sel', default: seg.def }
    else if (seg.t === 'file') params[seg.k] = { type: 'file', default: seg.def }
  }
  return params
}

export function linearToFlow(blocks: FlowBlock[], catalog: InternalCatalog): Node[] {
  return blocks.map((b, i) => {
    const def = catalog.blocks[b.type]
    const first = def?.segs[0]
    return {
      id: b.id,
      type: 'block',
      position: { x: 100, y: 80 + i * 120 },
      data: {
        type: b.type,
        label: first?.t === 'text' ? first.v : b.type,
        category: def?.cat ?? 'unknown',
        categoryColor: catalog.categories.find(c => c.id === def?.cat)?.color ?? '#888',
        params: segsToParams(def),
      },
    }
  })
}

export function flowToLinear(nodes: Node[]): FlowBlock[] {
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y)
  return sorted.map(n => {
    const data = n.data as any
    const segs = Object.entries(data?.params ?? {}).map(([k, v]) => ({
      k,
      def: String((v as any)?.default ?? ''),
    }))
    const fields: Record<string, string> = {}
    for (const s of segs) fields[s.k] = s.def
    return {
      id: n.id,
      type: data?.type ?? n.id,
      fields,
    }
  })
}
