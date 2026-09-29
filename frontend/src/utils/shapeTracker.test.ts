import { describe, expect, it } from 'vitest'
import {
  parseShapeString,
  formatShape,
  trackShapes,
  type ChildLayerInfo,
} from './shapeTracker'

describe('shapeTracker', () => {
  describe('parseShapeString & formatShape', () => {
    it('parses tuple or bracket strings cleanly', () => {
      expect(parseShapeString('(3, 32, 32)')).toEqual([3, 32, 32])
      expect(parseShapeString('[1, 28, 28]')).toEqual([1, 28, 28])
      expect(parseShapeString('3, 224, 224')).toEqual([3, 224, 224])
      expect(parseShapeString('invalid')).toBeNull()
      expect(parseShapeString('')).toBeNull()
    })

    it('formats tensor shapes nicely', () => {
      expect(formatShape([3, 32, 32])).toBe('3×32×32')
      expect(formatShape([7200])).toBe('7200')
      expect(formatShape(null)).toBe('?')
    })
  })

  describe('trackShapes', () => {
    it('accurately computes CNN CIFAR-10 shape transformations (A1 scenario)', () => {
      const initial = [3, 32, 32]
      const layers: ChildLayerInfo[] = [
        { id: '1', type: 'conv2d_layer', params: { in_channels: 3, out_channels: 32, kernel_size: 3 } },
        { id: '2', type: 'relu_layer', params: {} },
        { id: '3', type: 'maxpool2d_layer', params: { kernel_size: 2 } },
        { id: '4', type: 'flatten_layer', params: {} },
        { id: '5', type: 'linear_layer', params: { in_features: 7200, out_features: 10 } },
      ]

      const results = trackShapes(initial, layers)

      expect(results).toHaveLength(5)
      // 1: Conv2d (3, 32, 32) -> (32, 30, 30)
      expect(results[0].outShape).toEqual([32, 30, 30])
      expect(results[0].warning).toBeUndefined()

      // 2: ReLU preserves shape
      expect(results[1].outShape).toEqual([32, 30, 30])

      // 3: MaxPool2d(2) -> (32, 15, 15)
      expect(results[2].outShape).toEqual([32, 15, 15])

      // 4: Flatten 32 * 15 * 15 = 7200
      expect(results[3].outShape).toEqual([7200])

      // 5: Linear(7200 -> 10)
      expect(results[4].outShape).toEqual([10])
      expect(results[4].warning).toBeUndefined()
    })

    it('detects shape mismatches and surfaces warnings', () => {
      const initial = [3, 32, 32]
      const layers: ChildLayerInfo[] = [
        { id: '1', type: 'conv2d_layer', params: { in_channels: 1, out_channels: 16 } }, // in_channels mismatch (expected 1, got 3)
        { id: '2', type: 'flatten_layer', params: {} },
        { id: '3', type: 'linear_layer', params: { in_features: 500, out_features: 10 } }, // in_features mismatch
      ]

      const results = trackShapes(initial, layers)
      expect(results[0].warning).toContain('Canaux attendus: 1, actuel: 3')
      expect(results[2].warning).toContain('Dimension attendue: 500, actuel:')
    })

    it('handles empty input shape gracefully', () => {
      const layers: ChildLayerInfo[] = [
        { id: '1', type: 'conv2d_layer', params: {} },
      ]
      const results = trackShapes(null, layers)
      expect(results[0].outShape).toBeNull()
    })
  })
})
