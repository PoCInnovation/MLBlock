import React, { useRef, useState } from 'react'
import type { Segment } from '../../types/catalog'
import { uploadFile, supabase } from '../../services/supabase'

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
const fileBtn: React.CSSProperties = {
  background: 'rgba(99,102,241,.2)', border: '1px dashed rgba(99,102,241,.5)',
  borderRadius: 7, padding: '3px 8px', color: '#a5b4fc', fontWeight: 700,
  fontSize: 12, cursor: 'pointer', display: 'inline-block',
}

type BlockSegmentsProps = {
  segs: Segment[]
  fields?: Record<string, string>
  blockId?: string
  onUpdate?: (id: string, k: string, v: string) => void
}

export default function BlockSegments({ segs, fields, blockId, onUpdate }: BlockSegmentsProps): React.ReactNode {
  const [uploading, setUploading] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (k: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUpdate || !blockId) return
    setUploading(k)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const path = `${user?.id ?? 'anonymous'}/${blockId}_${Date.now()}.csv`
      const url = await uploadFile(file, 'user-uploads', path)
      if (url) onUpdate(blockId, k, url)
    } catch {
      /* upload failed */
    } finally {
      setUploading(k)
    }
  }

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
    if (s.t === 'file') {
      const hasFile = fields?.[s.k]?.startsWith('https://')
      return (
        <span key={i}>
          <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(s.k, e)} />
          <span onClick={() => inputRef.current?.click()} style={fileBtn}>
            {uploading === s.k ? '⏳...' : hasFile ? '✓ CSV' : '📁 CSV'}
          </span>
        </span>
      )
    }
    return null
  })
}
