import type { PipelineNode, PipelineEdge } from '../types/catalog'

export type PendingStash = {
  name: string
  nodes: PipelineNode[]
  edges: PipelineEdge[]
  pipelineId: string | null
  savedAt: string
}

const keyFor = (userId: string) => `mlblock-pending-${userId}`

/** Écrit le snapshot de travail non sauvegardé (sync — utilisable dans beforeunload). */
export function writeStash(userId: string, stash: PendingStash): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(stash))
  } catch {
    /* quota/privé — perte silencieuse acceptée (PoC) */
  }
}

export function readStash(userId: string): PendingStash | null {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    if (!raw) return null
    const data = JSON.parse(raw) as PendingStash
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null
    return data
  } catch {
    return null
  }
}

export function clearStash(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId))
  } catch {
    /* ignore */
  }
}
