import React, { useRef, useState } from 'react'
import type { Segment } from '../../types/catalog'
import { uploadFile, supabase } from '../../services/supabase'
import { theme } from '../../theme'

const inputBase: React.CSSProperties = {
  background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: theme.radius.sm,
  padding: '3px 5px', textAlign: 'center', color: theme.color.textInput,
  fontWeight: 800, fontSize: 13,
}
const selectBase: React.CSSProperties = {
  background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: theme.radius.sm,
  padding: '3px 6px', color: theme.color.textInput, fontWeight: 800, fontSize: 13,
  cursor: 'pointer',
}
const fieldPill: React.CSSProperties = {
  background: 'rgba(255,255,255,.85)', padding: '2px 8px', borderRadius: theme.radius.sm, fontWeight: 800,
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, opacity: 0.85, whiteSpace: 'nowrap',
}
const fileCard: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'rgba(99,102,241,.15)', borderRadius: 8,
  padding: '4px 8px', fontSize: 12, fontWeight: 700,
}
const fileNameStyle: React.CSSProperties = {
  color: theme.color.file, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}
const fileMeta: React.CSSProperties = {
  color: theme.color.fileMeta, fontSize: 11, fontWeight: 600,
}
const fileBtn: React.CSSProperties = {
  background: 'rgba(99,102,241,.2)', border: '1px dashed rgba(99,102,241,.5)',
  borderRadius: theme.radius.sm, padding: '3px 8px', color: theme.color.fileBtn, fontWeight: 700,
  fontSize: 12, cursor: 'pointer', display: 'inline-block',
}
const removeBtn: React.CSSProperties = {
  width: 16, height: 16, borderRadius: '50%', border: 'none',
  background: 'rgba(0,0,0,.2)', color: theme.color.file, fontSize: 10,
  lineHeight: '16px', cursor: 'pointer', padding: 0, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
}
const errStyle: React.CSSProperties = {
  color: theme.color.errorLight, fontSize: 11, fontWeight: 600, cursor: 'pointer',
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/** Live validation of a segment value against its metadata. */
function validateSeg(seg: Segment, value: string): { ok: boolean; msg?: string } {
  if (seg.t === 'num') {
    if (value.trim() === '') return { ok: true }
    // Sans métadonnées numériques, le champ est libre (str/bool fallback) — pas de validation
    if (seg.min == null && seg.max == null && seg.step == null && !seg.odd) return { ok: true }
    const n = Number(value)
    if (Number.isNaN(n)) return { ok: false, msg: 'Valeur numérique attendue' }
    if (seg.min != null && n < seg.min) return { ok: false, msg: `Doit être ≥ ${seg.min}` }
    if (seg.max != null && n > seg.max) return { ok: false, msg: `Doit être ≤ ${seg.max}` }
    if (seg.odd && n % 2 === 0) return { ok: false, msg: 'Doit être impair' }
    return { ok: true }
  }
  if (seg.t === 'list') {
    if (value.trim() === '') return { ok: true }
    try {
      const arr = JSON.parse(value)
      if (!Array.isArray(arr)) return { ok: false, msg: 'Format attendu : [1, 2, 3]' }
      if (seg.len != null && arr.length !== seg.len) return { ok: false, msg: `${arr.length}/${seg.len} éléments` }
      return { ok: true }
    } catch {
      return { ok: false, msg: 'Format attendu : [1, 2, 3]' }
    }
  }
  return { ok: true }
}

function validBorder(v: { ok: boolean; msg?: string }, filled: boolean): React.CSSProperties {
  if (!filled) return {}
  return { border: `1.5px solid ${v.ok ? theme.color.success : theme.color.error}`, boxShadow: 'none' }
}

type BlockSegmentsProps = {
  segs: Segment[]
  fields?: Record<string, string>
  blockId?: string
  onUpdate?: (id: string, k: string, v: string) => void
  /** Autocomplete options per param key (e.g. target_column from the source CSV). */
  columnOptions?: Record<string, string[]>
}

export default function BlockSegments({ segs, fields, blockId, onUpdate, columnOptions }: BlockSegmentsProps): React.ReactNode {
  const [uploadState, setUploadState] = useState<Record<string, 'uploading' | 'error'>>({})
  const [fileMetaState, setFileMetaState] = useState<Record<string, { name: string; size: number }>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFile = async (k: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUpdate || !blockId) return
    setUploadState(s => ({ ...s, [k]: 'uploading' }))
    setFileMetaState(s => ({ ...s, [k]: { name: file.name, size: file.size } }))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const path = `${user?.id ?? 'anonymous'}/${blockId}_${Date.now()}.csv`
      const url = await uploadFile(file, 'user-uploads', path)
      if (url) {
        onUpdate(blockId, k, url)
        setUploadState(s => ({ ...s, [k]: 'uploading' }))
        setUploadState(s => {
          const next = { ...s }
          delete next[k]
          return next
        })
      }
    } catch {
      setUploadState(s => ({ ...s, [k]: 'error' }))
    }
  }

  return segs.map((s, i) => {
    if (s.t === 'text') return <span key={i}>{s.v}</span>
    if (!onUpdate) return <span key={i} style={fieldPill}>{s.def}</span>

    const value = fields![s.k]
    const cols = columnOptions?.[s.k]

    // Suggestions (datalist) pour un champ libre — choices docstring ou colonnes CSV
    if (cols || s.t === 'sug') {
      const opts = cols ?? (s.t === 'sug' ? s.opts : [])
      const dlId = `mlb-dl-${blockId}-${s.k}`
      return (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={labelStyle}>{s.k}:</span>
          <input
            list={dlId}
            type="text"
            value={value}
            onChange={e => onUpdate(blockId!, s.k, e.target.value)}
            style={{ ...inputBase, width: 110 }}
            title={s.desc}
            placeholder={cols ? 'colonne…' : undefined}
          />
          <datalist id={dlId}>{opts.map(o => <option key={o} value={o} />)}</datalist>
        </span>
      )
    }

    if (s.t === 'sel') return (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={labelStyle}>{s.k}:</span>
        <select
          value={value}
          onChange={e => onUpdate(blockId!, s.k, e.target.value)}
          style={selectBase}
          title={s.desc}
        >
          {s.opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </span>
    )

    if (s.t === 'bool') {
      const checked = value === 'true'
      return (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={labelStyle}>{s.k}:</span>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onUpdate(blockId!, s.k, e.target.checked ? 'true' : 'false')}
            title={s.desc}
            style={{ cursor: 'pointer', accentColor: '#2a211c' }}
          />
        </span>
      )
    }

    if (s.t === 'num') {
      const v = validateSeg(s, value)
      const placeholder = s.min != null && s.max != null ? `entre ${s.min} et ${s.max}` : undefined
      const isNumeric = s.min != null || s.max != null || s.step != null
      // datalist incompatible avec type=number → text quand suggestions
      const useText = !!s.opts && s.opts.length > 0
      if (useText) {
        const dlId = `mlb-dl-${blockId}-${s.k}`
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={labelStyle}>{s.k}:</span>
            <input
              list={dlId}
              type="text"
              value={value}
              onChange={e => onUpdate(blockId!, s.k, e.target.value)}
              style={{ ...inputBase, width: (s.w || 60) + 'px', ...validBorder(v, value.trim() !== '') }}
              title={v.msg ?? s.desc}
              placeholder={placeholder}
            />
            <datalist id={dlId}>{s.opts!.map(o => <option key={o} value={o} />)}</datalist>
          </span>
        )
      }
      return (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={labelStyle}>{s.k}:</span>
          <input
            type={isNumeric ? 'number' : 'text'}
            value={value}
            onChange={e => onUpdate(blockId!, s.k, e.target.value)}
            style={{ ...inputBase, width: (s.w || (isNumeric ? 60 : 90)) + 'px', ...validBorder(v, value.trim() !== '') }}
            title={v.msg ?? s.desc}
            placeholder={placeholder}
            min={s.min}
            max={s.max}
            step={s.step}
          />
        </span>
      )
    }

    if (s.t === 'list') {
      const v = validateSeg(s, value)
      const dlId = `mlb-dl-${blockId}-${s.k}`
      return (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={labelStyle}>{s.k}:</span>
          <input
            list={s.opts && s.opts.length > 0 ? dlId : undefined}
            type="text"
            value={value}
            onChange={e => onUpdate(blockId!, s.k, e.target.value)}
            style={{ ...inputBase, width: 110, ...validBorder(v, value.trim() !== '') }}
            title={v.msg ?? s.desc}
            placeholder={s.format ?? '[1, 2, 3]'}
          />
          {s.opts && s.opts.length > 0 && (
            <datalist id={dlId}>{s.opts.map(o => <option key={o} value={o} />)}</datalist>
          )}
        </span>
      )
    }

    if (s.t === 'file') {
      const state = uploadState[s.k]
      const meta = fileMetaState[s.k]
      const hasUrl = fields?.[s.k]?.startsWith('https://')
      const fname = meta?.name ?? (hasUrl ? fields![s.k].split('/').pop() : null)
      const fsize = meta?.size

      if (state === 'uploading') return (
        <span key={i} style={fileCard}>
          <span style={fileNameStyle}>{meta?.name ?? 'Upload…'}</span>
          <span style={fileMeta}>⏳…</span>
        </span>
      )

      if (state === 'error') return (
        <span key={i} style={fileCard}>
          <span style={errStyle}>⚠ Échec</span>
          <span style={errStyle} onClick={() => inputRefs.current[s.k]?.click()}>Réessayer</span>
          <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(s.k, e)} />
        </span>
      )

      if (hasUrl && fname) return (
        <span key={i} style={fileCard}>
          <span style={fileNameStyle}>{fname}</span>
          {fsize && <span style={fileMeta}>{fmtSize(fsize)}</span>}
          <button style={removeBtn} onClick={() => { onUpdate(blockId!, s.k, ''); setFileMetaState(m => { const n = { ...m }; delete n[s.k]; return n }) }}>×</button>
          <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(s.k, e)} />
        </span>
      )

      return (
        <span key={i}>
          <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(s.k, e)} />
          <span onClick={() => inputRefs.current[s.k]?.click()} style={fileBtn} title={s.desc}>
            📁 CSV
          </span>
        </span>
      )
    }
    return null
  })
}
