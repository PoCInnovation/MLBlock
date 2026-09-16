import { describe, it, expect } from 'vitest'
import {
  Stage,
  REPRESENT_DL,
  REPRESENT_ML,
  TRAIN_DL,
  TRAIN_ML,
  STAGE_METADATA,
  ALL_STAGES,
  getStageConfig,
  stageKey,
  stageOfCategory,
  stageOfFamily,
  stageOfBlock,
} from './stages'

describe('Stage enum values and metadata', () => {
  it('matches backend CRISP-DM IA stages + RL World stage', () => {
    expect(Stage.INGEST).toBe(0)
    expect(Stage.PREPARE).toBe(1)
    expect(Stage.REPRESENT).toBe(2)
    expect(Stage.TRAIN).toBe(3)
    expect(Stage.EVAL).toBe(4)
    expect(Stage.WORLD).toBe(9)
  })

  it('matches aliases', () => {
    expect(REPRESENT_DL).toBe(Stage.REPRESENT)
    expect(REPRESENT_ML).toBe(Stage.REPRESENT)
    expect(TRAIN_DL).toBe(Stage.TRAIN)
    expect(TRAIN_ML).toBe(Stage.TRAIN)
  })

  it('provides complete metadata for all stages', () => {
    expect(STAGE_METADATA[Stage.INGEST]).toEqual({
      id: 0,
      key: 'S0',
      name: 'Ingest',
      label: 'Données',
      color: '#22C55E',
    })
    expect(STAGE_METADATA[Stage.PREPARE]).toEqual({
      id: 1,
      key: 'S1',
      name: 'Prepare',
      label: 'Préparation',
      color: '#F5A623',
    })
    expect(STAGE_METADATA[Stage.REPRESENT]).toEqual({
      id: 2,
      key: 'S2',
      name: 'Represent',
      label: 'Modèle',
      color: '#6366F1',
    })
    expect(STAGE_METADATA[Stage.TRAIN]).toEqual({
      id: 3,
      key: 'S3',
      name: 'Train',
      label: 'Entraînement',
      color: '#DE497D',
    })
    expect(STAGE_METADATA[Stage.EVAL]).toEqual({
      id: 4,
      key: 'S4',
      name: 'Eval',
      label: 'Évaluation',
      color: '#06B6D4',
    })
    expect(STAGE_METADATA[Stage.WORLD]).toEqual({
      id: 9,
      key: 'SX',
      name: 'World',
      label: 'Monde RL',
      color: '#E8C77A',
    })
  })

  it('has ALL_STAGES list with 6 stages', () => {
    expect(ALL_STAGES).toHaveLength(6)
    expect(ALL_STAGES.map(s => s.id)).toEqual([0, 1, 2, 3, 4, 9])
    expect(ALL_STAGES.map(s => s.key)).toEqual(['S0', 'S1', 'S2', 'S3', 'S4', 'SX'])
  })
})

describe('getStageConfig and stageKey', () => {
  it('returns exact stage config', () => {
    expect(getStageConfig(0).key).toBe('S0')
    expect(getStageConfig(1).key).toBe('S1')
    expect(getStageConfig(2).key).toBe('S2')
    expect(getStageConfig(3).key).toBe('S3')
    expect(getStageConfig(4).key).toBe('S4')
    expect(getStageConfig(9).key).toBe('SX')
  })

  it('falls back to S1 Prepare when stage is undefined or unknown', () => {
    expect(getStageConfig(undefined).key).toBe('S1')
    expect(getStageConfig(999).key).toBe('S1')
  })

  it('returns stageKey string', () => {
    expect(stageKey(0)).toBe('S0')
    expect(stageKey(1)).toBe('S1')
    expect(stageKey(2)).toBe('S2')
    expect(stageKey(3)).toBe('S3')
    expect(stageKey(4)).toBe('S4')
    expect(stageKey(9)).toBe('SX')
    expect(stageKey(undefined)).toBe('S1')
  })
})

describe('stageOfCategory', () => {
  it('maps category names and category slugs to correct stages', () => {
    expect(stageOfCategory('donnees')).toBe(Stage.INGEST)
    expect(stageOfCategory('donnees-22C55E')).toBe(Stage.INGEST)
    expect(stageOfCategory('chargement-7C3AED')).toBe(Stage.TRAIN)
    expect(stageOfCategory('transformations')).toBe(Stage.PREPARE)
    expect(stageOfCategory('transformations-F5A623')).toBe(Stage.PREPARE)
    expect(stageOfCategory('texte')).toBe(Stage.PREPARE)
    expect(stageOfCategory('layers')).toBe(Stage.REPRESENT)
    expect(stageOfCategory('layers-6366F1')).toBe(Stage.REPRESENT)
    expect(stageOfCategory('activation')).toBe(Stage.REPRESENT)
    expect(stageOfCategory('normalisation')).toBe(Stage.REPRESENT)
    expect(stageOfCategory('regroupement')).toBe(Stage.REPRESENT)
    expect(stageOfCategory('sequences')).toBe(Stage.REPRESENT)
    expect(stageOfCategory('modeles')).toBe(Stage.REPRESENT)
    expect(stageOfCategory('entrainement')).toBe(Stage.TRAIN)
    expect(stageOfCategory('visualisation')).toBe(Stage.EVAL)
    expect(stageOfCategory('renforcement')).toBe(Stage.WORLD)
    expect(stageOfCategory('unknown_cat')).toBe(Stage.PREPARE)
  })
})

describe('stageOfFamily', () => {
  it('maps type families to correct stages', () => {
    expect(stageOfFamily('df')).toBe(Stage.INGEST)
    expect(stageOfFamily('image')).toBe(Stage.INGEST)
    expect(stageOfFamily('ndarray')).toBe(Stage.INGEST)
    expect(stageOfFamily('str')).toBe(Stage.INGEST)
    expect(stageOfFamily('list')).toBe(Stage.INGEST)
    expect(stageOfFamily('tensor')).toBe(Stage.PREPARE)
    expect(stageOfFamily('tuple')).toBe(Stage.PREPARE)
    expect(stageOfFamily('any')).toBe(Stage.PREPARE)
    expect(stageOfFamily('module')).toBe(Stage.REPRESENT)
    expect(stageOfFamily('model')).toBe(Stage.REPRESENT)
    expect(stageOfFamily('dataset')).toBe(Stage.TRAIN)
    expect(stageOfFamily('optim')).toBe(Stage.TRAIN)
    expect(stageOfFamily('dict')).toBe(Stage.TRAIN)
    expect(stageOfFamily('scalar')).toBe(Stage.EVAL)
    expect(stageOfFamily('env')).toBe(Stage.WORLD)
    expect(stageOfFamily('policy')).toBe(Stage.WORLD)
    expect(stageOfFamily('unknown')).toBe(Stage.PREPARE)
  })
})

describe('stageOfBlock', () => {
  it('respects block overrides', () => {
    expect(stageOfBlock('evaluate')).toBe(Stage.EVAL)
    expect(stageOfBlock('confusion_matrix')).toBe(Stage.EVAL)
    expect(stageOfBlock('silhouette')).toBe(Stage.EVAL)
    expect(stageOfBlock('plot_predictions')).toBe(Stage.EVAL)
  })

  it('uses category lookup when specified', () => {
    expect(stageOfBlock('custom_block', 'entrainement')).toBe(Stage.TRAIN)
    expect(stageOfBlock('custom_block', 'donnees-22C55E')).toBe(Stage.INGEST)
    expect(stageOfBlock('custom_block', 'layers')).toBe(Stage.REPRESENT)
  })

  it('falls back to S1 PREPARE for unknown block without category', () => {
    expect(stageOfBlock('custom_block')).toBe(Stage.PREPARE)
  })
})
