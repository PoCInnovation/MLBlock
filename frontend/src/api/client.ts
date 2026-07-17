import axios from 'axios'
import type {
  BlockDetail,
  BlockSummary,
  BlockDef,
  BlockDefMap,
  Category,
  InternalCatalog,
  PageResult,
  PipelineCreate,
  PipelineDetail,
  PipelineNode,
  PipelineEdge,
  ValidationResponse,
  BuildResponse,
  GenerateResponse,
  Segment,
} from '../types/catalog'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const http = axios.create({ baseURL: BASE, timeout: 10_000 })

const CATEGORY_META: Record<string, { name: string; color: string }> = {
  data:    { name: 'Données',       color: '#5B8DEF' },
  prep:    { name: 'Prétraitement', color: '#7C67E5' },
  model:   { name: 'Modèle',        color: '#D97757' },
  train:   { name: 'Entraînement',  color: '#E8A44A' },
  eval:    { name: 'Évaluation',    color: '#66C7B0' },
  control: { name: 'Contrôle',      color: '#C06B8A' },
}

const FALLBACK_COLOR = '#888888'

function adaptParam(key: string, raw: unknown): Segment {
  if (raw !== null && typeof raw === 'object') {
    const p = raw as Record<string, unknown>
    const def = String(p.default ?? '')
    if (Array.isArray(p.options) && p.options.length > 0) {
      return { t: 'sel', k: key, def, opts: p.options.map(String) }
    }
    return { t: 'num', k: key, def }
  }
  return { t: 'num', k: key, def: '' }
}

function adaptBlockDetail(detail: BlockDetail): { type: string; def: BlockDef } {
  const segs: Segment[] = [{ t: 'text', v: detail.label }]
  for (const [key, raw] of Object.entries(detail.params)) {
    segs.push(adaptParam(key, raw))
  }
  return { type: detail.type, def: { cat: detail.category, segs } }
}

function adaptCategories(apiCategories: Record<string, string[]>): Category[] {
  return Object.keys(apiCategories).map(id => {
    const meta = CATEGORY_META[id]
    return { id, name: meta?.name ?? id, color: meta?.color ?? FALLBACK_COLOR }
  })
}

async function fetchBlockSummariesPage(page: number, size: number): Promise<PageResult<BlockSummary>> {
  const { data } = await http.get<PageResult<BlockSummary>>('/api/blocks', { params: { page, size } })
  return data
}

async function fetchAllBlockSummaries(): Promise<BlockSummary[]> {
  const first = await fetchBlockSummariesPage(1, 100)
  if (first.pages <= 1) return first.items
  const rest = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, i) => fetchBlockSummariesPage(i + 2, 100))
  )
  return [first.items, ...rest.map(p => p.items)].flat()
}

async function fetchBlockCategories(): Promise<Record<string, string[]>> {
  const { data } = await http.get<Record<string, string[]>>('/api/blocks/categories')
  return data
}

export async function fetchBlockDetail(typeName: string): Promise<BlockDetail> {
  const { data } = await http.get<BlockDetail>(`/api/blocks/${encodeURIComponent(typeName)}`)
  return data
}

export async function fetchCatalog(): Promise<InternalCatalog> {
  const [apiCategories, summaries] = await Promise.all([
    fetchBlockCategories(),
    fetchAllBlockSummaries(),
  ])

  const types = [...new Set(summaries.map(s => s.type))]
  const details = await Promise.all(types.map(fetchBlockDetail))

  const blocks: BlockDefMap = {}
  for (const detail of details) {
    const { type, def } = adaptBlockDetail(detail)
    blocks[type] = def
  }

  return { categories: adaptCategories(apiCategories), blocks }
}

export async function createPipeline(data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.post<PipelineDetail>('/api/pipelines', data)
  return res
}

export async function updatePipeline(id: number, data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.put<PipelineDetail>(`/api/pipelines/${id}`, data)
  return res
}

export async function deletePipeline(id: number): Promise<void> {
  await http.delete(`/api/pipelines/${id}`)
}

export async function validateGraph(nodes: PipelineNode[], edges: PipelineEdge[]): Promise<ValidationResponse> {
  const { data } = await http.post<ValidationResponse>('/api/validate', { nodes, edges })
  return data
}

export async function buildPipeline(id: number): Promise<BuildResponse> {
  const { data } = await http.post<BuildResponse>(`/api/pipelines/${id}/build`)
  return data
}

export async function generatePipelineCode(id: number): Promise<GenerateResponse> {
  const { data } = await http.post<GenerateResponse>(`/api/pipelines/${id}/generate`)
  return data
}
