import { describe, it, expect } from 'vitest'
import { baselines, getBaseline, PATTERN_LABELS, ETAPES } from './index'

describe('baselines', () => {
  it('exposes at least the 4 planned patterns', () => {
    expect(baselines.length).toBeGreaterThanOrEqual(4)
    const patterns = baselines.map(b => b.pattern)
    for (const p of ['cnn', 'clustering', 'classification', 'sequences']) {
      expect(patterns).toContain(p)
    }
  })

  it('every baseline has title, name, nodes and edges', () => {
    for (const b of baselines) {
      expect(b.id).toBeTruthy()
      expect(b.title).toBeTruthy()
      expect(b.name).toBeTruthy()
      expect(b.description).toBeTruthy()
      expect(b.pipelineNodes.length).toBeGreaterThan(0)
      expect(b.pipelineEdges.length).toBeGreaterThan(0)
    }
  })

  it('edge endpoints reference existing node ids', () => {
    for (const b of baselines) {
      const ids = new Set(b.pipelineNodes.map(n => n.id))
      for (const e of b.pipelineEdges) {
        expect(ids.has(e.source), `${b.id}: edge ${e.source}->${e.target} source missing`).toBe(true)
        expect(ids.has(e.target), `${b.id}: edge ${e.source}->${e.target} target missing`).toBe(true)
        expect(e.source_port).toBeTruthy()
        expect(e.target_port).toBeTruthy()
      }
    }
  })

  it('etapes only reference node types present in the baseline', () => {
    for (const b of baselines) {
      const types = new Set(b.pipelineNodes.map(n => n.type))
      for (const [etape, blockTypes] of Object.entries(b.etapes ?? {})) {
        expect(ETAPES).toContain(etape)
        for (const t of blockTypes) {
          expect(types.has(t), `${b.id}: etape ${etape} references unknown type ${t}`).toBe(true)
        }
      }
    }
  })

  it('getBaseline resolves by slug', () => {
    expect(getBaseline('clustering-kmeans')?.pattern).toBe('clustering')
    expect(getBaseline('cnn-imagerie')?.pattern).toBe('cnn')
    expect(getBaseline('nope')).toBeUndefined()
  })

  it('pattern labels cover every pattern used', () => {
    for (const b of baselines) {
      expect(PATTERN_LABELS[b.pattern]).toBeTruthy()
    }
  })
})