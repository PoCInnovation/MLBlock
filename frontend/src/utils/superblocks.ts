import type { InternalCatalog, PipelineNode, SuperBlockEntry } from '../types/catalog'
import { buildConversionGraph, classifyEdge } from './typeCheck'

/** Enfants par défaut d'un SuperBlock, matérialisés pour un nœud posé. */
export function defaultChildren(
  sb: SuperBlockEntry,
  catalog: InternalCatalog,
  nodeId: string,
): PipelineNode[] {
  const kids: PipelineNode[] = []
  for (const type of sb.children) {
    const def = catalog.blocks[type]
    if (!def) continue
    const params: Record<string, unknown> = {}
    for (const seg of def.segs) {
      if ('k' in seg && 'def' in seg) params[seg.k] = seg.def
    }
    kids.push({ id: `${nodeId}.${type}`, type, params })
  }
  return kids
}

/** Couleurs moteurs (spec §5 — miroir des tokens --color-engine-* de index.css). */
export const ENGINE_COLORS: Record<string, string> = {
  pytorch: '#EA580C',
  sklearn: '#2563EB',
  gym: '#059669',
  mlflow: '#9333EA',
  viz: '#D97706',
  generic: '#6B7280',
}

export function engineColor(engine: string): string {
  return ENGINE_COLORS[engine] ?? ENGINE_COLORS.generic
}

/** Ponts inter-moteurs : [moteur d'entrée, moteur de sortie] pour le dégradé. */
export const TRANSITION_GRADIENT: Record<string, [string, string]> = {
  df_to_tensor: ['sklearn', 'pytorch'],
  to_tensor: ['viz', 'pytorch'],
  env_to_tensor: ['gym', 'pytorch'],
  module_to_policy: ['pytorch', 'gym'],
}

/** Style d'arête : sans dégradé on passe le style tel quel ; avec dégradé on
 *  retire `stroke` (sinon l'inline écrase la classe `mlb-edge-*` qui peint
 *  l'url) et on garde le reste (dasharray convertible). */
export function resolveEdgeStyle(
  base: { stroke?: string; strokeDasharray?: string | number },
  gradient: { from: string; to: string } | undefined,
): { style: { stroke?: string; strokeDasharray?: string | number }; pairClass: string } {
  if (!gradient) return { style: { ...base }, pairClass: '' }
  const { stroke: _dropped, ...rest } = base
  void _dropped
  return { style: rest, pairClass: ` mlb-edge-${gradient.from}-to-${gradient.to}` }
}

export type BlockCardInfo = {
  title: string
  inputs: { name: string; dtype: string }[]
  outputs: { name: string; dtype: string }[]
  engine: string
  color: string
  advanced: boolean
}

/** Données d'affichage d'un bloc — une seule source pour la palette ET le canvas. */
export function blockCardInfo(catalog: InternalCatalog, type: string): BlockCardInfo {
  const def = catalog.blocks[type]
  const sb = catalog.superblocks.find(s => s.id === type)
  const label = def?.segs.find(s => s.t === 'text')?.v
  return {
    title: sb?.title ?? label ?? type,
    inputs: def?.inputs ?? [],
    outputs: def?.outputs ?? [],
    engine: sb?.engine ?? def?.engine ?? 'generic',
    color: catalog.categories.find(c => c.id === def?.cat)?.color ?? '#888',
    advanced: def?.advanced ?? false,
  }
}

/** Enfants d'un SuperBlock réellement présents au catalogue (anti-fantômes). */
export function availableChildren(sb: SuperBlockEntry, catalog: InternalCatalog): string[] {
  return sb.children.filter(t => Boolean(catalog.blocks[t]))
}

/** Filtre moteur de la sheet 'add' : all | pytorch | sklearn | gym | mlflow-viz. */
export function matchEngine(engine: string, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'mlflow-viz') return engine === 'mlflow' || engine === 'viz'
  return engine === filter
}

/** SuperBlocks groupés par macro_stage, ordre croissant. */
export function groupSuperblocks(sbs: SuperBlockEntry[]): { stage: number; items: SuperBlockEntry[] }[] {
  const byStage = new Map<number, SuperBlockEntry[]>()
  for (const sb of sbs) {
    const list = byStage.get(sb.macro_stage) ?? []
    list.push(sb)
    byStage.set(sb.macro_stage, list)
  }
  return [...byStage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([stage, items]) => ({ stage, items }))
}
/** Blocs consommant `outDtype`, compatibles d'abord puis convertibles. */
export function compatibleBlocks(
  catalog: InternalCatalog,
  outDtype: string,
  exclude?: string,
): { compatible: string[]; convertible: string[] } {
  const graph = buildConversionGraph(catalog.blocks)
  const compatible: string[] = []
  const convertible: string[] = []
  for (const [type, def] of Object.entries(catalog.blocks)) {
    if (type === exclude || def.inputs.length === 0) continue
    let best: 'compatible' | 'convertible' | null = null
    for (const port of def.inputs) {
      const verdict = classifyEdge(outDtype, port.dtype, graph)
      if (verdict === 'compatible') { best = 'compatible'; break }
      if (verdict === 'convertible') best = 'convertible'
    }
    if (best === 'compatible') compatible.push(type)
    else if (best === 'convertible') convertible.push(type)
  }
  return { compatible, convertible }
}
