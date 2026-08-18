import { describe, it, expect } from 'vitest'
import { arrangeGraph, type LayoutNode, type LayoutEdge } from './layout'

const node = (id: string, width = 200, height = 120): LayoutNode => ({
  id,
  width,
  height,
})

describe('arrangeGraph', () => {
  it('dispose une chaîne A→B→C de haut en bas (B.y > A.y, C.y > B.y)', () => {
    const nodes = [node('A'), node('B'), node('C')]
    const edges: LayoutEdge[] = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
    ]
    const pos = arrangeGraph(nodes, edges)
    expect(pos.B.y).toBeGreaterThan(pos.A.y)
    expect(pos.C.y).toBeGreaterThan(pos.B.y)
  })

  it('met B et C sur le même rang pour un diamant A→{B,C}→D', () => {
    const nodes = [node('A'), node('B'), node('C'), node('D')]
    const edges: LayoutEdge[] = [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' },
      { source: 'B', target: 'D' },
      { source: 'C', target: 'D' },
    ]
    const pos = arrangeGraph(nodes, edges)
    // Tolérance : égalité de rang, pas d'égalité flottante stricte.
    expect(Math.abs(pos.B.y - pos.C.y)).toBeLessThan(0.001)
    expect(pos.B.x).not.toBe(pos.C.x)
  })

  it('ne partage aucune position (diamond + chaîne + composantes déconnectées)', () => {
    const diamond = [node('A'), node('B'), node('C'), node('D')]
    const dEdges: LayoutEdge[] = [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' },
      { source: 'B', target: 'D' },
      { source: 'C', target: 'D' },
    ]
    const dPos = arrangeGraph(diamond, dEdges)
    const dKeys = Object.values(dPos).map(p => `${p.x},${p.y}`)
    expect(new Set(dKeys).size).toBe(dKeys.length)

    const chain = [node('A'), node('B'), node('C')]
    const cEdges: LayoutEdge[] = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
    ]
    const cPos = arrangeGraph(chain, cEdges)
    const cKeys = Object.values(cPos).map(p => `${p.x},${p.y}`)
    expect(new Set(cKeys).size).toBe(cKeys.length)

    // Deux chaînes indépendantes (A→B et C→D) : 4 positions distinctes,
    // aucune collision malgré l'absence de lien entre les composantes.
    const disc = [node('A'), node('B'), node('C'), node('D')]
    const discEdges: LayoutEdge[] = [
      { source: 'A', target: 'B' },
      { source: 'C', target: 'D' },
    ]
    const discPos = arrangeGraph(disc, discEdges)
    const discKeys = Object.values(discPos).map(p => `${p.x},${p.y}`)
    expect(new Set(discKeys).size).toBe(discKeys.length)
  })

  it('est déterministe : même graphe → même layout', () => {
    const nodes = [node('A'), node('B'), node('C', 260, 180)]
    const edges: LayoutEdge[] = [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' },
    ]
    expect(arrangeGraph(nodes, edges)).toEqual(arrangeGraph(nodes, edges))
  })

  it('convertit les centres dagre en coin supérieur gauche (alignement des centres)', () => {
    // Largeurs asymétriques : les centres restent alignés sur la même abscisse.
    const nodes = [node('A', 200), node('B', 260), node('C', 200)]
    const edges: LayoutEdge[] = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
    ]
    const pos = arrangeGraph(nodes, edges)
    const centerX = (p: { x: number }, w: number) => p.x + w / 2
    expect(centerX(pos.A, 200)).toBeCloseTo(centerX(pos.B, 260), 6)
    expect(centerX(pos.B, 260)).toBeCloseTo(centerX(pos.C, 200), 6)
  })

  it('ignore les edges aux extrémités absentes ou self-loop (pas de crash)', () => {
    const nodes = [node('A'), node('B')]
    const edges: LayoutEdge[] = [
      { source: 'A', target: 'ghost' },
      { source: 'ghost', target: 'B' },
      { source: 'A', target: 'A' },
    ]
    const pos = arrangeGraph(nodes, edges)
    expect(pos.A).toBeDefined()
    expect(pos.B).toBeDefined()
    expect(Math.abs(pos.B.y - pos.A.y)).toBeLessThan(0.001) // même rang
  })

  it('retourne une position par nœud (graphe sans edges)', () => {
    const pos = arrangeGraph([node('A'), node('B')])
    expect(Object.keys(pos).sort()).toEqual(['A', 'B'])
    expect(Math.abs(pos.B.y - pos.A.y)).toBeLessThan(0.001)
  })
})
