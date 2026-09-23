import { describe, it, expect } from 'vitest'
import { niveauDe, NIVEAUX, NIVEAU_LABELS, NIVEAU_CONSIGNES } from './niveaux'

const ports = (nIn: number, nOut: number) => ({
  inputs: Array.from({ length: nIn }, (_, i) => ({ name: `in_${i + 1}`, dtype: 'x' })),
  outputs: Array.from({ length: nOut }, (_, i) => ({ name: `out_${i + 1}`, dtype: 'x' })),
})

describe('niveauDe', () => {
  it('classe les sources sans entree en niveau 1', () => {
    expect(niveauDe(ports(0, 1))).toBe(1)
  })

  it('classe les transfos 1 -> 1 en niveau 2', () => {
    expect(niveauDe(ports(1, 1))).toBe(2)
  })

  it('classe les jonctions 2+ liaisons en niveau 3', () => {
    expect(niveauDe(ports(1, 2))).toBe(3)
    expect(niveauDe(ports(2, 1))).toBe(3)
    expect(niveauDe(ports(2, 2))).toBe(3)
  })

  it('classe les chefs d orchestre 3+ entrees en niveau 4', () => {
    expect(niveauDe(ports(4, 1))).toBe(4)
    expect(niveauDe(ports(4, 2))).toBe(4)
    expect(niveauDe(ports(3, 1))).toBe(4)
  })

  it('expose 4 niveaux avec label et consigne ASCII', () => {
    expect(NIVEAUX).toEqual([1, 2, 3, 4])
    for (const n of NIVEAUX) {
      expect(NIVEAU_LABELS[n]).toBeTruthy()
      expect(NIVEAU_CONSIGNES[n]).toBeTruthy()
      expect(/[^\x00-\x7F]/.test(NIVEAU_LABELS[n] + NIVEAU_CONSIGNES[n])).toBe(false)
    }
  })
})