import type { Node, Edge } from 'reactflow'
import type { InternalCatalog, BlockDefMap } from '../types/catalog'

export type FlowBlock = {
  id: string
  type: string
  fields: Record<string, string>
}

/** Default field values from a block definition's segments. */
export function segsToFields(def: BlockDefMap[string] | undefined): Record<string, string> {
  const fields: Record<string, string> = {}
  if (!def) return fields
  for (const seg of def.segs) {
    if ('k' in seg) fields[seg.k] = seg.def
  }
  return fields
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
        segs: def?.segs ?? [],
        fields: { ...b.fields },
        inputs: def?.inputs ?? [],
        outputs: def?.outputs ?? [],
      },
    }
  })
}

export function flowToLinear(nodes: Node[]): FlowBlock[] {
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y)
  return sorted.map(n => {
    const data = n.data as { type?: string; fields?: Record<string, string> } | undefined
    return {
      id: n.id,
      type: data?.type ?? n.id,
      fields: data?.fields ?? {},
    }
  })
}
