import type { Segment } from '../types/catalog'

type Editable = Exclude<Segment, { t: 'text' }>

export type ParamHint = { description?: string; hint?: string; invalid?: string }

/** Message d'erreur lisible d'une valeur hors métadonnées. */
export function validateSeg(seg: Segment, value: string): string | undefined {
  if (seg.t === 'num') {
    if (value.trim() === '') return undefined
    if (seg.min == null && seg.max == null && seg.step == null && !seg.odd) return undefined
    const n = Number(value)
    if (Number.isNaN(n)) return 'Nombre attendu'
    if (seg.min != null && n < seg.min) return `Doit être ≥ ${seg.min}`
    if (seg.max != null && n > seg.max) return `Doit être ≤ ${seg.max}`
    if (seg.odd && n % 2 === 0) return 'Doit être impair'
    return undefined
  }
  if (seg.t === 'list') {
    if (value.trim() === '') return undefined
    try {
      const arr = JSON.parse(value)
      if (!Array.isArray(arr)) return 'Liste attendue : [1, 2, 3]'
      if (seg.len != null && arr.length !== seg.len) return `${arr.length}/${seg.len} éléments`
      return undefined
    } catch {
      return 'Liste attendue : [1, 2, 3]'
    }
  }
  return undefined
}

/** Contraintes affichées sous un champ : ce qu'il faut faire, et jusqu'où. */
export function segHint(seg: Segment): string | undefined {
  if (seg.t === 'num') {
    const { min, max, step, odd } = seg
    // Pas de 1 ou min 0 : valeurs par défaut, bruit inutile pour l'utilisateur.
    const unit = step != null && step !== 1 ? ` (pas de ${step})` : ''
    if (min != null && min !== 0 && max != null) {
      const base = `entre ${min} et ${max}${unit}`
      return odd ? `Entier impair, ${base}` : `Entier, ${base}`
    }
    if (min != null && min !== 0) return `Au moins ${min}${unit}`
    if (max != null) return `Au plus ${max}`
    if (odd) return 'Entier impair uniquement'
    return undefined
  }
  if (seg.t === 'list') {
    if (seg.format) return seg.format
    return seg.len != null ? `Exactement ${seg.len} éléments : [1, 2, 3]` : 'Liste : [1, 2, 3]'
  }
  if (seg.t === 'file') return seg.desc ? `Attendu : ${seg.desc}` : undefined
  return undefined
}

/** Description + contrainte + erreur d'une valeur, pour un rendu lisible. */
export function describeParam(seg: Segment, value = ''): ParamHint {
  const out: ParamHint = {}
  if (seg.t === 'text') return out
  if (seg.desc) out.description = seg.desc
  const hint = segHint(seg)
  if (hint) out.hint = hint
  const err = validateSeg(seg, value)
  if (err) out.invalid = err
  return out
}

export type { Editable }