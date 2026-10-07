import axios from 'axios'
import { z } from 'zod'
import type {
  BlockDefMap,
  Category,
  ExoTemplate,
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
import {
  buildResponseSchema,
  catalogSchema,
  confirmUploadResponseSchema,
  fileAssetSchema,
  filePreviewSchema,
  generateResponseSchema,
  jobOutputSchema,
  jobSchema,
  pipelineDetailSchema,
  pipelinePageSchema,
  requestUploadResponseSchema,
  validationSchema,
} from '../schemas/api'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const http = axios.create({ baseURL: BASE, timeout: 60_000 })

function parseOrThrow<T>(schema: z.ZodType<T>, endpoint: string, data: unknown): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 3)
      .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('; ')
    throw new Error(`${endpoint} returned an invalid response: ${issues}`)
  }
  return parsed.data
}

http.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch {
    // Session illisible (localStorage corrompu) : la requête part sans header —
    // le mode dev (MLBLOCK_DEV_AUTH) accepte, sinon le serveur répond 401.
  }
  return config
})

function toSegments(key: string, raw: unknown): Segment {
  if (raw !== null && typeof raw === 'object') {
    const p = raw as Record<string, unknown>
    const def = String(p.default ?? '')
    const typ = String(p.type ?? '')
    const desc = p.description ? String(p.description) : undefined
    if (typ === 'file') {
      const accept = p.format ? String(p.format) : undefined
      return { t: 'file', k: key, def, desc, ...(accept ? { accept } : {}) }
    }
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
  return parseCatalog(data)
}

/** Pure catalogue mapping (testable sans HTTP) : zod + forme interne. */
export function parseCatalog(data: unknown): InternalCatalog {
  const parsed = parseOrThrow(catalogSchema, 'GET /api/catalog', data)

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
        advanced: b.advanced ?? false,
        group: b.group ?? 'core',
        stage: b.stage,
        stage_name: b.stage_name,
        engine: b.engine ?? 'generic',
        macro_stage: b.macro_stage,
        macro_stage_name: b.macro_stage_name,
        is_transition: b.is_transition ?? false,
      }
    }
  }

  return {
    categories,
    blocks,
    stages: parsed.stages,
    macro_stages: parsed.macro_stages,
    superblocks: (parsed.superblocks ?? [])
      .filter(s => s.macro_stage !== undefined)
      .map(s => ({
        id: s.id,
        title: s.title,
        macro_stage: s.macro_stage as number,
        engine: s.engine ?? 'generic',
        children: [...s.children],
      })),
  }
}

export async function createPipeline(data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.post<unknown>('/api/pipelines', data)
  return parseOrThrow(pipelineDetailSchema, 'POST /api/pipelines', res)
}

export interface PipelinePage {
  items: PipelineSummary[]
  total: number
  page: number
  size: number
  pages: number
}

export async function listPipelines(size = 100): Promise<PipelinePage> {
  const { data } = await http.get<unknown>('/api/pipelines', { params: { page: 1, size } })
  return parseOrThrow(pipelinePageSchema, 'GET /api/pipelines', data)
}

export async function listExos(pattern?: string): Promise<ExoTemplate[]> {
  const { data } = await http.get<ExoTemplate[]>('/api/exos', {
    params: pattern ? { pattern } : {},
  })
  return data
}

export async function getPipeline(id: string): Promise<PipelineDetail> {
  const { data } = await http.get<unknown>(`/api/pipelines/${id}`)
  return parseOrThrow(pipelineDetailSchema, `GET /api/pipelines/${id}`, data)
}

export async function updatePipeline(id: string, data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.put<unknown>(`/api/pipelines/${id}`, data)
  return parseOrThrow(pipelineDetailSchema, `PUT /api/pipelines/${id}`, res)
}

export async function deletePipeline(id: string): Promise<void> {
  await http.delete(`/api/pipelines/${id}`)
}

export async function validateGraph(nodes: PipelineNode[], edges: PipelineEdge[]): Promise<ValidationResponse> {
  const { data } = await http.post<unknown>('/api/validate', { nodes, edges })
  return validationSchema.parse(data)
}

export async function buildPipeline(id: string): Promise<BuildResponse> {
  const { data } = await http.post<unknown>(`/api/pipelines/${id}/build`)
  return parseOrThrow(buildResponseSchema, `POST /api/pipelines/${id}/build`, data)
}

export async function generatePipelineCode(id: string): Promise<GenerateResponse> {
  const { data } = await http.post<unknown>(`/api/pipelines/${id}/generate`)
  return parseOrThrow(generateResponseSchema, `POST /api/pipelines/${id}/generate`, data)
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

export type FileAssetItem = z.infer<typeof fileAssetSchema>
export type FilePreview = z.infer<typeof filePreviewSchema>
export type RequestUploadInput = { name: string; size_bytes: number; mime: string; block_type?: string }

/** Réserve le quota et obtient une URL signée d'écriture (les octets ne transitent pas par le backend). */
export async function requestUpload(input: RequestUploadInput): Promise<z.infer<typeof requestUploadResponseSchema>> {
  const { data } = await http.post<unknown>('/api/files/request-upload', input)
  return parseOrThrow(requestUploadResponseSchema, 'POST /api/files/request-upload', data)
}

/** Valide taille + contenu sniffé, passe l'asset en ready. Rend l'URL publique et l'aperçu. */
export async function confirmUpload(id: string): Promise<z.infer<typeof confirmUploadResponseSchema>> {
  const { data } = await http.post<unknown>(`/api/files/${id}/confirm`)
  return parseOrThrow(confirmUploadResponseSchema, `POST /api/files/${id}/confirm`, data)
}

/** Galerie « Mes fichiers » : assets ready de l'utilisateur. */
export async function listFiles(): Promise<FileAssetItem[]> {
  const { data } = await http.get<unknown>('/api/files')
  return parseOrThrow(z.array(fileAssetSchema), 'GET /api/files', data)
}

/** Aperçu à la demande (lignes CSV/texte, miniature image). */
export async function previewFile(id: string): Promise<FilePreview> {
  const { data } = await http.get<unknown>(`/api/files/${id}/preview`)
  return parseOrThrow(filePreviewSchema, `GET /api/files/${id}/preview`, data)
}

/** Supprime ligne + objet, libère le quota immédiatement. */
export async function deleteFile(id: string): Promise<void> {
  await http.delete(`/api/files/${id}`)
}

/** URL user-uploads absente de la galerie chargée = expirée/supprimée → réimporter. */
export function isFileAssetExpired(url: string, assets: FileAssetItem[], loaded: boolean): boolean {
  if (!loaded || !url.startsWith('https://')) return false
  if (!url.includes('/storage/v1/object/') || !url.includes('/user-uploads/')) return false
  return !assets.some(a => a.public_url === url)
}

/** Refuse un drop hors accept avant tout upload (le file input natif ne filtre que le dialogue). */
export function acceptsFile(accept: string | undefined, filename: string): boolean {
  if (!accept?.trim()) return true
  const parts = filename.toLowerCase().split('.')
  const ext = parts.length > 1 ? parts[parts.length - 1] : ''
  const wanted = accept.toLowerCase().split(/[|,]/).map(a => a.replace(/^\./, '').trim()).filter(Boolean)
  return wanted.includes(ext)
}

export async function executePipeline(id: string): Promise<Job> {
  const { data } = await http.post<Job>(`/api/pipelines/${id}/execute`)
  return data
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await http.get<unknown>(`/api/jobs/${id}`)
  return parseOrThrow(jobSchema, `GET /api/jobs/${id}`, data)
}

export async function getJobOutputs(id: string): Promise<JobOutput[]> {
  const { data } = await http.get<unknown>(`/api/jobs/${id}/outputs`)
  return parseOrThrow(z.array(jobOutputSchema), `GET /api/jobs/${id}/outputs`, data)
}

export async function listPipelineJobs(id: string): Promise<Job[]> {
  const { data } = await http.get<unknown>(`/api/pipelines/${id}/jobs`)
  return parseOrThrow(z.array(jobSchema), `GET /api/pipelines/${id}/jobs`, data)
}
