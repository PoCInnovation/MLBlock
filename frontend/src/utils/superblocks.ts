import type { Category, InternalCatalog, PipelineNode, StageInfo, SuperBlockEntry } from '../types/catalog'
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
  /** Superblock : moteur ; bloc : nom de catégorie. Affiché dans le badge de la carte. */
  badge: string
  categoryName: string
  categoryColor: string
  advanced: boolean
}

/** Données d'affichage d'un bloc — une seule source pour la palette ET le canvas. */
export function blockCardInfo(catalog: InternalCatalog, type: string): BlockCardInfo {
  const def = catalog.blocks[type]
  const sb = catalog.superblocks.find(s => s.id === type)
  const label = def?.segs.find(s => s.t === 'text')?.v
  const catId = def?.cat ?? (sb ? sb.children.map(c => catalog.blocks[c]?.cat).find(Boolean) : undefined) ?? 'generic'
  const category = catalog.categories.find(c => c.id === catId)
  const macroColor = sb ? catalog.macro_stages?.find(m => m.id === sb.macro_stage)?.color : undefined
  const color = macroColor ?? category?.color ?? '#888'
  const categoryName = category?.name ?? catId
  return {
    title: sb?.title ?? label ?? type,
    inputs: def?.inputs ?? [],
    outputs: def?.outputs ?? [],
    engine: sb?.engine ?? def?.engine ?? 'generic',
    color,
    badge: sb ? sb.engine : categoryName,
    categoryName,
    categoryColor: color,
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

export const CATEGORY_ORDER: Record<string, number> = {
  donnees: 10,
  chargement: 20,
  pretraitement: 30,
  texte: 40,
  environnement: 50,
  couches: 110,
  activation: 120,
  normalisation: 130,
  regroupement: 140,
  modeles: 150,
  entrainement: 160,
  agents: 170,
  evaluation: 210,
  visualisation: 220,
  conversions: 310,
}

/** Palette avancée : macro (id croissant, Conversions en dernier) → catégories (ordre logique) → types filtrés par moteur. Superblocks exclus (palette simple). */
export function groupBlocks(
  catalog: InternalCatalog,
  engineFilter: string,
): { macro: StageInfo; categories: { category: Category; types: string[] }[] }[] {
  const sbIds = new Set(catalog.superblocks.map(s => s.id))
  const types = Object.keys(catalog.blocks).filter(t => !sbIds.has(t) && matchEngine(catalog.blocks[t].engine, engineFilter))
  const macros = [...(catalog.macro_stages ?? [])].sort((a, b) => (a.id === 99 ? 1 : b.id === 99 ? -1 : a.id - b.id))
  return macros.map(macro => {
    const categories = catalog.categories
      .filter(c => c.macro === macro.id)
      .sort((a, b) => ((CATEGORY_ORDER[a.id] ?? 999) - (CATEGORY_ORDER[b.id] ?? 999)) || a.name.localeCompare(b.name))
      .map(category => ({
        category,
        types: types.filter(t => catalog.blocks[t].cat === category.id),
      }))
      .filter(g => g.types.length > 0)
    return { macro, categories }
  }).filter(g => g.categories.length > 0)
}
export type CompatibleBlocksResult = {
  superblocks: { compatible: string[]; convertible: string[] }
  blocks: { compatible: string[]; convertible: string[] }
}

/** Blocs consommant `outDtype`, partitionnés entre SuperBlocks et blocs élémentaires (compatibles d'abord puis convertibles). */
export function compatibleBlocks(
  catalog: InternalCatalog,
  outDtype: string,
  exclude?: string,
): CompatibleBlocksResult {
  const graph = buildConversionGraph(catalog.blocks)
  const sbIds = new Set(catalog.superblocks?.map(s => s.id) ?? [])
  const res: CompatibleBlocksResult = {
    superblocks: { compatible: [], convertible: [] },
    blocks: { compatible: [], convertible: [] },
  }
  for (const [type, def] of Object.entries(catalog.blocks)) {
    if (type === exclude || def.inputs.length === 0) continue
    let best: 'compatible' | 'convertible' | null = null
    for (const port of def.inputs) {
      const verdict = classifyEdge(outDtype, port.dtype, graph)
      if (verdict === 'compatible') { best = 'compatible'; break }
      if (verdict === 'convertible') best = 'convertible'
    }
    const target = sbIds.has(type) ? res.superblocks : res.blocks
    if (best === 'compatible') target.compatible.push(type)
    else if (best === 'convertible') target.convertible.push(type)
  }
  return res
}
