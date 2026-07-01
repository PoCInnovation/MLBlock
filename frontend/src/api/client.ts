import axios from 'axios'
import type { CatalogManifest, GraphPayload } from '../types/catalog'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const http = axios.create({ baseURL: BASE, timeout: 10_000 })

// TODO: confirm real route with backend
export async function getCatalog(): Promise<CatalogManifest> {
  const { data } = await http.get<CatalogManifest>('/api/blocks/TODO')
  return data
}

// TODO: confirm real route with backend
// TODO: refine return type once the real response shape is known
export async function runPipeline(graph: GraphPayload): Promise<unknown> {
  const { data } = await http.post<unknown>('/api/pipeline/TODO', graph)
  return data
}
