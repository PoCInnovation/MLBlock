/** Bibliothèque de données d'exemple (backend /api/samples, bucket sample-data). */

export type Sample = {
  id: string
  name: string
  description: string
  category: string
  url: string
  columns: string[]
  rows: number
}

/** Catégorie de la bibliothèque pour chaque bloc à champ fichier. */
export const SAMPLE_CATEGORY_BY_BLOCK: Record<string, string> = {
  load_csv: 'tabular',
  sequence_dataset: 'series',
  load_image: 'image',
  load_text: 'text',
}

/** Extensions acceptées par le champ fichier selon le bloc (défaut CSV). */
export const ACCEPT_BY_BLOCK: Record<string, string> = {
  load_image: 'image/png,image/jpeg',
}
export const DEFAULT_ACCEPT = '.csv'
