import { describe, it, expect } from 'vitest'
import { parseCatalog } from './client'

const payload = {
  categories: [
    {
      id: 'transformations',
      name: 'Transformations',
      color: '#F5A623',
      blocks: [
        {
          type: 'df_to_tensor',
          label: 'DataFrame to Tensor',
          description: 'Convertit un DataFrame en tenseur.',
          params: {},
          inputs: [{ name: 'in_1', dtype: 'pd.DataFrame' }],
          outputs: [{ name: 'out_1', dtype: 'torch.Tensor' }],
          advanced: false,
          group: 'core',
          stage: 1,
          stage_name: 'Prepare',
          macro_stage: 1,
          macro_stage_name: 'Data',
          engine: 'pytorch',
          is_transition: true,
        },
        {
          type: 'load_csv',
          label: 'Load CSV',
          description: 'Charge un CSV.',
          params: {},
          inputs: [],
          outputs: [{ name: 'out_1', dtype: 'pd.DataFrame' }],
          advanced: false,
          group: 'core',
          stage: 0,
          stage_name: 'Ingest',
          macro_stage: 1,
          macro_stage_name: 'Data',
          // pas d'engine : le mapping doit fournir un fallback défini
          is_transition: false,
        },
      ],
    },
  ],
  stages: [{ id: 0, name: 'Ingest', label: 'Données', color: '#22C55E' }],
  macro_stages: [{ id: 1, name: 'Data', label: 'Données', color: '#22C55E' }],
  superblocks: [
    {
      id: 'tabular_data_pipeline',
      label: 'Préparation Tabulaire (Scikit-Learn)',
      title: 'Préparation Tabulaire (Scikit-Learn)',
      macro_stage: 1,
      engine: 'sklearn',
      children: ['load_csv', 'standard_scaler'],
    },
  ],
}

describe('parseCatalog superblocks robustes', () => {
  const baseBlock = {
    type: 'load_csv', label: 'Load CSV', description: '', params: {},
    inputs: [], outputs: [], advanced: false, group: 'core',
  }
  const base = {
    categories: [{ id: 'c', name: 'C', color: '#fff', blocks: [baseBlock] }],
  }
  it('fallback engine generic quand absent', () => {
    const cat = parseCatalog({
      ...base,
      superblocks: [{ id: 'sb', title: 'SB', macro_stage: 1, children: [] }],
    })
    expect(cat.superblocks).toHaveLength(1)
    expect(cat.superblocks[0].engine).toBe('generic')
  })
  it('exclut un superblock sans macro_stage sans tuer le catalogue', () => {
    const cat = parseCatalog({
      ...base,
      superblocks: [
        { id: 'bad', title: 'Bad', engine: 'pytorch', children: [] },
        { id: 'good', title: 'Good', macro_stage: 2, engine: 'pytorch', children: [] },
      ],
    })
    expect(cat.superblocks.map(s => s.id)).toEqual(['good'])
  })
})

describe('parseCatalog', () => {
  it('mappe engine / macro_stage / is_transition par bloc', () => {
    const cat = parseCatalog(payload)
    expect(cat.blocks['df_to_tensor'].engine).toBe('pytorch')
    expect(cat.blocks['df_to_tensor'].macro_stage).toBe(1)
    expect(cat.blocks['df_to_tensor'].is_transition).toBe(true)
  })

  it('fournit un fallback engine défini quand le backend ne le sert pas', () => {
    const cat = parseCatalog(payload)
    expect(cat.blocks['load_csv'].engine).toBeDefined()
  })

  it('expose les superblocks avec leurs enfants', () => {
    const cat = parseCatalog(payload)
    expect(cat.superblocks).toHaveLength(1)
    expect(cat.superblocks[0].children).toEqual(['load_csv', 'standard_scaler'])
    expect(cat.superblocks[0].engine).toBe('sklearn')
  })
})
