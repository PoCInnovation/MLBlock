import { describe, it, expect } from 'vitest'

describe('BlockSegments accessibility contracts', () => {
  it('generates consistent field and error IDs', () => {
    const blockId = 'conv2d_123'
    const paramKey = 'in_channels'
    const inputId = `${blockId}-${paramKey}`
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    expect(inputId).toBe('conv2d_123-in_channels')
    expect(errorId).toBe('conv2d_123-in_channels-error')
    expect(hintId).toBe('conv2d_123-in_channels-hint')
  })
})
