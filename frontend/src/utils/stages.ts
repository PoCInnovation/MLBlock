export enum Stage {
  INGEST = 0,
  PREPARE = 1,
  REPRESENT = 2,
  TRAIN = 3,
  EVAL = 4,
  WORLD = 9,
}

// Canonical aliases (variants)
export const REPRESENT_DL = Stage.REPRESENT
export const REPRESENT_ML = Stage.REPRESENT
export const TRAIN_DL = Stage.TRAIN
export const TRAIN_ML = Stage.TRAIN

export interface StageConfig {
  id: number
  key: string
  name: string
  label: string
  color: string
}

export const STAGE_METADATA: Record<number, StageConfig> = {
  [Stage.INGEST]: { id: 0, key: 'S0', name: 'Ingest', label: 'Données', color: '#22C55E' },
  [Stage.PREPARE]: { id: 1, key: 'S1', name: 'Prepare', label: 'Préparation', color: '#F5A623' },
  [Stage.REPRESENT]: { id: 2, key: 'S2', name: 'Represent', label: 'Modèle', color: '#6366F1' },
  [Stage.TRAIN]: { id: 3, key: 'S3', name: 'Train', label: 'Entraînement', color: '#DE497D' },
  [Stage.EVAL]: { id: 4, key: 'S4', name: 'Eval', label: 'Évaluation', color: '#06B6D4' },
  [Stage.WORLD]: { id: 9, key: 'SX', name: 'World', label: 'Monde RL', color: '#E8C77A' },
}

export const ALL_STAGES: StageConfig[] = [
  STAGE_METADATA[Stage.INGEST],
  STAGE_METADATA[Stage.PREPARE],
  STAGE_METADATA[Stage.REPRESENT],
  STAGE_METADATA[Stage.TRAIN],
  STAGE_METADATA[Stage.EVAL],
  STAGE_METADATA[Stage.WORLD],
]

export function getStageConfig(stage?: number): StageConfig {
  if (stage !== undefined && STAGE_METADATA[stage]) {
    return STAGE_METADATA[stage]
  }
  return STAGE_METADATA[Stage.PREPARE]
}

export function stageKey(stage?: number): string {
  return getStageConfig(stage).key
}

export const STAGE_OF_CATEGORY: Record<string, Stage> = {
  donnees: Stage.INGEST,
  chargement: Stage.TRAIN,
  transformations: Stage.PREPARE,
  texte: Stage.PREPARE,
  layers: Stage.REPRESENT,
  activation: Stage.REPRESENT,
  normalisation: Stage.REPRESENT,
  regroupement: Stage.REPRESENT,
  sequences: Stage.REPRESENT,
  modeles: Stage.REPRESENT,
  entrainement: Stage.TRAIN,
  visualisation: Stage.EVAL,
  renforcement: Stage.WORLD,
}

export const STAGE_OF_FAMILY: Record<string, Stage> = {
  df: Stage.INGEST,
  image: Stage.INGEST,
  ndarray: Stage.INGEST,
  str: Stage.INGEST,
  list: Stage.INGEST,
  tensor: Stage.PREPARE,
  tuple: Stage.PREPARE,
  any: Stage.PREPARE,
  module: Stage.REPRESENT,
  model: Stage.REPRESENT,
  dataset: Stage.TRAIN,
  optim: Stage.TRAIN,
  dict: Stage.TRAIN,
  scalar: Stage.EVAL,
  env: Stage.WORLD,
  policy: Stage.WORLD,
}

export const STAGE_OF_BLOCK_OVERRIDES: Record<string, Stage> = {
  evaluate: Stage.EVAL,
  confusion_matrix: Stage.EVAL,
  silhouette: Stage.EVAL,
  plot_predictions: Stage.EVAL,
  env_to_tensor: Stage.PREPARE,
  module_to_policy: Stage.EVAL,
}

export function stageOfCategory(categoryName: string): Stage {
  const cat = categoryName.split('-')[0].trim().toLowerCase()
  return STAGE_OF_CATEGORY[cat] ?? Stage.PREPARE
}

export function stageOfFamily(family: string): Stage {
  const f = family.trim().toLowerCase()
  return STAGE_OF_FAMILY[f] ?? Stage.PREPARE
}

export function stageOfBlock(blockName: string, category?: string): Stage {
  const name = blockName.trim()
  if (STAGE_OF_BLOCK_OVERRIDES[name] !== undefined) {
    return STAGE_OF_BLOCK_OVERRIDES[name]
  }
  if (category) {
    return stageOfCategory(category)
  }
  return Stage.PREPARE
}
