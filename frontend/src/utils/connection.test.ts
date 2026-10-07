import { describe, it, expect } from 'vitest'
import type { BlockDef, BlockDefMap, Port, InternalCatalog } from '../types/catalog'
import { canConnect } from './connection'

const def = (cat: string, inputs: Port[], outputs: Port[]): BlockDef => ({
  cat,
  segs: [],
  inputs,
  outputs,
  description: '',
})

const blocks: BlockDefMap = {
  to_tensor: def('transforms', [{ name: 'in', dtype: 'numpy.ndarray' }], [{ name: 'out', dtype: 'torch.Tensor' }]),
  sink: def('other', [{ name: 'in_1', dtype: 'torch.Tensor' }], [{ name: 'out_1', dtype: 'torch.Tensor' }]),
}

const catalog: InternalCatalog = { categories: [], blocks }

describe('canConnect', () => {
  it('refuse une connexion sans handle côté source ou cible', () => {
    expect(canConnect({ id: 'a', dtype: 'torch.Tensor' }, { id: 'b', handle: 'in_1', dtype: 'torch.Tensor' }, catalog)).toEqual({
      allowed: false,
      reason: 'missing handle',
    })
    expect(canConnect({ id: 'a', handle: 'out_1', dtype: 'torch.Tensor' }, { id: 'b', dtype: 'torch.Tensor' }, catalog)).toEqual({
      allowed: false,
      reason: 'missing handle',
    })
  })

  it('autorise un dtype identique (compatible) sans convertisseur', () => {
    const res = canConnect(
      { id: 'a', handle: 'out_1', dtype: 'torch.Tensor' },
      { id: 'b', handle: 'in_1', dtype: 'torch.Tensor' },
      catalog,
    )
    expect(res.allowed).toBe(true)
    expect(res.converter).toBeUndefined()
    expect(res.edge).toEqual({ source: 'a', target: 'b', sourceHandle: 'out_1', targetHandle: 'in_1' })
  })

  it('autorise un dtype convertible et renseigne le convertisseur suggéré', () => {
    const res = canConnect(
      { id: 'a', handle: 'out_1', dtype: 'numpy.ndarray' },
      { id: 'b', handle: 'in_1', dtype: 'torch.Tensor' },
      catalog,
    )
    expect(res.allowed).toBe(true)
    expect(res.converter).toBe('to_tensor')
  })

  it('refuse un dtype incompatible sans chemin de conversion', () => {
    const res = canConnect(
      { id: 'a', handle: 'out_1', dtype: 'pd.DataFrame' },
      { id: 'b', handle: 'in_1', dtype: 'torch.Tensor' },
      catalog,
    )
    expect(res).toEqual({ allowed: false, reason: 'incompatible' })
  })

  it('autorise par défaut quand aucun catalogue n’est fourni (pas de check de type)', () => {
    const res = canConnect({ id: 'a', handle: 'out_1' }, { id: 'b', handle: 'in_1' })
    expect(res.allowed).toBe(true)
  })
})
