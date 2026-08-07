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
  PipelineSummary,
  Job,
  JobOutput,
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
    const desc = p.description ? String(p.description) : undefined
    if (typ === 'file') return { t: 'file', k: key, def, desc }
    if (typ === 'bool') return { t: 'bool', k: key, def, desc }
    if (Array.isArray(p.options) && p.options.length > 0) {
      return { t: 'sel', k: key, def, opts: p.options.map(String), desc }
    }
    if (Array.isArray(p.choices) && p.choices.length > 0) {
      return { t: 'sug', k: key, def, opts: p.choices.map(String), desc }
    }
    if (typ.startsWith('list')) {
      return {
        t: 'list', k: key, def,
        format: p.format ? String(p.format) : undefined,
        len: typeof p.len === 'number' ? p.len : undefined,
        opts: Array.isArray(p.suggestions) ? p.suggestions.map(String) : undefined,
        desc,
      }
    }
    return {
      t: 'num', k: key, def,
      min: typeof p.min === 'number' ? p.min : undefined,
      max: typeof p.max === 'number' ? p.max : undefined,
      step: typeof p.step === 'number' ? p.step : undefined,
      odd: p.odd === true ? true : undefined,
      opts: Array.isArray(p.suggestions) ? p.suggestions.map(String) : undefined,
      desc,
    }
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
      const portNames = new Set((b.inputs ?? []).map(p => String(p.name)))
      for (const [key, raw] of Object.entries(b.params)) {
        if (portNames.has(key)) continue // data ports are handles, not fields
        segs.push(toSegments(key, raw))
      }
      blocks[b.type] = {
        cat: cat.id,
        segs,
        inputs: (b.inputs ?? []).map(p => ({ name: String(p.name), dtype: String(p.dtype) })),
        outputs: (b.outputs ?? []).map(p => ({ name: String(p.name), dtype: String(p.dtype) })),
        description: b.description ? String(b.description) : '',
      }
    }
  }

  return { categories, blocks }
}

export async function createPipeline(data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.post<PipelineDetail>('/api/pipelines', data)
  return res
}

export interface PipelinePage {
  items: PipelineSummary[]
  total: number
  page: number
  size: number
  pages: number
}

export async function listPipelines(size = 100): Promise<PipelinePage> {
  const { data } = await http.get<PipelinePage>('/api/pipelines', { params: { page: 1, size } })
  return data
}

export async function getPipeline(id: string): Promise<PipelineDetail> {
  const { data } = await http.get<PipelineDetail>(`/api/pipelines/${id}`)
  return data
}

export async function updatePipeline(id: string, data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.put<PipelineDetail>(`/api/pipelines/${id}`, data)
  return res
}

export async function deletePipeline(id: string): Promise<void> {
  await http.delete(`/api/pipelines/${id}`)
}

export async function validateGraph(nodes: PipelineNode[], edges: PipelineEdge[]): Promise<ValidationResponse> {
  const { data } = await http.post<unknown>('/api/validate', { nodes, edges })
  return validationSchema.parse(data)
}

export async function buildPipeline(id: string): Promise<BuildResponse> {
  const { data } = await http.post<BuildResponse>(`/api/pipelines/${id}/build`)
  return data
}

export async function generatePipelineCode(id: string): Promise<GenerateResponse> {
  const { data } = await http.post<GenerateResponse>(`/api/pipelines/${id}/generate`)
  return data
}

const columnsCache = new Map<string, string[] | null>()

/** Column names of a stored CSV (cached per URL). Null = unknown/unresolvable. */
export async function fetchFileColumns(url: string): Promise<string[] | null> {
  if (columnsCache.has(url)) return columnsCache.get(url) ?? null
  try {
    const { data } = await http.get<{ columns: string[] }>('/api/files/columns', { params: { url } })
    const columns = Array.isArray(data?.columns) ? data.columns : []
    columnsCache.set(url, columns)
    return columns
  } catch {
    columnsCache.set(url, null)
    return null
  }
}

export async function executePipeline(id: string): Promise<Job> {
  const { data } = await http.post<Job>(`/api/pipelines/${id}/execute`)
  return data
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await http.get<Job>(`/api/jobs/${id}`)
  return data
}

export async function getJobOutputs(id: string): Promise<JobOutput[]> {
  const { data } = await http.get<JobOutput[]>(`/api/jobs/${id}/outputs`)
  return data
}

export async function listPipelineJobs(id: string): Promise<Job[]> {
  const { data } = await http.get<Job[]>(`/api/pipelines/${id}/jobs`)
  return data
}
