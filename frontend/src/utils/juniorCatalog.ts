import type { BlockDefMap } from '../types/catalog'
import { niveauDe, type Niveau } from './niveaux'

/**
 * Catalogue Junior : 17 blocs qui couvrent charger -> couper ->
 * predire/regrouper -> evaluer -> voir -> entrainer. Tout le reste du
 * catalogue reste visible en mode Avance.
 */
export const JUNIOR_TYPES: string[] = [
  'load_csv',
  'load_sklearn_dataset',
  'load_image',
  'normalize',
  'resize',
  'to_tensor',
  'tokenize',
  'train_test_split',
  'kmeans',
  'logistic_regression',
  'decision_tree',
  'evaluate',
  'silhouette',
  'confusion_matrix',
  'tsne',
  'plot_predictions',
  'train_model',
]

/** Baselines Junior (5 noeuds max, params preselectionnes). */
export const JUNIOR_BASELINES: string[] = ['devine-animal', 'regroupe-points']

export function isJuniorType(type: string): boolean {
  return JUNIOR_TYPES.includes(type)
}

/** Types Junior groupes par Niveau (1 -> 4), dans l'ordre. */
export function juniorByNiveau(blocks: BlockDefMap): Record<Niveau, string[]> {
  const out: Record<Niveau, string[]> = { 1: [], 2: [], 3: [], 4: [] }
  for (const t of JUNIOR_TYPES) {
    const def = blocks[t]
    if (!def) continue
    out[niveauDe(def)].push(t)
  }
  return out
}
