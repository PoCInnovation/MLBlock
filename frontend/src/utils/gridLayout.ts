import type { Edge, Node } from 'reactflow'

/** Layout de la vue grille (kanban) : colonnes verticales, rangées empilées. */
export const COL_W = 340 // largeur d'une colonne (avec gap)
export const ROW_H = 190 // hauteur d'une rangée
export const COL_PAD = 12 // padding interne d'une colonne
export const HEADER_H = 42 // hauteur du CardHeader des colonnes
export const BLOCK_W = 244 // largeur des blocs en vue grille (alignée sur la carte)

export type GridPos = { col: number; row: number }

export type GridColumn = { id: string; label: string }

export type GridPosition = { x: number; y: number; col?: number; row?: number }

/** Hauteur de repli d'un bloc pas encore mesuré ; hauteur du pied de carte. */
export const FALLBACK_H = 170
export const FOOTER_H = 30

/** Index de colonne d'un nœud (stocké dans position.col, ou dérivé de x). */
export function colOf(n: Node): number {
  const p = n.position as GridPosition
  if (p.col !== undefined) return p.col
  return Math.max(0, Math.round((n.position.x - (COL_W - BLOCK_W) / 2) / COL_W))
}

/** Rangée d'un nœud (stockée dans position.row, ou dérivée de y). */
export function rowOf(n: Node): number {
  const p = n.position as GridPosition
  if (p.row !== undefined) return p.row
  return Math.max(0, Math.round((n.position.y - HEADER_H - COL_PAD) / ROW_H))
}

export function hasGridPos(n: Node): boolean {
  const p = n.position as GridPosition
  return p.col !== undefined && p.row !== undefined
}

/** Position absolue dérivée d'une cellule — centrée dans la carte de colonne,
    sous le CardHeader (les blocs sont CONTENUS visuellement dans la colonne). */
export function posFor(col: number, row: number): { x: number; y: number; col: number; row: number } {
  return {
    x: col * COL_W + (COL_W - BLOCK_W) / 2,
    y: HEADER_H + row * ROW_H + COL_PAD,
    col,
    row,
  }
}

/** Arrondit une position flottante vers la cellule de grille la plus proche. */
export function snapPosition(pos: { x: number; y: number }): { x: number; y: number; col: number; row: number } {
  return posFor(
    Math.round((pos.x - (COL_W - BLOCK_W) / 2) / COL_W),
    Math.round((pos.y - HEADER_H - COL_PAD) / ROW_H)
  )
}

/** Règle gauche→droite : un lien est valide si colonne(cible) > colonne(source). */
export function isEdgeValid(e: Edge, nodes: Node[]): boolean {
  const src = nodes.find(n => n.id === e.source)
  const tgt = nodes.find(n => n.id === e.target)
  if (!src || !tgt) return true
  return colOf(tgt) > colOf(src)
}

/** Retire les liens qui violent la règle gauche→droite. Retourne [edges, retirés]. */
export function pruneInvalidEdges(nodes: Node[], edges: Edge[]): [Edge[], number] {
  const valid: Edge[] = []
  let removed = 0
  for (const e of edges) {
    if (isEdgeValid(e, nodes)) valid.push(e)
    else removed++
  }
  return [valid, removed]
}

/** Dernière rangée occupée d'une colonne (fin de pile pour le drop). */
export function maxRowInCol(nodes: Node[], col: number): number {
  let max = -1
  for (const n of nodes) {
    if (colOf(n) === col) {
      const r = rowOf(n)
      if (r > max) max = r
    }
  }
  return max
}

/** Niveaux topologiques (longest path) : colonne naturelle de chaque bloc.
    Un bloc sans parents = niveau 0 ; niveau(n) = 1 + max(niveau des parents). */
export function levelsFor(nodes: Node[], edges: Edge[]): Map<string, number> {
  const byId = new Map(nodes.map(n => [n.id, n]))
  const level = new Map<string, number>()
  const visit = (id: string): number => {
    const cached = level.get(id)
    if (cached !== undefined) return cached
    let l = 0
    for (const e of edges) {
      if (e.target === id && byId.has(e.source)) {
        l = Math.max(l, visit(e.source) + 1)
      }
    }
    level.set(id, l)
    return l
  }
  for (const n of nodes) visit(n.id)
  return level
}

/** Migration x/y → grille : les blocs déjà en col/row sont conservés ; les
    autres reçoivent col = niveau topologique, row = rang vertical. */
export function migrateToGrid(nodes: Node[], edges: Edge[]): Node[] {
  const levels = levelsFor(nodes, edges)
  const groups = new Map<number, Node[]>()
  for (const n of nodes) {
    const l = hasGridPos(n) ? colOf(n) : (levels.get(n.id) ?? 0)
    const list = groups.get(l) ?? []
    list.push(n)
    groups.set(l, list)
  }
  const out: Node[] = []
  for (const [l, list] of groups) {
    list.sort((a, b) => a.position.y - b.position.y)
    list.forEach((n, i) => out.push({ ...n, position: posFor(l, i) }))
  }
  return out
}

/** Hauteur d'une carte de colonne : header + blocs empilés (hauteurs mesurées)
    + pied — la colonne épouse son contenu. */
export function colHeight(nodes: Node[], col: number): number {
  const inCol = nodes
    .filter(n => colOf(n) === col)
    .sort((a, b) => rowOf(a) - rowOf(b))
  let h = HEADER_H + COL_PAD
  for (const n of inCol) h += ((n.height as number) ?? FALLBACK_H) + COL_PAD
  return Math.max(220, h + FOOTER_H)
}
