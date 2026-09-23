import type { BlockDef } from '../types/catalog'

/**
 * Niveaux de liaisons : chaque bloc est classe par son nombre de ports.
 * La regle est pure et automatique : un nouveau bloc du catalogue se
 * classe tout seul, sans maintenance.
 *
 * Niveau 1 : aucune entree (sources : load_csv, load_image...).
 * Niveau 2 : 1 entree + 1 sortie (transfos simples : relu, normalize...).
 * Niveau 3 : 2+ liaisons (jonctions : train_test_split, evaluate...).
 * Niveau 4 : 3+ entrees (chefs d'orchestre : train_model).
 */
export type Niveau = 1 | 2 | 3 | 4

export function niveauDe(block: Pick<BlockDef, 'inputs' | 'outputs'>): Niveau {
  const nIn = block.inputs.length
  const nOut = block.outputs.length
  if (nIn === 0) return 1
  if (nIn >= 3) return 4
  if (nIn === 1 && nOut === 1) return 2
  return 3
}

export const NIVEAUX: Niveau[] = [1, 2, 3, 4]

export const NIVEAU_LABELS: Record<Niveau, string> = {
  1: 'Je prends des donnees',
  2: 'Je transforme',
  3: 'Je melange / je decide',
  4: "J'entraine",
}

export const NIVEAU_CONSIGNES: Record<Niveau, string> = {
  1: "Choisis d'ou viennent les donnees : un fichier, des photos, un jeu tout pret.",
  2: 'Change les donnees : une entree, une sortie.',
  3: 'Coupe, compare ou evalue : ici les blocs se rejoignent.',
  4: "Assemble le modele et lance l'entrainement.",
}
