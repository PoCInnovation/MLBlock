import React from 'react'
import type { Segment } from '../../mockdata/blocks'

const inputBase: React.CSSProperties = {
  background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: 7,
  padding: '3px 5px', textAlign: 'center', color: '#2a211c',
  fontWeight: 800, fontSize: 13, outline: 'none',
}
const selectBase: React.CSSProperties = {
  background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: 7,
  padding: '3px 6px', color: '#2a211c', fontWeight: 800, fontSize: 13,
  outline: 'none', cursor: 'pointer',
}
const fieldPill: React.CSSProperties = {
  background: 'rgba(255,255,255,.85)', padding: '2px 8px', borderRadius: 7, fontWeight: 800,
}

type BlockSegmentsProps = {
  segs: Segment[]
  fields?: Record<string, string>
  blockId?: string
  onUpdate?: (id: string, k: string, v: string) => void
}

export default function BlockSegments({ segs, fields, blockId, onUpdate }: BlockSegmentsProps): React.ReactNode {
  return segs.map((s, i) => {
    if (s.t === 'text') return <span key={i}>{s.v}</span>
    if (!onUpdate) return <span key={i} style={fieldPill}>{s.def}</span>
    if (s.t === 'num') return (
      <input
        key={i}
        type="text"
        value={fields![s.k]}
        onChange={e => onUpdate(blockId!, s.k, e.target.value)}
        style={{ ...inputBase, width: (s.w || 44) + 'px' }}
      />
    )
    if (s.t === 'sel') return (
      <select
        key={i}
        value={fields![s.k]}
        onChange={e => onUpdate(blockId!, s.k, e.target.value)}
        style={selectBase}
      >
        {s.opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
    return null
  })
}
