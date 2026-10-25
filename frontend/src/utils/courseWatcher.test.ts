import { describe, it, expect } from 'vitest'
import { evaluateCourseProgress } from './courseWatcher'
import type { Node, Edge } from '@xyflow/react'

describe('evaluateCourseProgress', () => {
  const expected = {
    nodes: [
      { id: 'n1', type: 'load_csv' },
      { id: 'n2', type: 'decision_tree' },
      { id: 'n3', type: 'evaluate' },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
    ],
    hints: {
      load_csv: 'Glisse Load CSV depuis Données.',
      decision_tree: 'Ajoute Decision Tree.',
      evaluate: 'Termine avec Evaluate.',
    },
  }

  it('detects missing blocks and maps hints', () => {
    const nodes: Node[] = [
      { id: 'c1', type: 'block', position: { x: 0, y: 0 }, data: { type: 'load_csv' } },
    ]
    const edges: Edge[] = []
    const result = evaluateCourseProgress(nodes, edges, expected)
    expect(result.missingTypes).toEqual(['decision_tree', 'evaluate'])
    expect(result.activeHints).toContain('Ajoute Decision Tree.')
    expect(result.isComplete).toBe(false)
    expect(result.progressPercent).toBe(25)
  })

  it('detects complete and valid pipeline', () => {
    const nodes: Node[] = [
      { id: 'c1', type: 'block', position: { x: 0, y: 0 }, data: { type: 'load_csv' } },
      { id: 'c2', type: 'block', position: { x: 0, y: 0 }, data: { type: 'decision_tree' } },
      { id: 'c3', type: 'block', position: { x: 0, y: 0 }, data: { type: 'evaluate' } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'c1', target: 'c2' },
      { id: 'e2', source: 'c2', target: 'c3' },
    ]
    const result = evaluateCourseProgress(nodes, edges, expected)
    expect(result.missingTypes).toEqual([])
    expect(result.isComplete).toBe(true)
    expect(result.progressPercent).toBe(100)
  })
})
