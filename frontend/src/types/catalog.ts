// Internal rendering types — used by components unchanged
export type TextSeg = { t: 'text'; v: string }
export type BoolSeg = { t: 'bool'; k: string; def: string; desc?: string }
export type NumSeg = { t: 'num'; k: string; def: string; w?: number; min?: number; max?: number; step?: number; odd?: boolean; opts?: string[]; desc?: string }
export type SelSeg = { t: 'sel'; k: string; def: string; opts: string[]; desc?: string }
export type SugSeg = { t: 'sug'; k: string; def: string; opts: string[]; desc?: string }
export type ListSeg = { t: 'list'; k: string; def: string; format?: string; len?: number; opts?: string[]; desc?: string }
export type FileSeg = { t: 'file'; k: string; def: string; desc?: string }
export type Segment = TextSeg | BoolSeg | NumSeg | SelSeg | SugSeg | ListSeg | FileSeg

export type Port = { name: string; dtype: string }

export type BlockDef = { cat: string; segs: Segment[]; inputs: Port[]; outputs: Port[]; description: string }
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
  position?: { x: number; y: number } | null
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
  is_draft?: boolean
  nodes: PipelineNode[]
  edges: PipelineEdge[]
  columns?: { id: string; label: string }[]
}

export interface PipelineSummary {
  id: string
  name: string
  description: string
  is_draft: boolean
  updated_at: string
}

export interface PipelineDetail extends PipelineSummary {
  nodes: PipelineNode[]
  edges: PipelineEdge[]
  columns: { id: string; label: string }[]
}

export interface ValidationResponse {
  valid: boolean
  errors: string[]
}

export interface BuildResponse {
  success: boolean
  output_shape: number[] | null
  output_values?: number[][] | null
  layer_count: number
  error?: string | null
}

export interface GenerateResponse {
  code: string
}

export type JobStatus = 'queued' | 'dispatched' | 'running' | 'done' | 'error'

export interface Job {
  id: string
  user_id: string
  pipeline_id: string
  status: JobStatus
  vast_instance_id: string
  output: string
  error: string
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface JobOutput {
  block_name: string
  output: string
  created_at: string
}
