import { describe, it, expect } from 'vitest'
import { describeParam, validateSeg } from './paramHints'

describe('describeParam', () => {
  it('décrit un entier borné avec sa plage et son pas', () => {
    const d = describeParam({ t: 'num', k: 'epochs', def: '10', min: 1, max: 100, step: 1 })
    expect(d.hint).toBe('Entier, entre 1 et 100')
  })

  it('signale les bornes quand une seule existe', () => {
    expect(describeParam({ t: 'num', k: 'n', def: '1', min: 10 }).hint).toBe('Au moins 10')
    expect(describeParam({ t: 'num', k: 'n', def: '1', max: 5 }).hint).toBe('Au plus 5')
  })

  it('ignore pas=1 et min=0, valeurs par défaut', () => {
    expect(describeParam({ t: 'num', k: 'n', def: '1', min: 0, max: 10, step: 1 }).hint)
      .toBe('Au plus 10')
  })

  it('donne le format attendu d’une liste', () => {
    expect(describeParam({ t: 'list', k: 'cols', def: '', format: '[a, b]' }).hint).toBe('[a, b]')
  })

  it('reprend la description du backend', () => {
    expect(describeParam({ t: 'num', k: 'n', def: '1', desc: 'Nombre de tours.' }).description)
      .toBe('Nombre de tours.')
  })

  it('remonte la valeur hors bornes comme invalide', () => {
    const d = describeParam({ t: 'num', k: 'epochs', def: '10', min: 1, max: 100 }, '500')
    expect(d.invalid).toBe('Doit être ≤ 100')
  })

  it('laisse un champ sans métadonnées sans avertissement', () => {
    expect(describeParam({ t: 'num', k: 'x', def: '' })).toEqual({})
  })
})

describe('validateSeg', () => {
  it('accepte une valeur dans les bornes', () => {
    expect(validateSeg({ t: 'num', k: 'e', def: '1', min: 1, max: 10 }, '5')).toBeUndefined()
  })

  it('refuse un JSON invalide pour une liste', () => {
    expect(validateSeg({ t: 'list', k: 'l', def: '' }, '{')).toBeTruthy()
  })
})