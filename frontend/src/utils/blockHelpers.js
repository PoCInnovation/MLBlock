import { defs } from '../mockdata/blocks'
import { categories } from '../mockdata/categories'

let uid = 0

export const colorFor = (cat) => {
  const c = categories.find(c => c.id === cat)
  return c ? c.color : '#888'
}

export const titleOf = (type) => {
  const d = defs[type]
  return d.segs.map(s => s.t === 'text' ? s.v : s.def).join(' ')
}

export const instantiate = (type) => {
  const d = defs[type]
  const fields = {}
  d.segs.forEach(s => { if (s.k !== undefined) fields[s.k] = s.def })
  return { id: 'b' + (uid++), type, fields }
}

export const defaultScript = () =>
  ['load_data', 'normalize', 'image_detect', 'activation', 'flatten', 'neural', 'activation', 'output', 'lr', 'fit', 'evaluate']
    .map(t => instantiate(t))
