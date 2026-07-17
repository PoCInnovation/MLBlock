import axios from 'axios'
import { SignJWT } from 'jose'
import type {
  BackendBlock,
  BackendCategory,
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

// ── Dev auth shim (VITE_DEV_MODE=true only) ──────────────────────────
// Signs a JWT with the backend's mock secret so local dev does not need
// a real Supabase session. Never runs when VITE_DEV_MODE is unset/false.
if (import.meta.env.VITE_DEV_MODE === 'true') {
  let _cachedToken: string | null = null
  let _tokenExpiry = 0

  http.interceptors.request.use(async (config) => {
    const now = Math.floor(Date.now() / 1000)
    if (!_cachedToken || _tokenExpiry < now + 60) {
      const secret = new TextEncoder().encode('mock-secret-for-testing')
      _cachedToken = await new SignJWT({ sub: 'dev-user-00000000-0000-0000-0000-000000000001' })
        .setProtectedHeader({ alg: 'HS256' })
        .setAudience('authenticated')
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret)
      _tokenExpiry = now + 86400
    }
    config.headers.Authorization = `Bearer ${_cachedToken}`
    return config
  })
}

// ── Category display name overrides (French labels) ──────────────────
// Keys are the exact category names the backend derives from folder names
// (e.g. "data" from "data_22C55E"). Colors come from the API, not here.
const CATEGORY_DISPLAY: Record<string, string> = {
  data:          'Données',
  neural:        'Neuronal',
  models:        'Modèles',
  rl:            'Renforcement',
  environment:   'Environnement',
  evaluation:    'Évaluation',
  visualization: 'Visualisation',
  advanced:      'Avancé',
}

const FALLBACK_COLOR = '#888888'

function toTitleCase(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

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

function adaptBlockDef(block: BackendBlock): { type: string; def: BlockDef } {
  const label = toTitleCase(block.name)
  const segs: Segment[] = [{ t: 'text', v: label }]
  for (const [key, raw] of Object.entries(block.params)) {
    segs.push(adaptParam(key, raw))
  }
  return { type: block.name, def: { cat: block.category.name, segs } }
}

function adaptBlockSummary(block: BackendBlock): BlockSummary {
  return {
    type: block.name,
    label: toTitleCase(block.name),
    category: block.category.name,
    // KNOWN GAP: backend provides no input port count — defaults to 0.
    // Requires a backend "inputs: list[dict]" field to be populated correctly.
    inputs: 0,
    outputs: block.outputs.length,
    can_build: true,
  }
}

function adaptCategories(
  apiCats: BackendCategory[],
  summaries: BlockSummary[],
): Category[] {
  // Group block types by category from summaries (the categories endpoint
  // only returns metadata with counts, not which blocks belong to each).
  const seenInSummaries = new Set(summaries.map(s => s.category))
  const catMap = new Map(apiCats.map(c => [c.name, c]))

  // Merge: include all categories that appeared in either the API list or summaries
  const allNames = new Set([...apiCats.map(c => c.name), ...seenInSummaries])

  return [...allNames].map(id => ({
    id,
    name: CATEGORY_DISPLAY[id] ?? id,
    color: catMap.get(id)?.color ?? FALLBACK_COLOR,
  }))
}

async function fetchBlockSummariesPage(page: number): Promise<PageResult<BackendBlock>> {
  const { data } = await http.get<PageResult<BackendBlock>>('/api/blocks', { params: { page } })
  return data
}

async function fetchAllBlockSummaries(): Promise<BlockSummary[]> {
  const first = await fetchBlockSummariesPage(1)
  const rawBlocks: BackendBlock[] = [...first.items]
  if (first.pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: first.pages - 1 }, (_, i) => fetchBlockSummariesPage(i + 2))
    )
    rawBlocks.push(...rest.flatMap(p => p.items))
  }
  return rawBlocks.map(adaptBlockSummary)
}

async function fetchBlockCategories(): Promise<BackendCategory[]> {
  const { data } = await http.get<BackendCategory[]>('/api/blocks/categories')
  return data
}

export async function fetchBlockDetail(typeName: string): Promise<BackendBlock> {
  const { data } = await http.get<BackendBlock>(`/api/blocks/${encodeURIComponent(typeName)}`)
  return data
}

export async function fetchCatalog(): Promise<InternalCatalog> {
  const [apiCategories, summaries] = await Promise.all([
    fetchBlockCategories(),
    fetchAllBlockSummaries(),
  ])

  const types = [...new Set(summaries.map(s => s.type))]
  const rawDetails = await Promise.all(types.map(fetchBlockDetail))

  const blocks: BlockDefMap = {}
  for (const raw of rawDetails) {
    const { type, def } = adaptBlockDef(raw)
    blocks[type] = def
  }

  return { categories: adaptCategories(apiCategories, summaries), blocks }
}

export async function createPipeline(data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.post<PipelineDetail>('/api/pipelines', data)
  return res
}

export async function updatePipeline(id: string, data: PipelineCreate): Promise<PipelineDetail> {
  const { data: res } = await http.put<PipelineDetail>(`/api/pipelines/${id}`, data)
  return res
}

export async function deletePipeline(id: string): Promise<void> {
  await http.delete(`/api/pipelines/${id}`)
}

export async function validateGraph(nodes: PipelineNode[], edges: PipelineEdge[]): Promise<ValidationResponse> {
  const { data } = await http.post<ValidationResponse>('/api/validate', { nodes, edges })
  return data
}

export async function buildPipeline(id: string): Promise<BuildResponse> {
  const { data } = await http.post<BuildResponse>(`/api/pipelines/${id}/build`)
  return data
}

export async function generatePipelineCode(id: string): Promise<GenerateResponse> {
  const { data } = await http.post<GenerateResponse>(`/api/pipelines/${id}/generate`)
  return data
}
