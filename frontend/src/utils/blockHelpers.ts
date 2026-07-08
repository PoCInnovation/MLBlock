import type { BlockDefMap, Category } from '../types/catalog'

export type Block = { id: string; type: string; fields: Record<string, string> }

let uid = 0

export const colorFor = (cat: string, categories: Category[]): string => {
  const c = categories.find(c => c.id === cat)
  return c ? c.color : '#888'
}

export const titleOf = (type: string, defs: BlockDefMap): string => {
  const d = defs[type]
  if (!d) return type
  return d.segs.map(s => s.t === 'text' ? s.v : s.def).join(' ')
}

export const instantiate = (type: string, defs: BlockDefMap): Block => {
  const d = defs[type]
  const fields: Record<string, string> = {}
  d.segs.forEach(s => { if ('k' in s) fields[s.k] = s.def })
  return { id: 'b' + (uid++), type, fields }
}
