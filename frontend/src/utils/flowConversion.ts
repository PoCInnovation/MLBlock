import type { Node, Edge } from 'reactflow'
import type { InternalCatalog, BlockDefMap } from '../types/catalog'

export type FlowBlock = {
  id: string
  type: string
  fields: Record<string, string>
}

export function linearToFlow(blocks: FlowBlock[], catalog: InternalCatalog): Node[] {
  return blocks.map((b, i) => {
    const def = catalog.blocks[b.type]
    return {
      id: b.id,
      type: 'block',
      position: { x: 100, y: 80 + i * 120 },
      data: {
        label: def?.segs[0]?.type === 'text' ? def.segs[0].v : b.type,
        category: def?.cat ?? 'unknown',
        categoryColor: catalog.categories.find(c => c.id === def?.cat)?.color ?? '#888',
        params: def ? {} : {},
      },
    }
  })
}

export function flowToLinear(nodes: Node[]): FlowBlock[] {
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y)
  return sorted.map(n => ({
    id: n.id,
    type: n.type === 'block' ? (n.data as any).label ?? n.id : n.id,
    fields: {},
  }))
}
