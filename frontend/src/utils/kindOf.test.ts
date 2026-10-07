import { describe, it, expect } from 'vitest'
import { kindOf } from './samples'

describe('kindOf', () => {
  it('classe par extension déclarée', () => {
    expect(kindOf('.csv')).toBe('csv')
    expect(kindOf('.csv|.txt')).toBe('csv')
    expect(kindOf('.png|.jpg')).toBe('image')
    expect(kindOf('.pt|.pkl')).toBe('model')
  })

  it('classe par mime sniffé', () => {
    expect(kindOf('image/png')).toBe('image')
    expect(kindOf('text/csv')).toBe('csv')
    expect(kindOf('audio/wav')).toBe('audio')
  })

  it('retourne other quand inconnu', () => {
    expect(kindOf('')).toBe('other')
    expect(kindOf('application/x-msdownload')).toBe('other')
  })
})
