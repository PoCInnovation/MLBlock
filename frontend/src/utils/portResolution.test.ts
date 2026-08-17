import { describe, it, expect } from 'vitest'
import type { BlockDef, BlockDefMap, Port } from '../types/catalog'
import { buildConversionGraph } from './typeCheck'
import { isAmbiguous, resolveConnection } from './portResolution'

const def = (cat: string, inputs: Port[], outputs: Port[]): BlockDef => ({
  cat,
  segs: [],
  inputs,
  outputs,
  description: '',
})

const blocks: BlockDefMap = {
  to_tensor: def('transforms', [{ name: 'in', dtype: 'numpy.ndarray' }], [{ name: 'out', dtype: 'torch.Tensor' }]),
  to_numpy: def('transforms', [{ name: 'in', dtype: 'pd.DataFrame' }], [{ name: 'out', dtype: 'numpy.ndarray' }]),
  evaluate: def('evaluation', [{ name: 'in_1', dtype: 'Model' }, { name: 'in_2', dtype: 'pd.DataFrame' }], [{ name: 'out_1', dtype: 'float' }]),
  plot_predictions: def('visualization', [{ name: 'in_1', dtype: 'object' }, { name: 'in_2', dtype: 'pd.DataFrame' }], [{ name: 'out_1', dtype: 'bytes' }]),
  tensor_dataset: def('data', [{ name: 'in_1', dtype: 'torch.Tensor' }, { name: 'in_2', dtype: 'torch.Tensor' }], [{ name: 'out_1', dtype: 'torch.utils.data.TensorDataset' }]),
  random_split: def('data', [{ name: 'in_1', dtype: 'torch.utils.data.Dataset' }], [{ name: 'out_1', dtype: 'torch.utils.data.Dataset' }, { name: 'out_2', dtype: 'torch.utils.data.Dataset' }]),
  conv2d: def('convolution', [{ name: 'in_1', dtype: 'torch.Tensor' }], [{ name: 'out_1', dtype: 'torch.Tensor' }]),
}

const graph = buildConversionGraph(blocks)

describe('isAmbiguous', () => {
  it('est faux quand tous les dtypes sont distincts', () => {
    expect(isAmbiguous(blocks.evaluate.inputs)).toBe(false)
  })

  it('est vrai quand deux ports partagent le même dtype', () => {
    expect(isAmbiguous(blocks.tensor_dataset.inputs)).toBe(true)
    expect(isAmbiguous(blocks.random_split.outputs)).toBe(true)
  })
})

describe('resolveConnection', () => {
  it('résout le port cible par dtype exact pour un bloc non-ambigu', () => {
    const res = resolveConnection(
      [{ name: 'out_1', dtype: 'pd.DataFrame' }],
      blocks.evaluate.inputs,
      'out_1', null, graph,
    )
    expect(res).toEqual({ sourcePort: 'out_1', targetPort: 'in_2', verdict: 'compatible' })
  })

  it('résout vers le port Model quand la source est un Model', () => {
    const res = resolveConnection(
      [{ name: 'out_1', dtype: 'Model' }],
      blocks.evaluate.inputs,
      'out_1', null, graph,
    )
    expect(res?.targetPort).toBe('in_1')
  })

  it('privilégie le dtype exact sur le wildcard (plot_predictions)', () => {
    // in_1=object (wildcard) vient avant in_2=pd.DataFrame : sans le scoring
    // fin, in_1 gagnerait par ordre de déclaration. Le dtype exact doit gagner.
    const res = resolveConnection(
      [{ name: 'out_1', dtype: 'pd.DataFrame' }],
      blocks.plot_predictions.inputs,
      'out_1', null, graph,
    )
    expect(res?.targetPort).toBe('in_2')
  })

  it('fige le handle cliqué sur un côté ambigu', () => {
    const res = resolveConnection(
      [{ name: 'out_1', dtype: 'torch.Tensor' }],
      blocks.tensor_dataset.inputs,
      'out_1', 'in_2', graph,
    )
    expect(res?.targetPort).toBe('in_2')
  })

  it('retourne null quand aucun couple compatible ou convertible', () => {
    const res = resolveConnection(
      [{ name: 'out_1', dtype: 'torch.Tensor' }],
      blocks.evaluate.inputs, // Model + DataFrame, pas de conversion tensor→
      'out_1', null, graph,
    )
    expect(res).toBeNull()
  })

  it('classe convertible un couple avec chemin de conversion', () => {
    // pd.DataFrame → numpy.ndarray → torch.Tensor via to_numpy puis to_tensor
    const res = resolveConnection(
      [{ name: 'out_1', dtype: 'pd.DataFrame' }],
      blocks.conv2d.inputs, // torch.Tensor
      'out_1', null, graph,
    )
    expect(res?.verdict).toBe('convertible')
    expect(res?.targetPort).toBe('in_1')
  })

  it('retourne null sans ports', () => {
    expect(resolveConnection(undefined, undefined, null, null, graph)).toBeNull()
    expect(resolveConnection([], [{ name: 'in_1', dtype: 'float' }], null, null, graph)).toBeNull()
  })
})
