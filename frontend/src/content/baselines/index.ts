import { z } from 'zod'
import type { PipelineNode, PipelineEdge } from '../../types/catalog'

type Etape = 'chargement' | 'traitement' | 'evaluation' | 'visualisation'

const PatternSchema = z.enum(['cnn', 'clustering', 'classification', 'sequences'])
type Pattern = z.infer<typeof PatternSchema>

export const ETAPES: Etape[] = ['chargement', 'traitement', 'evaluation', 'visualisation']

export const PATTERN_LABELS: Record<Pattern, string> = {
  cnn: 'CNN / imagerie',
  clustering: 'Clustering',
  classification: 'Classification & régression',
  sequences: 'Séquences / transformer',
}

export const ETAPE_LABELS: Record<Etape, string> = {
  chargement: 'Chargement',
  traitement: 'Traitement',
  evaluation: 'Évaluation',
  visualisation: 'Visualisation',
}

const BaselineNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
  children: z.array(z.unknown()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
})
const BaselineEdgeSchema = z.object({
  source: z.string(),
  source_port: z.string().optional(),
  target: z.string(),
  target_port: z.string().optional(),
})
const BaselineSchema = z.object({
  id: z.string(),
  title: z.string(),
  pattern: PatternSchema,
  description: z.string(),
  difficulty: z.string().optional(),
  etapes: z.record(z.string(), z.array(z.string())).optional(),
  name: z.string(),
  nodes: z.array(BaselineNodeSchema),
  edges: z.array(BaselineEdgeSchema),
})

export type Baseline = z.infer<typeof BaselineSchema> & {
  slug: string
  /** nodes au format PipelineNode attendu par createPipeline/loadPipeline. */
  pipelineNodes: PipelineNode[]
  pipelineEdges: PipelineEdge[]
  /** index nodeId -> étape, pour filtrer la palette par étape. */
  etapeByNode: Record<string, Etape>
}

const rawModules = import.meta.glob('./*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function buildBaselines(): Baseline[] {
  const out: Baseline[] = []
  for (const [path, raw] of Object.entries(rawModules)) {
    const slug = path.replace(/^\.\//, '').replace(/\.json$/, '')
    let parsed
    try {
      parsed = BaselineSchema.safeParse(JSON.parse(raw as string))
    } catch {
      console.warn(`[baselines] JSON invalide ${slug}`)
      continue
    }
    if (!parsed.success) {
      console.warn(`[baselines] schema invalide ${slug}:`, parsed.error.flatten())
      continue
    }
    const b = parsed.data
    const etapeByNode: Record<string, Etape> = {}
    for (const [etape, types] of Object.entries(b.etapes ?? {})) {
      if (!ETAPES.includes(etape as Etape)) {
        console.warn(`[baselines] étape inconnue ${etape} dans ${slug}`)
        continue
      }
      for (const t of types) etapeByNode[t] = etape as Etape
    }
    out.push({
      ...b,
      slug,
      pipelineNodes: b.nodes.map(n => ({
        id: n.id,
        type: n.type,
        params: (n.params as Record<string, unknown> | undefined) ?? {},
        children: (n.children as PipelineNode[] | undefined) ?? [],
        position: n.position,
      })),
      pipelineEdges: b.edges.map(e => ({
        source: e.source,
        source_port: e.source_port ?? 'out_1',
        target: e.target,
        target_port: e.target_port ?? 'in_1',
      })),
      etapeByNode,
    })
  }
  return out
}

export const baselines: Baseline[] = buildBaselines()

export function getBaseline(slug: string): Baseline | undefined {
  return baselines.find(b => b.slug === slug || b.id === slug)
}