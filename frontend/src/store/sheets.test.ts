import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Node, Edge } from '@xyflow/react'

vi.mock('../api/client', () => ({
  createPipeline: vi.fn(),
  updatePipeline: vi.fn(),
}))

import useAppStore from './useAppStore'

const initialState = useAppStore.getState()

beforeEach(() => {
  useAppStore.setState(initialState)
})

describe('sheets config/compat', () => {
  it('ouvre la sheet config sur un superblock cible', () => {
    useAppStore.getState().setConfigTarget('tabular_data_pipeline')
    useAppStore.getState().setActiveSheet('config')
    expect(useAppStore.getState().configTarget).toBe('tabular_data_pipeline')
    expect(useAppStore.getState().activeSheet).toBe('config')
  })

  it('ouvre la sheet compat sur un port de sortie', () => {
    useAppStore.getState().setCompatSource({ nodeId: 'n1', port: 'out_1' })
    useAppStore.getState().setActiveSheet('compat')
    expect(useAppStore.getState().compatSource).toEqual({ nodeId: 'n1', port: 'out_1' })
    expect(useAppStore.getState().activeSheet).toBe('compat')
  })
})

describe('addFlowEdges append-only', () => {
  const node = (id: string): Node => ({ id, position: { x: 0, y: 0 }, data: { type: 't' } }) as Node
  const edge = (id: string): Edge => ({ id, source: 'a', target: 'b', sourceHandle: 'out_1', targetHandle: 'in_1' }) as Edge

  it('ajoute l’arête au store courant, pas à un instantané périmé', () => {
    useAppStore.setState({ flowNodes: [node('a'), node('b')], flowEdges: [] })
    const stale = useAppStore.getState().flowEdges
    useAppStore.getState().addFlowNode(node('c'))
    // L Lecteur périmé ne voit pas 'c' : c'est exactement le bug du canvas.
    expect(stale).not.toContainEqual(expect.objectContaining({ id: 'c' }))
    useAppStore.getState().addFlowEdges([edge('e1')])
    const now = useAppStore.getState().flowEdges
    expect(now.map(e => e.id)).toContain('e1')
    expect(now.length).toBe(1)
  })
})
