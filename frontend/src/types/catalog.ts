// Internal rendering types — used by components unchanged
export type TextSeg = { t: 'text'; v: string }
export type NumSeg  = { t: 'num';  k: string; def: string; w?: number }
export type SelSeg  = { t: 'sel';  k: string; def: string; opts: string[] }
export type Segment = TextSeg | NumSeg | SelSeg

export type BlockDef = { cat: string; segs: Segment[] }
export type BlockDefMap = Record<string, BlockDef>

export type Category = { id: string; name: string; color: string }

// Internal catalog shape held by the store
export interface InternalCatalog {
  categories: Category[]
  blocks: BlockDefMap
}

// Internal derived type — computed from BackendBlock, not fetched directly
export interface BlockSummary {
  type: string
  label: string
  category: string
  /** KNOWN GAP: backend has no input count field; always 0 until backend adds "inputs" list */
  inputs: number
  outputs: number
  can_build: boolean
}

// Backend wire types — exact match to what /api/blocks returns

export interface BackendParamInfo {
  type: string
  description: string
  default: unknown
  required: boolean
}

export interface BackendBlock {
  name: string
  description: string
  category: { name: string; color: string }
  params: Record<string, BackendParamInfo>
  outputs: { name: string; dtype: string }[]
  deps: string[]
}

export interface BackendCategory {
  name: string
  color: string
  block_count: number
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
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
  id: string  // UUID string — backend returns UUID, not integer
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
