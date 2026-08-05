import type { BlockDefMap, Port } from '../types/catalog'

export type Verdict = 'compatible' | 'convertible' | 'incompatible'

const WILDCARDS = new Set(['object', 'Any'])

/** Mirror of backend mlblock/core/types.py family_of. */
export function familyOf(dtype: string): string {
  const d = dtype.trim()
  if (d === 'pd.DataFrame') return 'df'
  if (d === 'Model') return 'model'
  if (d === 'dict') return 'dict'
  if (d === 'numpy.ndarray') return 'ndarray'
  if (d === 'int' || d === 'float' || d === 'bool') return 'scalar'
  if (d === 'str') return 'str'
  if (d.startsWith('torch.Tensor')) return 'tensor'
  if (d.startsWith('torch.utils.data.')) return 'dataset'
  if (d.startsWith('torch.optim.')) return 'optim'
  if (d.startsWith('torch.nn.')) return 'module'
  if (d.startsWith('tuple[')) return 'tuple'
  if (WILDCARDS.has(d)) return 'any'
  return d
}

/** Only blocks in the `transforms` category contribute conversion edges. */
export function buildConversionGraph(blocks: BlockDefMap): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()
  for (const def of Object.values(blocks)) {
    if (def.cat !== 'transforms') continue
    const outFamilies = new Set(def.outputs.map(p => familyOf(p.dtype)))
    const inFamilies = new Set(def.inputs.map(p => familyOf(p.dtype)))
    for (const src of inFamilies) {
      for (const dst of outFamilies) {
        if (src !== dst && dst !== 'any') {
          if (!graph.has(src)) graph.set(src, new Set())
          graph.get(src)!.add(dst)
        }
      }
    }
  }
  return graph
}

export function classifyEdge(srcDtype: string, tgtDtype: string, graph: Map<string, Set<string>>): Verdict {
  if (WILDCARDS.has(tgtDtype) || srcDtype === tgtDtype) return 'compatible'
  if (familyOf(srcDtype) === familyOf(tgtDtype)) return 'compatible'
  if (reachable(familyOf(srcDtype), familyOf(tgtDtype), graph)) return 'convertible'
  return 'incompatible'
}

/** First transforms block that accepts srcDtype and outputs tgtDtype's family. */
export function converterFor(srcDtype: string, tgtDtype: string, blocks: BlockDefMap): string | null {
  const tgtFamily = familyOf(tgtDtype)
  for (const [type, def] of Object.entries(blocks)) {
    if (def.cat !== 'transforms') continue
    const inPort = def.inputs[0]
    const outPort = def.outputs[0]
    if (!inPort || !outPort) continue
    const feeds = WILDCARDS.has(inPort.dtype) || inPort.dtype === srcDtype || familyOf(inPort.dtype) === familyOf(srcDtype)
    if (feeds && familyOf(outPort.dtype) === tgtFamily) return type
  }
  return null
}

export function portDtype(ports: Port[] | undefined, name: string | null | undefined): string | null {
  if (!ports || ports.length === 0) return null
  const port = ports.find(p => p.name === name)
  if (port) return port.dtype
  return ports[0]?.dtype ?? null
}

function reachable(src: string, dst: string, graph: Map<string, Set<string>>): boolean {
  if (src === dst) return true
  const seen = new Set<string>([src])
  const stack = [src]
  while (stack.length > 0) {
    const cur = stack.pop()!
    for (const nxt of graph.get(cur) ?? []) {
      if (nxt === dst) return true
      if (!seen.has(nxt)) {
        seen.add(nxt)
        stack.push(nxt)
      }
    }
  }
  return false
}
