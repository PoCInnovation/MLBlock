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

/** Accept de repli quand le catalogue n'en déclare pas. */
export const DEFAULT_ACCEPT = '.csv'

/** Nature d'un fichier : pilote l'aperçu (lignes, miniature, fiche). */
export type FileKind = 'csv' | 'image' | 'text' | 'model' | 'audio' | 'other'

const KIND_BY_TOKEN: Record<string, FileKind> = {
  csv: 'csv', tsv: 'csv', txt: 'text', md: 'text',
  png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', gif: 'image',
  pt: 'model', pth: 'model', pkl: 'model', onnx: 'model', safetensors: 'model',
  wav: 'audio', mp3: 'audio', ogg: 'audio', flac: 'audio',
  'text/csv': 'csv', 'text/plain': 'text',
  'image/png': 'image', 'image/jpeg': 'image', 'image/webp': 'image', 'image/gif': 'image',
  'audio/wav': 'audio', 'audio/mpeg': 'audio', 'audio/ogg': 'audio',
}

/** Classe un fichier par son accept déclaré ou son mime : premier token connu gagne. */
export function kindOf(acceptOrMime: string): FileKind {
  for (const tok of acceptOrMime.toLowerCase().split(/[|,]/)) {
    const kind = KIND_BY_TOKEN[tok.replace(/^\./, '').trim()]
    if (kind) return kind
  }
  return 'other'
}
