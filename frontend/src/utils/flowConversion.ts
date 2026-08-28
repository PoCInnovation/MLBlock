import type { BlockDefMap } from '../types/catalog'

/** Default field values from a block definition's segments. */
export function segsToFields(def: BlockDefMap[string] | undefined): Record<string, string> {
  const fields: Record<string, string> = {}
  if (!def) return fields
  for (const seg of def.segs) {
    if ('k' in seg) fields[seg.k] = seg.def
  }
  return fields
}
