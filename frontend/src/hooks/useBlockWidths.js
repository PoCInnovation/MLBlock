import { useRef, useReducer, useLayoutEffect } from 'react'
import { buildClusters, snapW } from '../utils/snapLogic'

function contentKey(b) {
  const f = b.fields || {}
  return b.type + '|' + Object.keys(f).sort().map(k => k + '=' + f[k]).join('&')
}

export function useBlockWidths({ script, blockElsRef, hatRef }) {
  const naturalW = useRef({})
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  useLayoutEffect(() => {
    let changed = false
    if (hatRef.current && naturalW.current['__hat__'] == null) {
      naturalW.current['__hat__'] = hatRef.current.offsetWidth
      changed = true
    }
    script.forEach(b => {
      const k = contentKey(b)
      if (naturalW.current[k] == null) {
        const el = blockElsRef.current[b.id]
        if (el) { naturalW.current[k] = el.offsetWidth; changed = true }
      }
    })
    if (changed) forceUpdate()
  })

  const hatNat = naturalW.current['__hat__']
  const sKeys = script.map(contentKey)
  const knownW = []
  if (hatNat != null) knownW.push(hatNat)
  sKeys.forEach(k => { if (naturalW.current[k] != null) knownW.push(naturalW.current[k]) })
  const clusters = buildClusters(knownW)
  const bands = sKeys.map(k => snapW(naturalW.current[k], clusters))
  const hatBand = snapW(hatNat, clusters)

  return { bands, hatBand }
}
