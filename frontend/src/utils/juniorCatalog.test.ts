import { describe, it, expect } from 'vitest'
import { JUNIOR_TYPES, JUNIOR_BASELINES, isJuniorType, juniorByNiveau } from './juniorCatalog'
import { KID_LABELS } from './kidLabels'
import { baselines } from '../content/baselines'

const fakeBlocks = (types: string[]) =>
  Object.fromEntries(types.map(t => [t, { inputs: [{ name: 'in_1', dtype: 'x' }], outputs: [{ name: 'out_1', dtype: 'x' }] }]))

describe('juniorCatalog', () => {
  it('whitelist courte : bien moins que le catalogue complet', () => {
    expect(JUNIOR_TYPES.length).toBeLessThanOrEqual(20)
    expect(JUNIOR_TYPES.length).toBeGreaterThan(0)
    expect(new Set(JUNIOR_TYPES).size).toBe(JUNIOR_TYPES.length)
  })

  it('isJuniorType filtre correctement', () => {
    expect(isJuniorType('load_csv')).toBe(true)
    expect(isJuniorType('conv2d')).toBe(false)
  })

  it('chaque type Junior a un kidLabel ASCII', () => {
    for (const t of JUNIOR_TYPES) {
      const e = KID_LABELS[t]
      expect(e, `kidLabel manquant pour ${t}`).toBeTruthy()
      expect(/[^\x00-\x7F]/.test(e.label + e.astuce)).toBe(false)
    }
  })

  it('juniorByNiveau groupe sans perte ni doublon', () => {
    const groups = juniorByNiveau(fakeBlocks(JUNIOR_TYPES) as never)
    const all = [1, 2, 3, 4].flatMap(n => groups[n as 1 | 2 | 3 | 4])
    expect([...all].sort()).toEqual([...JUNIOR_TYPES].sort())
  })

  it('baselines Junior existent et sont chargees', () => {
    expect(JUNIOR_BASELINES.length).toBeGreaterThan(0)
    for (const slug of JUNIOR_BASELINES) {
      expect(baselines.some(b => b.slug === slug || b.id === slug), `baseline ${slug} absente`).toBe(true)
    }
  })
})