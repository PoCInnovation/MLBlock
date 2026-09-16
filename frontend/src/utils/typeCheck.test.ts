import { describe, it, expect } from 'vitest'
import type { BlockDef, BlockDefMap, Port } from '../types/catalog'
import { familyOf, buildConversionGraph, classifyEdge, converterFor, portDtype, typeSystem, TypeSystem } from './typeCheck'

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

  it('handles image, list, env, and policy types', () => {
    expect(familyOf('PIL.Image.Image')).toBe('image')
    expect(familyOf('list[int]')).toBe('list')
    expect(familyOf('Env')).toBe('env')
    expect(familyOf('Policy')).toBe('policy')
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

  it('verdicts union dtypes correctly', () => {
    expect(classifyEdge('PIL.Image.Image | numpy.ndarray', 'numpy.ndarray', graph)).toBe('compatible')
    expect(classifyEdge('numpy.ndarray', 'PIL.Image.Image | numpy.ndarray', graph)).toBe('compatible')
    expect(classifyEdge('pd.DataFrame', 'torch.Tensor | numpy.ndarray', graph)).toBe('convertible')
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

describe('typeSystem facade (parity with backend mlblock/core/type_system.py)', () => {
  it('familyOf matches legacy and backend', () => {
    expect(typeSystem.familyOf('pd.DataFrame')).toBe('df')
    expect(typeSystem.familyOf('torch.Tensor')).toBe('tensor')
    expect(typeSystem.familyOf('torch.nn.Module')).toBe('module')
    expect(typeSystem.familyOf('PIL.Image.Image')).toBe('image')
    expect(typeSystem.familyOf('numpy.ndarray')).toBe('ndarray')
    expect(typeSystem.familyOf('Env')).toBe('env')
    expect(typeSystem.familyOf('Policy')).toBe('policy')
    // Python alias
    expect(typeSystem.family_of('pd.DataFrame')).toBe('df')
  })

  it('buildConversionGraph derives graph', () => {
    const graph = typeSystem.buildConversionGraph(blocks)
    expect(graph.get('df')?.has('ndarray')).toBe(true)
    expect(graph.get('ndarray')?.has('tensor')).toBe(true)
  })

  it('classify evaluates connections', () => {
    const graph = typeSystem.buildConversionGraph(blocks)
    expect(typeSystem.classify('torch.Tensor', 'torch.Tensor', graph)).toBe('compatible')
    expect(typeSystem.classify('pd.DataFrame', 'object', graph)).toBe('compatible')
    expect(typeSystem.classify('pd.DataFrame', 'torch.Tensor', graph)).toBe('convertible')
    expect(typeSystem.classify('torch.Tensor', 'pd.DataFrame', graph)).toBe('incompatible')
  })

  it('stageOf maps blocks, categories and families to stages', () => {
    expect(typeSystem.stageOf('donnees')).toBe(0)
    expect(typeSystem.stageOf('df')).toBe(0)
    expect(typeSystem.stageOf('transformations')).toBe(1)
    expect(typeSystem.stageOf('tensor')).toBe(1)
    expect(typeSystem.stageOf('layers')).toBe(2)
    expect(typeSystem.stageOf('module')).toBe(2)
    expect(typeSystem.stageOf('entrainement')).toBe(3)
    expect(typeSystem.stageOf('dataset')).toBe(3)
    expect(typeSystem.stageOf('evaluate')).toBe(4)
    expect(typeSystem.stageOf('confusion_matrix')).toBe(4)
    expect(typeSystem.stageOf('visualisation')).toBe(4)
    expect(typeSystem.stageOf('renforcement')).toBe(9)
    expect(typeSystem.stageOf('env')).toBe(9)
  })

  it('findConverter returns converter block name', () => {
    // Quick map conversions
    expect(typeSystem.findConverter('pd.DataFrame', 'torch.Tensor')).toBe('df_to_tensor')
    expect(typeSystem.findConverter('numpy.ndarray', 'torch.Tensor')).toBe('to_tensor')
    expect(typeSystem.findConverter('PIL.Image.Image', 'torch.Tensor')).toBe('to_tensor')
    expect(typeSystem.findConverter('torch.Tensor', 'pd.DataFrame')).toBeNull()

    // Using catalog blocks
    expect(typeSystem.findConverter('pd.DataFrame', 'numpy.ndarray', blocks)).toBe('df_to_tensor')
    expect(typeSystem.findConverter('numpy.ndarray', 'torch.Tensor', blocks)).toBe('to_tensor')
  })

  it('canConnect returns verdict and human-friendly diagnostics', () => {
    // Compatible
    const [compVerdict, compMsg] = typeSystem.canConnect('torch.Tensor', 'torch.Tensor')
    expect(compVerdict).toBe('compatible')
    expect(compMsg).toBeNull()

    // Convertible
    const [convVerdict, convMsg] = typeSystem.canConnect('pd.DataFrame', 'torch.Tensor')
    expect(convVerdict).toBe('convertible')
    expect(convMsg).toContain('df_to_tensor')

    // Convertible with block names
    const [convNamedVerdict, convNamedMsg] = typeSystem.canConnect(
      'pd.DataFrame',
      'torch.Tensor',
      undefined,
      'load_csv',
      'linear_layer',
    )
    expect(convNamedVerdict).toBe('convertible')
    expect(convNamedMsg).toContain('df_to_tensor')
    expect(convNamedMsg).toContain('load_csv')
    expect(convNamedMsg).toContain('linear_layer')

    // Incompatible
    const [incompVerdict, incompMsg] = typeSystem.canConnect('torch.Tensor', 'pd.DataFrame')
    expect(incompVerdict).toBe('incompatible')
    expect(incompMsg).toContain('Type mismatch')
  })

  it('TypeSystem class is instance independent', () => {
    const ts = new TypeSystem()
    expect(ts.familyOf('int')).toBe('scalar')
    expect(ts.stageOf('evaluate')).toBe(4)
  })
})

