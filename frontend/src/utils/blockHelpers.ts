import { defs } from '../mockdata/blocks'
import { categories } from '../mockdata/categories'

export type Block = { id: string; type: string; fields: Record<string, string> }

let uid = 0

export const colorFor = (cat: string): string => {
  const c = categories.find(c => c.id === cat)
  return c ? c.color : '#888'
}

export const titleOf = (type: string): string => {
  const d = defs[type]
  return d.segs.map(s => s.t === 'text' ? s.v : s.def).join(' ')
}

export const instantiate = (type: string): Block => {
  const d = defs[type]
  const fields: Record<string, string> = {}
  d.segs.forEach(s => { if ('k' in s) fields[s.k] = s.def })
  return { id: 'b' + (uid++), type, fields }
}

export const defaultScript = (): Block[] =>
  ['load_data', 'normalize', 'image_detect', 'activation', 'flatten', 'neural', 'activation', 'output', 'lr', 'fit', 'evaluate']
    .map(t => instantiate(t))
