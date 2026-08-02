import axios from 'axios'
import type {
  BlockDef,
  BlockDefMap,
  Category,
  InternalCatalog,
  PipelineCreate,
  PipelineDetail,
  PipelineNode,
  PipelineEdge,
  ValidationResponse,
  BuildResponse,
  GenerateResponse,
  Segment,
} from '../types/catalog'
import { supabase } from '../services/supabase'
import { catalogSchema, validationSchema } from '../schemas/api'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const http = axios.create({ baseURL: BASE, timeout: 60_000 })

http.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

function toSegments(key: string, raw: unknown): Segment {
  if (raw !== null && typeof raw === 'object') {
    const p = raw as Record<string, unknown>
    const def = String(p.default ?? '')
    const typ = String(p.type ?? '')
    if (typ === 'file') return { t: 'file', k: key, def }
    if (Array.isArray(p.options) && p.options.length > 0) {
      return { t: 'sel', k: key, def, opts: p.options.map(String) }
    }
    return { t: 'num', k: key, def }
  }
  return { t: 'num', k: key, def: '' }
}

export async function fetchCatalog(): Promise<InternalCatalog> {
  const { data } = await http.get<unknown>('/api/catalog')
  const parsed = catalogSchema.parse(data)

  const categories: Category[] = parsed.categories.map(c => ({ id: c.id, name: c.name, color: c.color }))
  const blocks: BlockDefMap = {}

  for (const cat of parsed.categories) {
    for (const b of cat.blocks) {
      const segs: Segment[] = [{ t: 'text', v: b.label }]
      for (const [key, raw] of Object.entries(b.params)) {
        segs.push(toSegments(key, raw))
      }
      blocks[b.type] = { cat: cat.id, segs }
    }
  }

  return { categories, blocks }
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
  const { data } = await http.post<unknown>('/api/validate', { nodes, edges })
  return validationSchema.parse(data)
}

export async function buildPipeline(id: number): Promise<BuildResponse> {
  const { data } = await http.post<BuildResponse>(`/api/pipelines/${id}/build`)
  return data
}

export async function generatePipelineCode(id: number): Promise<GenerateResponse> {
  const { data } = await http.post<GenerateResponse>(`/api/pipelines/${id}/generate`)
  return data
}
