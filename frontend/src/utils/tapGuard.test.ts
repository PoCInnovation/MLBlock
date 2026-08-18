import { describe, it, expect } from 'vitest'
import { shouldIgnoreTap, TAP_MAX_DRAG_PX } from './tapGuard'

describe('shouldIgnoreTap', () => {
  it('permet un tap immobile ou dans la limite (≤ 8px)', () => {
    expect(shouldIgnoreTap({ x: 100, y: 100 }, 100, 100)).toBe(false)
    expect(shouldIgnoreTap({ x: 100, y: 100 }, 106, 100)).toBe(false)
    expect(shouldIgnoreTap({ x: 100, y: 100 }, 100, 108)).toBe(false)
    expect(shouldIgnoreTap({ x: 100, y: 100 }, 100 + TAP_MAX_DRAG_PX, 100)).toBe(false)
  })

  it('ignore un déplacement > 8px (c’était un drag)', () => {
    expect(shouldIgnoreTap({ x: 100, y: 100 }, 109, 100)).toBe(true)
    expect(shouldIgnoreTap({ x: 100, y: 100 }, 100, 109)).toBe(true)
    expect(shouldIgnoreTap({ x: 100, y: 100 }, 150, 140)).toBe(true)
  })

  it('ignore un click sans pointerdown préalable (press null)', () => {
    expect(shouldIgnoreTap(null, 100, 100)).toBe(true)
  })
})
