import type { Edge, Node } from 'reactflow'

/** Layout de la vue grille (kanban) : colonnes verticales, rangées empilées. */
export const COL_W = 340 // largeur d'une colonne (avec gap)
export const ROW_H = 190 // hauteur d'une rangée
export const COL_PAD = 12 // padding interne d'une colonne

export type GridPos = { col: number; row: number }

export type GridColumn = { id: string; label: string }

export type GridPosition = { x: number; y: number; col?: number; row?: number }

/** Index de colonne d'un nœud (stocké dans position.col, ou dérivé de x). */
export function colOf(n: Node): number {
  const p = n.position as GridPosition
  if (p.col !== undefined) return p.col
  return Math.max(0, Math.round((n.position.x - COL_PAD) / COL_W))
}

/** Rangée d'un nœud (stockée dans position.row, ou dérivée de y). */
export function rowOf(n: Node): number {
  const p = n.position as GridPosition
  if (p.row !== undefined) return p.row
  return Math.max(0, Math.round((n.position.y - COL_PAD) / ROW_H))
}

export function hasGridPos(n: Node): boolean {
  const p = n.position as GridPosition
  return p.col !== undefined && p.row !== undefined
}

/** Position absolue dérivée d'une cellule (colonne, rangée). */
export function posFor(col: number, row: number): { x: number; y: number; col: number; row: number } {
  return { x: col * COL_W + COL_PAD, y: row * ROW_H + COL_PAD, col, row }
}

/** Arrondit une position flottante vers la cellule de grille la plus proche. */
export function snapPosition(pos: { x: number; y: number }): { x: number; y: number; col: number; row: number } {
  return posFor(Math.round((pos.x - COL_PAD) / COL_W), Math.round((pos.y - COL_PAD) / ROW_H))
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
