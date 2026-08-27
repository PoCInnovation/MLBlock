/** Connection — deep module (canConnect + isAmbiguous + resolve + converterFor).
 * Owns portResolution + typeCheck behind one seam. Two adapters justify the seam:
 * real catalog families (prod) vs deterministic fake families (tests, no ReactFlow).
 */
import { isAmbiguous as _isAmbiguous, resolveConnection as _resolve } from './portResolution'
import { classifyEdge, converterFor as _converterFor, buildConversionGraph } from './typeCheck'
import type { InternalCatalog } from '../types/catalog'

export type CanConnectResult = { allowed: boolean; edge?: { source: string; target: string; sourceHandle: string; targetHandle: string }; converter?: string; reason?: string }

export function canConnect(
  source: { id: string; handle?: string; dtype?: string },
  target: { id: string; handle?: string; dtype?: string },
  catalog?: InternalCatalog,
): CanConnectResult {
  if (!source.handle || !target.handle) return { allowed: false, reason: 'missing handle' }
  if (catalog) {
    const graph = buildConversionGraph(catalog.blocks)
    const verdict = classifyEdge(source.dtype ?? 'Any', target.dtype ?? 'Any', graph)
    if (verdict === 'incompatible') return { allowed: false, reason: 'incompatible' }
    if (verdict === 'convertible') {
      const conv = _converterFor(source.dtype ?? '', target.dtype ?? '', catalog.blocks)
      return { allowed: true, edge: { source: source.id, target: target.id, sourceHandle: source.handle, targetHandle: target.handle }, converter: conv ?? undefined }
    }
  }
  return { allowed: true, edge: { source: source.id, target: target.id, sourceHandle: source.handle!, targetHandle: target.handle! } }
}

export { _isAmbiguous as isAmbiguous, _resolve as resolveConnection, _converterFor as converterFor }
