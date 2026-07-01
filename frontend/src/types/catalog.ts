export type TextSeg = { t: 'text'; v: string }
export type NumSeg  = { t: 'num';  k: string; def: string; w?: number }
export type SelSeg  = { t: 'sel';  k: string; def: string; opts: string[] }
export type Segment = TextSeg | NumSeg | SelSeg

export type BlockDef = { cat: string; segs: Segment[] }
export type BlockDefMap = Record<string, BlockDef>

export type Category = { id: string; name: string; color: string }

export interface CatalogManifest {
  version: string
  categories: Category[]
  // TODO: define dtypes shape once backend is ready
  dtypes: unknown
  blocks: BlockDefMap
}

export interface GraphNode {
  id: string
  type: string
  fields: Record<string, string>
}

export interface GraphEdge {
  from: string
  to: string
}

export interface GraphPayload {
  nodes: GraphNode[]
  // TODO: wire real edges once graph model is defined
  edges: GraphEdge[]
}
