import { describe, it, expect } from 'vitest'
import type { BlockDef, BlockDefMap, Port } from '../types/catalog'
import { familyOf, buildConversionGraph, classifyEdge, converterFor, portDtype } from './typeCheck'

const def = (cat: string, inputs: Port[], outputs: Port[]): BlockDef => ({
  cat,
  segs: [],
  inputs,
  outputs,
  description: '',
})

const blocks: BlockDefMap = {
  to_numpy: def('transforms', [{ name: 'in', dtype: 'pd.DataFrame' }], [{ name: 'out', dtype: 'numpy.ndarray' }]),
  to_tensor: def('transforms', [{ name: 'in', dtype: 'numpy.ndarray' }], [{ name: 'out', dtype: 'torch.Tensor' }]),
  passthrough: def('transforms', [{ name: 'in', dtype: 'Any' }], [{ name: 'out', dtype: 'numpy.ndarray' }]),
  // non-transform blocks never contribute conversion edges
  csv_loader: def('data', [{ name: 'in', dtype: 'str' }], [{ name: 'out', dtype: 'pd.DataFrame' }]),
}

describe('familyOf (mirror of backend mlblock/core/types.py)', () => {
  it('maps the canonical dtype names to families', () => {
    expect(familyOf('pd.DataFrame')).toBe('df')
    expect(familyOf('Model')).toBe('model')
    expect(familyOf('dict')).toBe('dict')
    expect(familyOf('numpy.ndarray')).toBe('ndarray')
    expect(familyOf('str')).toBe('str')
  })

  it('groups numeric primitives as scalar', () => {
    for (const d of ['int', 'float', 'bool']) expect(familyOf(d)).toBe('scalar')
  })

  it('prefix-matches torch dtypes', () => {
    expect(familyOf('torch.Tensor')).toBe('tensor')
    expect(familyOf('torch.Tensor[float32]')).toBe('tensor')
    expect(familyOf('torch.utils.data.DataLoader')).toBe('dataset')
    expect(familyOf('torch.optim.Adam')).toBe('optim')
    expect(familyOf('torch.nn.Linear')).toBe('module')
  })

  it('handles generic tuple types and wildcards', () => {
    expect(familyOf('tuple[int, str]')).toBe('tuple')
    expect(familyOf('object')).toBe('any')
    expect(familyOf('Any')).toBe('any')
  })

  it('trims whitespace and falls back to the raw dtype', () => {
    expect(familyOf('  pd.DataFrame  ')).toBe('df')
    expect(familyOf('pandas.Series')).toBe('pandas.Series')
  })
})

describe('buildConversionGraph', () => {
  it('adds an edge per transform input→output family pair, skipping self/any', () => {
    const graph = buildConversionGraph(blocks)
    expect(graph.get('df')).toEqual(new Set(['ndarray']))
    expect(graph.get('ndarray')).toEqual(new Set(['tensor']))
    // passthrough: any → ndarray (src !== dst, dst !== 'any')
    expect(graph.get('any')).toEqual(new Set(['ndarray']))
    // csv_loader is cat 'data': contributes nothing
    expect(graph.has('str')).toBe(false)
  })
})

describe('classifyEdge', () => {
  const graph = buildConversionGraph(blocks)

  it('verdicts identical dtypes and wildcard targets as compatible', () => {
    expect(classifyEdge('pd.DataFrame', 'pd.DataFrame', graph)).toBe('compatible')
    expect(classifyEdge('int', 'Any', graph)).toBe('compatible')
    expect(classifyEdge('int', 'object', graph)).toBe('compatible')
  })

  it('verdicts same-family dtypes as compatible', () => {
    expect(classifyEdge('int', 'float', graph)).toBe('compatible')
    expect(classifyEdge('bool', 'int', graph)).toBe('compatible')
    expect(classifyEdge('torch.Tensor[float32]', 'torch.Tensor', graph)).toBe('compatible')
  })

  it('verdicts reachable conversions as convertible (multi-hop)', () => {
    expect(classifyEdge('pd.DataFrame', 'numpy.ndarray', graph)).toBe('convertible')
    expect(classifyEdge('numpy.ndarray', 'torch.Tensor', graph)).toBe('convertible')
    // df → ndarray → tensor: reachability follows the whole graph
    expect(classifyEdge('pd.DataFrame', 'torch.Tensor', graph)).toBe('convertible')
    // wildcard input of passthrough: any → ndarray
    expect(classifyEdge('object', 'numpy.ndarray', graph)).toBe('convertible')
  })

  it('verdicts unreachable pairs as incompatible', () => {
    expect(classifyEdge('str', 'torch.Tensor', graph)).toBe('incompatible')
    expect(classifyEdge('torch.Tensor', 'numpy.ndarray', graph)).toBe('incompatible')
  })
})

describe('converterFor', () => {
  it('returns the first transforms block that directly converts the pair', () => {
    expect(converterFor('pd.DataFrame', 'numpy.ndarray', blocks)).toBe('to_numpy')
    expect(converterFor('numpy.ndarray', 'torch.Tensor', blocks)).toBe('to_tensor')
  })

  it('matches on same-family input and wildcard inputs', () => {
    // to_tensor accepts numpy.ndarray, so ndarray-family input converts to tensor
    expect(converterFor('numpy.ndarray', 'torch.Tensor', blocks)).toBe('to_tensor')
    // passthrough accepts anything (Any) and outputs ndarray
    expect(converterFor('object', 'numpy.ndarray', blocks)).toBe('passthrough')
  })

  it('returns null when no direct converter exists', () => {
    expect(converterFor('str', 'torch.Tensor', blocks)).toBeNull()
    // only a direct converter counts — no chaining in converterFor
    expect(converterFor('pd.DataFrame', 'torch.Tensor', blocks)).toBeNull()
  })
})

describe('portDtype', () => {
  it('resolves a named port, else the first port, else null', () => {
    const ports: Port[] = [{ name: 'in', dtype: 'pd.DataFrame' }, { name: 'in2', dtype: 'int' }]
    expect(portDtype(ports, 'in2')).toBe('int')
    expect(portDtype(ports, 'absent')).toBe('pd.DataFrame')
    expect(portDtype(undefined, 'in')).toBeNull()
    expect(portDtype([], 'in')).toBeNull()
  })
})
