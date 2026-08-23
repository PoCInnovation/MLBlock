import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Node, Edge } from '@xyflow/react'

// The store imports ../api/client, which pulls in axios + Supabase — mock it
// so the suite runs in a plain Node env.
vi.mock('../api/client', () => ({
  createPipeline: vi.fn(),
  updatePipeline: vi.fn(),
}))

import useAppStore, { fingerprintOf } from './useAppStore'

const freeNode = (id: string, x: number, y: number, extra: Record<string, unknown> = {}): Node =>
  ({
    id,
    position: { x, y },
    data: { type: 'csv', fields: { a: '1' }, segs: [] },
    ...extra,
  }) as Node

const edge = (id: string, source: string, target: string, extra: Record<string, unknown> = {}): Edge =>
  ({
    id,
    source,
    target,
    sourceHandle: 'out_1',
    targetHandle: 'in_1',
    ...extra,
  }) as Edge

const fp = (nodes: Node[], edges: Edge[] = [], projectName = 'p'): string =>
  fingerprintOf({ flowNodes: nodes, flowEdges: edges, projectName })

const initialState = useAppStore.getState()

beforeEach(() => {
  useAppStore.setState(initialState)
})

describe('fingerprintOf', () => {
  it('treats x/y as semantic (they participate)', () => {
    expect(fp([freeNode('a', 10, 20)])).not.toBe(fp([freeNode('a', 30, 20)]))
    expect(fp([freeNode('a', 10, 20)])).not.toBe(fp([freeNode('a', 10, 40)]))
    expect(fp([freeNode('a', 10, 20)])).toBe(fp([freeNode('a', 10, 20)]))
  })

  it('ignores volatile ReactFlow metadata on nodes and edges', () => {
    const base = freeNode('a', 10, 20)
    const decorated = freeNode('a', 10, 20, {
      selected: true,
      dragging: false,
      measured: { width: 244, height: 300 },
      width: 100,
      height: 50,
      style: { stroke: 'red' },
    })
    expect(fp([base])).toBe(fp([decorated]))

    const e1 = edge('e1', 'a', 'b')
    const e2 = edge('e1', 'a', 'b', { animated: true, style: { stroke: 'red' }, label: 'x' })
    expect(fp([], [e1])).toBe(fp([], [e2]))
  })

  it('ignores cosmetic data (label, category, colors) but detects field changes', () => {
    const a = freeNode('a', 10, 20)
    const relabeled = freeNode('a', 10, 20, {
      data: { type: 'csv', fields: { a: '1' }, segs: [], label: 'Autre', category: 'data', categoryColor: '#000' },
    })
    expect(fp([a])).toBe(fp([relabeled]))

    const changedField = freeNode('a', 10, 20, {
      data: { type: 'csv', fields: { a: '2' }, segs: [] },
    })
    expect(fp([a])).not.toBe(fp([changedField]))

    const changedSegs = freeNode('a', 10, 20, {
      data: { type: 'csv', fields: { a: '1' }, segs: [{ t: 'text', v: 'x' }] },
    })
    expect(fp([a])).not.toBe(fp([changedSegs]))
  })

  it('detects edge topology and port changes', () => {
    expect(fp([], [edge('e1', 'a', 'b')])).not.toBe(fp([], [edge('e1', 'a', 'c')]))
    expect(fp([], [edge('e1', 'a', 'b', { sourceHandle: 'out_2' })])).not.toBe(fp([], [edge('e1', 'a', 'b')]))
    expect(fp([], [edge('e1', 'a', 'b', { targetHandle: 'in_2' })])).not.toBe(fp([], [edge('e1', 'a', 'b')]))
  })

  it('includes projectName', () => {
    expect(fp([], [], 'p')).not.toBe(fp([], [], 'q'))
  })
})

describe('isDirty transitions', () => {
  it('starts clean and becomes dirty on node/edge edits, clean again after save', () => {
    expect(useAppStore.getState().isDirty()).toBe(false)

    useAppStore.getState().addFlowNode(freeNode('n1', 100, 80))
    expect(useAppStore.getState().isDirty()).toBe(true)

    // simulate a save: fingerprint of the current state is stored
    useAppStore.setState({ savedFingerprint: fingerprintOf(useAppStore.getState()) })
    expect(useAppStore.getState().isDirty()).toBe(false)

    useAppStore.getState().addFlowEdges([edge('e1', 'n1', 'n2')])
    expect(useAppStore.getState().isDirty()).toBe(true)
  })

  it('reports clean when savedFingerprint is null (no saved baseline)', () => {
    useAppStore.setState({ savedFingerprint: null })
    useAppStore.getState().addFlowNode(freeNode('n1', 100, 80))
    expect(useAppStore.getState().isDirty()).toBe(false)
  })
})

describe('undo / redo', () => {
  const mk = (id: string): Node => ({ id, position: { x: 0, y: 0 }, data: {} })

  it('round-trips a commit point through undo and redo', () => {
    useAppStore.getState().setFlowNodes([mk('a')])
    useAppStore.getState().commitUndoPoint()

    useAppStore.getState().setFlowNodes([mk('a'), mk('b')])
    useAppStore.getState().setProjectName('renommé')

    expect(useAppStore.getState().canUndo()).toBe(true)
    useAppStore.getState().undo()
    expect(useAppStore.getState().flowNodes.map(n => n.id)).toEqual(['a'])
    expect(useAppStore.getState().projectName).toBe('mon-premier-modèle')
    expect(useAppStore.getState().canRedo()).toBe(true)

    useAppStore.getState().redo()
    expect(useAppStore.getState().flowNodes.map(n => n.id)).toEqual(['a', 'b'])
    expect(useAppStore.getState().projectName).toBe('renommé')
    expect(useAppStore.getState().canRedo()).toBe(false)
  })

  it('does nothing when there is nothing to undo or redo', () => {
    const s = useAppStore.getState()
    expect(s.canUndo()).toBe(false)
    expect(s.canRedo()).toBe(false)
    s.undo()
    s.redo()
    expect(useAppStore.getState().flowNodes).toEqual([])
  })

  it('caps the undo stack at 50 and evicts the oldest commits', () => {
    for (let i = 1; i <= 55; i++) {
      useAppStore.setState({ flowNodes: [mk(`n${i}`)] })
      useAppStore.getState().commitUndoPoint()
    }
    expect(useAppStore.getState().undoStack.length).toBe(50)

    // commits 1..5 were evicted — the oldest surviving snapshot is commit #6
    for (let i = 0; i < 50; i++) useAppStore.getState().undo()
    expect(useAppStore.getState().flowNodes[0].id).toBe('n6')
    expect(useAppStore.getState().canUndo()).toBe(false)
  })

  it('truncates the redo stack when a new commit happens after an undo', () => {
    useAppStore.getState().setFlowNodes([mk('a')])
    useAppStore.getState().commitUndoPoint()
    useAppStore.getState().setFlowNodes([mk('a'), mk('b')])
    useAppStore.getState().undo()
    expect(useAppStore.getState().canRedo()).toBe(true)

    useAppStore.getState().commitUndoPoint()
    expect(useAppStore.getState().canRedo()).toBe(false)
    useAppStore.getState().redo()
    expect(useAppStore.getState().flowNodes.map(n => n.id)).toEqual(['a'])
  })
})
