// Internal rendering types — used by components unchanged
export type TextSeg = { t: 'text'; v: string }
export type NumSeg = { t: 'num'; k: string; def: string; w?: number; min?: number; max?: number; step?: number; odd?: boolean; desc?: string }
export type SelSeg = { t: 'sel'; k: string; def: string; opts: string[]; desc?: string }
export type SugSeg = { t: 'sug'; k: string; def: string; opts: string[]; desc?: string }
export type ListSeg = { t: 'list'; k: string; def: string; format?: string; len?: number; desc?: string }
export type FileSeg = { t: 'file'; k: string; def: string; desc?: string }
export type Segment = TextSeg | NumSeg | SelSeg | SugSeg | ListSeg | FileSeg

export type Port = { name: string; dtype: string }

export type BlockDef = { cat: string; segs: Segment[]; inputs: Port[]; outputs: Port[] }
export type BlockDefMap = Record<string, BlockDef>

export type Category = { id: string; name: string; color: string }

// Internal catalog shape held by the store
export interface InternalCatalog {
  categories: Category[]
  blocks: BlockDefMap
}

export interface PipelineNode {
  id: string
  type: string
  params: Record<string, unknown>
  children: PipelineNode[]
}

export interface PipelineEdge {
  source: string
  source_port: string
  target: string
  target_port: string
}

export interface PipelineCreate {
  name: string
  description: string
  nodes: PipelineNode[]
  edges: PipelineEdge[]
}

export interface PipelineSummary {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  node_count: number
}

export interface PipelineDetail extends PipelineSummary {
  nodes: PipelineNode[]
  edges: PipelineEdge[]
}

export interface ValidationResponse {
  valid: boolean
  errors: string[]
}

export interface BuildResponse {
  success: boolean
  output_shape: number[] | null
  output_values: number[][] | null
  layer_count: number
  error: string | null
}

export interface GenerateResponse {
  code: string
}
