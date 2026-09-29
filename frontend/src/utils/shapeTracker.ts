export type TensorShape = number[]

export type ShapeStepResult = {
  inShape: TensorShape | null
  outShape: TensorShape | null
  warning?: string
}

export type ChildLayerInfo = {
  id: string
  type: string
  params?: Record<string, unknown>
}

/**
 * Parses a shape string like "(3, 32, 32)" or "[3, 32, 32]" or "3, 32, 32" into a number array.
 */
export function parseShapeString(str: string): TensorShape | null {
  if (!str) return null
  const cleaned = str.replace(/[()[\]]/g, '').trim()
  if (!cleaned) return null
  const parts = cleaned.split(',').map(s => parseInt(s.trim(), 10))
  if (parts.some(n => Number.isNaN(n) || n <= 0)) return null
  return parts
}

/**
 * Formats a tensor shape for clean display in badges:
 * e.g. [3, 32, 32] -> "3×32×32", [7200] -> "7200".
 */
export function formatShape(shape: TensorShape | null): string {
  if (!shape || shape.length === 0) return '?'
  if (shape.length === 1) return `${shape[0]}`
  return shape.join('×')
}

/**
 * Computes shape transformations across an ordered stack of neural network layers.
 */
export function trackShapes(
  initialShape: TensorShape | null,
  layers: ChildLayerInfo[],
): ShapeStepResult[] {
  let current: TensorShape | null = initialShape
  const results: ShapeStepResult[] = []

  for (const layer of layers) {
    const p = layer.params || {}
    const t = layer.type.replace(/_layer$/, '')

    if (!current) {
      results.push({ inShape: null, outShape: null })
      continue
    }

    const inShape = [...current]
    let outShape: TensorShape | null = null
    let warning: string | undefined

    if (t === 'conv2d' || t === 'conv2d_layer') {
      const outChannels = Number(p.out_channels ?? 32)
      const inChannels = p.in_channels !== undefined ? Number(p.in_channels) : undefined
      const k = Number(p.kernel_size ?? 3)
      const s = Number(p.stride ?? 1)
      const pad = Number(p.padding ?? 0)

      if (inShape.length === 3) {
        const [c, h, w] = inShape
        if (inChannels !== undefined && inChannels !== c) {
          warning = `Canaux attendus: ${inChannels}, actuel: ${c}`
        }
        const hOut = Math.floor((h - k + 2 * pad) / s) + 1
        const wOut = Math.floor((w - k + 2 * pad) / s) + 1
        if (hOut > 0 && wOut > 0) {
          outShape = [outChannels, hOut, wOut]
        } else {
          warning = `Dimensions négatives ou nulles: ${hOut}×${wOut}`
        }
      } else {
        warning = `Conv2d requiert un tenseur 3D [C, H, W], reçu: [${inShape.join(', ')}]`
      }
    } else if (t === 'maxpool2d' || t === 'avgpool2d') {
      const k = Number(p.kernel_size ?? 2)
      const s = Number(p.stride ?? k)
      const pad = Number(p.padding ?? 0)

      if (inShape.length === 3) {
        const [c, h, w] = inShape
        const hOut = Math.floor((h - k + 2 * pad) / s) + 1
        const wOut = Math.floor((w - k + 2 * pad) / s) + 1
        if (hOut > 0 && wOut > 0) {
          outShape = [c, hOut, wOut]
        } else {
          warning = `Pooling trop grand pour l'image: ${hOut}×${wOut}`
        }
      } else {
        warning = `Pool2d requiert un tenseur 3D [C, H, W]`
      }
    } else if (t === 'flatten') {
      const total = inShape.reduce((acc, dim) => acc * dim, 1)
      outShape = [total]
    } else if (t === 'linear') {
      const outFeatures = Number(p.out_features ?? 10)
      const inFeatures = p.in_features !== undefined ? Number(p.in_features) : undefined
      const currentDim = inShape[inShape.length - 1]

      if (inFeatures !== undefined && currentDim !== undefined && inFeatures !== currentDim) {
        warning = `Dimension attendue: ${inFeatures}, actuel: ${currentDim}`
      }
      outShape = [outFeatures]
    } else if (
      t === 'relu' ||
      t === 'leaky_relu' ||
      t === 'sigmoid' ||
      t === 'tanh' ||
      t === 'elu' ||
      t === 'gelu' ||
      t === 'silu' ||
      t === 'dropout' ||
      t === 'batchnorm2d' ||
      t === 'batchnorm1d' ||
      t === 'layernorm' ||
      t === 'identity'
    ) {
      // Shape-preserving activation or normalization
      outShape = [...inShape]
    } else {
      // Default: preserve shape if unknown
      outShape = [...inShape]
    }

    results.push({ inShape, outShape, warning })
    current = outShape
  }

  return results
}
