import { describe, it, expect } from 'vitest'
import type { Node, Edge } from 'reactflow'
import {
  COL_W,
  ROW_H,
  HEADER_H,
  TOP_PAD,
  BLOCK_W,
  FALLBACK_H,
  FOOTER_H,
  COL_PAD,
  colOf,
  rowOf,
  hasGridPos,
  posFor,
  snapPosition,
  isEdgeValid,
  pruneInvalidEdges,
  maxRowInCol,
  levelsFor,
  migrateToGrid,
  colHeight,
} from './gridLayout'

type GridPosLike = { x?: number; y?: number; col?: number; row?: number }

const node = (id: string, position: GridPosLike, extra: Partial<Node> = {}): Node => ({
  id,
  position: position as Node['position'], // accepts grid positions {col,row} alongside plain x/y
  data: {},
  ...extra,
})

describe('colOf / rowOf', () => {
  it('returns the stored col/row when present, ignoring x/y', () => {
    const n = node('a', { col: 3, row: 4, x: 48, y: 74 })
    expect(colOf(n)).toBe(3)
    expect(rowOf(n)).toBe(4)
  })

  it('derives the col from x when col is absent', () => {
    expect(colOf(node('a', { x: 48, y: 74 }))).toBe(0) // centre of col 0
    expect(colOf(node('a', { x: 48 + COL_W, y: 74 }))).toBe(1)
    expect(colOf(node('a', { x: 48 + 2 * COL_W, y: 74 }))).toBe(2)
    // a position left of the midpoint between col 0 and col 1 stays in col 0
    expect(colOf(node('a', { x: 48 + 150, y: 74 }))).toBe(0)
    // far left clamps to 0
    expect(colOf(node('a', { x: -500, y: 74 }))).toBe(0)
  })

  it('derives the row from y when row is absent', () => {
    const firstRowY = HEADER_H + TOP_PAD
    expect(rowOf(node('a', { x: 48, y: firstRowY }))).toBe(0)
    expect(rowOf(node('a', { x: 48, y: firstRowY + ROW_H }))).toBe(1)
    expect(rowOf(node('a', { x: 48, y: firstRowY + 2 * ROW_H }))).toBe(2)
    expect(rowOf(node('a', { x: 48, y: -300 }))).toBe(0)
  })
})

describe('hasGridPos', () => {
  it('is true only when both col and row are stored', () => {
    expect(hasGridPos(node('a', { col: 0, row: 0 }))).toBe(true)
    expect(hasGridPos(node('a', { col: 0, row: 0, x: 48, y: 74 }))).toBe(true)
    expect(hasGridPos(node('a', { x: 48, y: 74 }))).toBe(false)
    expect(hasGridPos(node('a', { col: 0, x: 48, y: 74 }))).toBe(false)
  })
})

describe('posFor / snapPosition', () => {
  it('posFor centers a block inside its column under the header', () => {
    const p = posFor(1, 2)
    expect(p).toEqual({
      x: 1 * COL_W + (COL_W - BLOCK_W) / 2,
      y: HEADER_H + TOP_PAD + 2 * ROW_H,
      col: 1,
      row: 2,
    })
  })

  it('round-trips through colOf/rowOf', () => {
    const p = posFor(2, 3)
    const n = node('a', p)
    expect(colOf(n)).toBe(2)
    expect(rowOf(n)).toBe(3)
  })

  it('snaps a floating position to the nearest cell', () => {
    expect(snapPosition({ x: 48 + COL_W + 0.4, y: HEADER_H + TOP_PAD + ROW_H + 0.7 })).toEqual(posFor(1, 1))
    expect(snapPosition(posFor(0, 0))).toEqual(posFor(0, 0))
  })

  it('snaps positions near the origin to cell (0,0)', () => {
    const snapped = snapPosition({ x: 0, y: 0 })
    expect(snapped.x).toBe(48)
    expect(snapped.y).toBe(74)
    expect(snapped.col === 0).toBe(true) // Math.round can yield -0; -0 === 0
    expect(snapped.row === 0).toBe(true)
  })
})

describe('isEdgeValid (left→right rule)', () => {
  const a = node('a', { col: 0, row: 0 })
  const b = node('b', { col: 1, row: 0 })
  const c = node('c', { col: 2, row: 0 })

  it('accepts links from a left column to a right column', () => {
    expect(isEdgeValid({ id: 'e1', source: 'a', target: 'b' }, [a, b])).toBe(true)
    expect(isEdgeValid({ id: 'e2', source: 'a', target: 'c' }, [a, b, c])).toBe(true)
  })

  it('rejects links that go left or stay in the same column', () => {
    const d = node('d', { col: 0, row: 1 })
    expect(isEdgeValid({ id: 'e1', source: 'b', target: 'a' }, [a, b])).toBe(false)
    expect(isEdgeValid({ id: 'e2', source: 'a', target: 'a' }, [a, b])).toBe(false)
    expect(isEdgeValid({ id: 'e3', source: 'a', target: 'd' }, [a, d, b, c])).toBe(false) // same column
  })

  it('treats edges referencing missing nodes as valid (no info to judge)', () => {
    expect(isEdgeValid({ id: 'e1', source: 'ghost', target: 'b' }, [a, b])).toBe(true)
    expect(isEdgeValid({ id: 'e2', source: 'a', target: 'ghost' }, [a, b])).toBe(true)
  })
})

describe('pruneInvalidEdges', () => {
  it('keeps valid edges and returns the removed count', () => {
    const a = node('a', { col: 0, row: 0 })
    const b = node('b', { col: 1, row: 0 })
    const good: Edge = { id: 'e1', source: 'a', target: 'b' }
    const bad: Edge = { id: 'e2', source: 'b', target: 'a' }
    const [edges, removed] = pruneInvalidEdges([a, b], [good, bad])
    expect(edges).toEqual([good])
    expect(removed).toBe(1)
  })
})

describe('maxRowInCol', () => {
  it('returns the last occupied row of a column, or -1 when empty', () => {
    const nodes = [
      node('a', { col: 0, row: 0 }),
      node('b', { col: 0, row: 2 }),
      node('c', { col: 1, row: 5 }),
    ]
    expect(maxRowInCol(nodes, 0)).toBe(2)
    expect(maxRowInCol(nodes, 1)).toBe(5)
    expect(maxRowInCol(nodes, 3)).toBe(-1)
  })
})

describe('levelsFor (longest-path topological levels)', () => {
  const n = (id: string): Node => node(id, { x: 0, y: 0 })

  it('assigns level 0 to source nodes and 1+max(parents) to descendants', () => {
    const nodes = [n('a'), n('b'), n('c')]
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ]
    expect(levelsFor(nodes, edges)).toEqual(new Map([['a', 0], ['b', 1], ['c', 2]]))
  })

  it('uses the longest path when a node has several parents', () => {
    const nodes = [n('a'), n('b'), n('c'), n('d')]
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'a', target: 'c' },
      { id: 'e3', source: 'b', target: 'd' },
      { id: 'e4', source: 'c', target: 'd' },
    ]
    const levels = levelsFor(nodes, edges)
    expect(levels.get('a')).toBe(0)
    expect(levels.get('b')).toBe(1)
    expect(levels.get('c')).toBe(1)
    expect(levels.get('d')).toBe(2) // 1 + max(1, 1)
  })

  it('ignores edges whose source is not in the node list', () => {
    const nodes = [n('a')]
    const edges: Edge[] = [{ id: 'e1', source: 'ghost', target: 'a' }]
    expect(levelsFor(nodes, edges).get('a')).toBe(0)
  })
})

describe('migrateToGrid', () => {
  it('keeps blocks that already have col/row and packs the rest by level then y', () => {
    const n1 = node('n1', { x: 0, y: 0 })
    const n2 = node('n2', { x: 0, y: 50 })
    const n3 = node('n3', { col: 0, row: 5, x: 999, y: 1000 }) // already placed, y ignored
    const edges: Edge[] = [{ id: 'e1', source: 'n1', target: 'n2' }]
    const out = migrateToGrid([n1, n2, n3], edges)
    const byId = new Map(out.map(n => [n.id, n]))

    // n1 has level 0 and y 0 → cell (0, 0); n3 is pre-placed in col 0, second row
    expect(byId.get('n1')!.position).toEqual(posFor(0, 0))
    expect(byId.get('n3')!.position).toEqual(posFor(0, 1))
    // n2 has level 1 (child of n1) → col 1, row 0
    expect(byId.get('n2')!.position).toEqual(posFor(1, 0))
  })

  it('assigns rows by vertical rank within each column group', () => {
    const a = node('a', { x: 0, y: 500 })
    const b = node('b', { x: 0, y: 0 })
    const out = migrateToGrid([a, b], [])
    const byId = new Map(out.map(n => [n.id, n]))
    expect(byId.get('b')!.position).toEqual(posFor(0, 0))
    expect(byId.get('a')!.position).toEqual(posFor(0, 1))
  })
})

describe('colHeight', () => {
  it('packs measured heights plus padding, header, and footer', () => {
    const nodes = [
      node('a', { col: 0, row: 0 }, { height: 100 }),
      node('b', { col: 0, row: 1 }, { height: 200 }),
      node('c', { col: 1, row: 0 }, { height: 100 }),
    ]
    expect(colHeight(nodes, 0)).toBe(HEADER_H + TOP_PAD + (100 + COL_PAD) + (200 + COL_PAD) + FOOTER_H)
    expect(colHeight(nodes, 1)).toBe(HEADER_H + TOP_PAD + (100 + COL_PAD) + FOOTER_H)
  })

  it('falls back to FALLBACK_H for unmeasured blocks', () => {
    const nodes = [node('a', { col: 0, row: 0 })]
    expect(colHeight(nodes, 0)).toBe(HEADER_H + TOP_PAD + (FALLBACK_H + COL_PAD) + FOOTER_H)
  })

  it('never reports less than the empty-column minimum', () => {
    expect(colHeight([], 0)).toBe(HEADER_H + TOP_PAD + FOOTER_H + COL_PAD)
    // any block, however small, grows the column past the empty minimum
    const tiny = [node('a', { col: 0, row: 0 }, { height: 1 })]
    expect(colHeight(tiny, 0)).toBe(HEADER_H + TOP_PAD + (1 + COL_PAD) + FOOTER_H)
  })
})
