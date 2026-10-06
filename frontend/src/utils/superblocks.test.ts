import { describe, it, expect } from 'vitest'
import type { InternalCatalog, SuperBlockEntry } from '../types/catalog'
import { defaultChildren, compatibleBlocks } from './superblocks'

const catalog = {
  categories: [],
  blocks: {
    load_csv: {
      cat: 'donnees',
      segs: [{ t: 'text', v: 'Load CSV' }, { t: 'num', k: 'path', def: 'data.csv' }],
      inputs: [], outputs: [{ name: 'out_1', dtype: 'pd.DataFrame' }],
      description: '', engine: 'generic',
    },
    standard_scaler: {
      cat: 'transformations', segs: [],
      inputs: [{ name: 'in_1', dtype: 'pd.DataFrame' }],
      outputs: [{ name: 'out_1', dtype: 'pd.DataFrame' }],
      description: '', engine: 'sklearn', params: {},
    },
    to_tensor: {
      cat: 'transformations', segs: [],
      inputs: [{ name: 'in_1', dtype: 'PIL.Image.Image | numpy.ndarray' }],
      outputs: [{ name: 'out_1', dtype: 'torch.Tensor' }],
      description: '', engine: 'pytorch', params: {},
    },
    df_to_tensor: {
      cat: 'transformations', segs: [],
      inputs: [{ name: 'in_1', dtype: 'pd.DataFrame' }],
      outputs: [{ name: 'out_1', dtype: 'torch.Tensor' }],
      description: '', engine: 'pytorch', params: {},
    },
    linear_layer: {
      cat: 'layers', segs: [],
      inputs: [{ name: 'in_1', dtype: 'torch.Tensor' }],
      outputs: [{ name: 'out_1', dtype: 'torch.Tensor' }],
      description: '', engine: 'pytorch', params: {},
    },
  },
  superblocks: [],
} as unknown as InternalCatalog

const sb: SuperBlockEntry = {
  id: 'tabular_data_pipeline',
  title: 'Préparation Tabulaire (Scikit-Learn)',
  macro_stage: 1,
  engine: 'sklearn',
  children: ['load_csv', 'standard_scaler'],
}

describe('defaultChildren', () => {
  it('matérialise les enfants avec ids nodeId.type et defaults du catalogue', () => {
    const kids = defaultChildren(sb, catalog, 'n1')
    expect(kids).toHaveLength(2)
    expect(kids[0].id).toBe('n1.load_csv')
    expect(kids[0].params).toEqual({ path: 'data.csv' })
    expect(kids[1].id).toBe('n1.standard_scaler')
  })

  it('exclut les enfants absents du catalogue', () => {
    const ghost: SuperBlockEntry = { ...sb, children: ['load_csv', 'nope'] }
    expect(defaultChildren(ghost, catalog, 'n1')).toHaveLength(1)
  })
})

describe('compatibleBlocks', () => {
  it('classe compatible avant convertible', () => {
    const { compatible, convertible } = compatibleBlocks(catalog, 'pd.DataFrame')
    expect(compatible).toContain('standard_scaler')
    expect(convertible).not.toContain('standard_scaler')
  })

  it('détecte les convertibles via les ponts du catalogue', () => {
    const { compatible, convertible } = compatibleBlocks(catalog, 'pd.DataFrame')
    expect(convertible).toContain('linear_layer')
    expect(compatible).not.toContain('linear_layer')
  })

  it('exclut le bloc source demandé', () => {
    const { compatible } = compatibleBlocks(catalog, 'pd.DataFrame', 'standard_scaler')
    expect(compatible).not.toContain('standard_scaler')
  })
})

describe('transition gradients', () => {
  it('épingle les 4 ponts et leurs paires de moteurs', async () => {
    const { TRANSITION_GRADIENT, engineColor } = await import('./superblocks')
    expect(TRANSITION_GRADIENT).toEqual({
      df_to_tensor: ['sklearn', 'pytorch'],
      to_tensor: ['viz', 'pytorch'],
      env_to_tensor: ['gym', 'pytorch'],
      module_to_policy: ['pytorch', 'gym'],
    })
    expect(engineColor('pytorch')).toBe('#EA580C')
    expect(engineColor('unknown')).toBeDefined()
  })
})

describe('resolveEdgeStyle', () => {
  it('retire stroke quand le dégradé peint via la classe', async () => {
    const { resolveEdgeStyle } = await import('./superblocks')
    const out = resolveEdgeStyle({ stroke: '#EA580C', strokeDasharray: '6 4' }, { from: 'sklearn', to: 'pytorch' })
    expect(out.style).not.toHaveProperty('stroke')
    expect(out.style).toHaveProperty('strokeDasharray', '6 4')
    expect(out.pairClass).toBe(' mlb-edge-sklearn-to-pytorch')
  })

  it('passe le style tel quel sans dégradé', async () => {
    const { resolveEdgeStyle } = await import('./superblocks')
    const base = { stroke: '#EA580C' }
    const out = resolveEdgeStyle(base, undefined)
    expect(out.style).toEqual(base)
    expect(out.pairClass).toBe('')
  })
})

describe('blockCardInfo', () => {
  it('donne nom, ports, moteur et couleur depuis le catalogue', async () => {
    const { blockCardInfo } = await import('./superblocks')
    const info = blockCardInfo(catalog, 'load_csv')
    expect(info.title).toBe('Load CSV')
    expect(info.inputs).toEqual([])
    expect(info.outputs).toEqual([{ name: 'out_1', dtype: 'pd.DataFrame' }])
    expect(info.color).toBeDefined()
  })

  it('prend le titre pédagogique FR pour un SuperBlock', async () => {
    const { blockCardInfo } = await import('./superblocks')
    const sb: SuperBlockEntry = {
      id: 'tabular_data_pipeline',
      title: 'Préparation Tabulaire (Scikit-Learn)',
      macro_stage: 1,
      engine: 'sklearn',
      children: [],
    }
    const withSb = { ...catalog, superblocks: [sb] } as InternalCatalog
    expect(blockCardInfo(withSb, 'tabular_data_pipeline').title).toBe(sb.title)
  })

  it('retombe sur le type quand le bloc est absent du catalogue', async () => {
    const { blockCardInfo } = await import('./superblocks')
    expect(blockCardInfo(catalog, 'fantome').title).toBe('fantome')
  })
})

describe('availableChildren', () => {
  it('ne garde que les enfants présents au catalogue', async () => {
    const { availableChildren } = await import('./superblocks')
    const sb: SuperBlockEntry = {
      id: 'sb', title: 'SB', macro_stage: 1, engine: 'sklearn',
      children: ['load_csv', 'fantome'],
    }
    expect(availableChildren(sb, catalog)).toEqual(['load_csv'])
  })
})

describe('matchEngine', () => {
  it('filtre Tous, PyTorch, Sklearn/XGB, Gym, MLflow/Viz', async () => {
    const { matchEngine } = await import('./superblocks')
    expect(matchEngine('pytorch', 'all')).toBe(true)
    expect(matchEngine('pytorch', 'pytorch')).toBe(true)
    expect(matchEngine('sklearn', 'pytorch')).toBe(false)
    expect(matchEngine('sklearn', 'sklearn')).toBe(true)
    expect(matchEngine('gym', 'gym')).toBe(true)
    expect(matchEngine('mlflow', 'mlflow-viz')).toBe(true)
    expect(matchEngine('viz', 'mlflow-viz')).toBe(true)
    expect(matchEngine('pytorch', 'mlflow-viz')).toBe(false)
  })
})

describe('groupSuperblocks', () => {
  it('groupe par macro_stage dans l\u2019ordre 1,2,3', async () => {
    const { groupSuperblocks } = await import('./superblocks')
    const sbs: SuperBlockEntry[] = [
      { id: 'b', title: 'B', macro_stage: 3, engine: 'sklearn', children: [] },
      { id: 'a', title: 'A', macro_stage: 1, engine: 'sklearn', children: [] },
      { id: 'c', title: 'C', macro_stage: 2, engine: 'pytorch', children: [] },
    ]
    expect(groupSuperblocks(sbs).map(g => g.stage)).toEqual([1, 2, 3])
    expect(groupSuperblocks(sbs)[0].items.map(i => i.id)).toEqual(['a'])
  })
})
