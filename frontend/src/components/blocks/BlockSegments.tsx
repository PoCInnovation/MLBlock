import React, { memo, useRef, useState } from 'react'
import type { Segment } from '../../types/catalog'
import { uploadFile, supabase } from '../../services/supabase'
import { FileUp, Loader2, TriangleAlert } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { HStack } from '@astryxdesign/core'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { ACCEPT_BY_BLOCK, DEFAULT_ACCEPT, SAMPLE_CATEGORY_BY_BLOCK } from '../../utils/samples'
import SampleDataModal from '../ui/SampleDataModal'
import { HoverCard } from '@astryxdesign/core/HoverCard'

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
const fileCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, flexBasis: '100%',
  background: 'rgba(99,102,241,.15)', borderRadius: 8,
  padding: '4px 8px', fontSize: 12, fontWeight: 700,
}
const fileNameStyle: React.CSSProperties = {
  color: theme.color.file, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}
const fileMeta: React.CSSProperties = {
  color: theme.color.fileMeta, fontSize: 12, fontWeight: 600,
}
const fileBtn: React.CSSProperties = {
  background: 'rgba(99,102,241,.2)', border: '1px dashed rgba(99,102,241,.5)',
  borderRadius: theme.radius.sm, padding: '3px 8px', color: theme.color.fileBtn, fontWeight: 700,
  fontSize: 12, cursor: 'pointer', display: 'inline-block',
}
const removeBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: '50%', border: 'none',
  background: 'rgba(0,0,0,.2)', color: theme.color.file, fontSize: 12,
  lineHeight: '24px', cursor: 'pointer', padding: 0, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
}
const errStyle: React.CSSProperties = {
  color: theme.color.errorLight, fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/** Chemin de stockage unique pour un upload : horodaté pour éviter les collisions de noms. */
function uploadPath(userId: string | undefined, blockId: string): string {
  return `${userId ?? 'anonymous'}/${blockId}_${Date.now()}.csv`
}

/** HoverCard d'un paramètre : description + métadonnées (type, défaut, bornes). — Astryx deep seam */
function ParamInfo({ seg, children }: { seg: Exclude<Segment, { t: 'text' }>; children: React.ReactNode }) {
  const p = seg as unknown as {
    k: string
    t: string
    desc?: string
    def?: string
    min?: number
    max?: number
    step?: number
    odd?: boolean
    opts?: string[]
    format?: string
  }
  return (
    <HoverCard
      placement="above"
      content={
        <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Text type="label">{p.k}</Text>
          {p.desc && <Text type="body" color="secondary" style={{ fontSize: 12 }}>{p.desc}</Text>}
          <div style={{ fontSize: 12, color: 'var(--color-text-dim)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Text type="supporting">Type : {p.t}</Text>
            {p.def !== undefined && p.def !== '' && <Text type="supporting">Défaut : {p.def}</Text>}
            {p.min != null && <Text type="supporting">Min : {p.min}</Text>}
            {p.max != null && <Text type="supporting">Max : {p.max}</Text>}
            {p.step != null && <Text type="supporting">Pas : {p.step}</Text>}
            {p.odd === true && <Text type="supporting">Valeurs impaires uniquement</Text>}
            {p.opts && p.opts.length > 0 && <Text type="supporting">Choix : {p.opts.join(', ')}</Text>}
            {p.format && <Text type="supporting">Format : {p.format}</Text>}
          </div>
        </div>
      }
    >
      <span style={{ display: 'inline' }}>{children}</span>
    </HoverCard>
  )
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
  // box-shadow inset plutôt que border : ne prend aucune place, donc aucun
  // décalage du champ (texte/alignement) quand la valeur change d'état.
  return { boxShadow: `inset 0 0 0 1px ${v.ok ? theme.color.success : theme.color.error}` }
}

type BlockSegmentsProps = {
  segs: Segment[]
  fields?: Record<string, string>
  blockId?: string
  blockType?: string
  onUpdate?: (id: string, k: string, v: string) => void
  /** Autocomplete options per param key (e.g. target_column from the source CSV). */
  columnOptions?: Record<string, string[]>
  /** Première rangée de la grille commune (BlockNode) occupée par les params. */
  startRow?: number
}

const BlockSegments = memo(function BlockSegments({ segs, fields, blockId, blockType, onUpdate, columnOptions, startRow = 1 }: BlockSegmentsProps): React.ReactNode {
  const [uploadState, setUploadState] = useState<Record<string, 'uploading' | 'error'>>({})
  const [fileMetaState, setFileMetaState] = useState<Record<string, { name: string; size: number }>>({})
  const [sampleOpen, setSampleOpen] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFile = async (k: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUpdate || !blockId) return
    setUploadState(s => ({ ...s, [k]: 'uploading' }))
    setFileMetaState(s => ({ ...s, [k]: { name: file.name, size: file.size } }))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const path = uploadPath(user?.id, blockId)
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

  const activeSampleCat = blockType ? SAMPLE_CATEGORY_BY_BLOCK[blockType] : undefined

  // Cellules de la grille commune (portée par BlockNode : grid-cols-[1fr_auto_1fr]).
  // Chaque segment occupe une rangée (gridRow = startRow + i) : le label à droite
  // de sa colonne (collé au séparateur), le champ à gauche de la sienne. Le
  // séparateur central est rendu par BlockNode et traverse body + params.
  // Pas de gap-y : les cellules portent leur padding vertical, sinon le
  // séparateur serait segmenté aux gaps.
  const labelCell = (s: Exclude<Segment, { t: 'text' }>, row: number, divider: React.CSSProperties) => (
    <Text key={`l${row}`} type="label" color="secondary" style={{ gridColumn: 1, gridRow: row, justifySelf: 'end', alignSelf: 'center', padding: '3px 0', lineHeight: 1, ...divider }}>
      {s.k}:
    </Text>
  )
  const fieldCell = (row: number, children: React.ReactNode, divider: React.CSSProperties) => (
    <span key={`f${row}`} style={{ gridColumn: 3, gridRow: row, justifySelf: 'start', padding: '3px 0', ...divider }}>
      {children}
    </span>
  )
  // Ligne de séparation body/params : gérée par BlockNode (rangée dédiée
  // col-span-3). Un borderTop par cellule créait un escalier au croisement
  // avec le séparateur vertical (label et champ n'ont pas la même hauteur).
  const dividerStyle = {}

  // Le label du bloc (text seg ajouté par fetchCatalog) est déjà dans le
  // CardTitle — on ne le re-rend pas dans les params.
  const paramSegs = segs.filter(s => s.t !== 'text')

  return (
    <>
      {paramSegs.map((s, i) => {
        const row = startRow + i
        if (!onUpdate) {
          return (
            <>
              {labelCell(s, row, i === 0 ? dividerStyle : {})}
              {fieldCell(row, <Badge variant="neutral" label={s.def ?? ''} />, i === 0 ? dividerStyle : {})}
            </>
          )
        }

        const value = fields![s.k] ?? s.def ?? ''
        const cols = columnOptions?.[s.k]

        // Suggestions (datalist) pour un champ libre — choices docstring ou colonnes CSV
        if (cols || s.t === 'sug') {
          const opts = cols ?? (s.t === 'sug' ? s.opts : [])
          const dlId = `mlb-dl-${blockId}-${s.k}`
          const divider = i === 0 ? dividerStyle : {}
          return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <ParamInfo seg={s}><input
                  list={dlId}
                  type="text"
                  value={value}
                  onChange={e => onUpdate(blockId!, s.k, e.target.value)}
                  onFocus={() => useAppStore.getState().commitUndoPoint()}
                  style={{ ...inputBase, width: 110 }}
                  placeholder={cols ? 'colonne…' : undefined}
                /></ParamInfo>
              ), divider)}
              <datalist id={dlId}>{opts.map(o => <option key={o} value={o} />)}</datalist>
            </>
          )
        }

        if (s.t === 'sel') {
          const divider = i === 0 ? dividerStyle : {}
          return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <ParamInfo seg={s}><select
                  value={value}
                  onChange={e => onUpdate(blockId!, s.k, e.target.value)}
                  onFocus={() => useAppStore.getState().commitUndoPoint()}
                  style={selectBase}
                >
                  {s.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select></ParamInfo>
              ), divider)}
            </>
          )
        }

        if (s.t === 'bool') {
          const checked = value === 'true'
          const divider = i === 0 ? dividerStyle : {}
          return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <ParamInfo seg={s}><input
                  type="checkbox"
                  checked={checked}
                  onChange={e => onUpdate(blockId!, s.k, e.target.checked ? 'true' : 'false')}
                  onFocus={() => useAppStore.getState().commitUndoPoint()}
                  style={{ cursor: 'pointer', accentColor: '#2a211c' }}
                /></ParamInfo>
              ), divider)}
            </>
          )
        }

        if (s.t === 'num') {
          const v = validateSeg(s, value)
          const placeholder = s.min != null && s.max != null ? `entre ${s.min} et ${s.max}` : undefined
          const isNumeric = s.min != null || s.max != null || s.step != null
          // datalist incompatible avec type=number → text quand suggestions
          const useText = !!s.opts && s.opts.length > 0
          const divider = i === 0 ? dividerStyle : {}
          if (useText) {
            const dlId = `mlb-dl-${blockId}-${s.k}`
            const invalid = !v.ok && value.trim() !== ''
            return (
              <>
                {labelCell(s, row, divider)}
                {fieldCell(row, (
                  <ParamInfo seg={s}><span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <input
                      list={dlId}
                      type="text"
                      value={value}
                      onChange={e => onUpdate(blockId!, s.k, e.target.value)}
                      onFocus={() => useAppStore.getState().commitUndoPoint()}
                      style={{ ...inputBase, width: (s.w || 60) + 'px', ...validBorder(v, value.trim() !== '') }}
                      title={v.msg}
                      placeholder={placeholder}
                    />
                    {invalid && <Text role="alert" type="supporting" style={{ fontSize: 12, lineHeight: 1.3, color: theme.color.errorLight }}>{v.msg}</Text>}
                  </span></ParamInfo>
                ), divider)}
                <datalist id={dlId}>{s.opts!.map(o => <option key={o} value={o} />)}</datalist>
              </>
            )
          }
          const invalid = !v.ok && value.trim() !== ''
          return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <ParamInfo seg={s}><span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <input
                    type={isNumeric ? 'number' : 'text'}
                    onFocus={() => useAppStore.getState().commitUndoPoint()}
                    value={value}
                    onChange={e => onUpdate(blockId!, s.k, e.target.value)}
                    style={{ ...inputBase, width: (s.w || (isNumeric ? 60 : 90)) + 'px', ...validBorder(v, value.trim() !== '') }}
                    title={v.msg}
                    placeholder={placeholder}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                  />
                  {invalid && <Text role="alert" type="supporting" style={{ fontSize: 12, lineHeight: 1.3, color: theme.color.errorLight }}>{v.msg}</Text>}
                </span></ParamInfo>
              ), divider)}
            </>
          )
        }

        if (s.t === 'list') {
          const v = validateSeg(s, value)
          const dlId = `mlb-dl-${blockId}-${s.k}`
          const invalid = !v.ok && value.trim() !== ''
          const divider = i === 0 ? dividerStyle : {}
          return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <ParamInfo seg={s}><span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <input
                    list={s.opts && s.opts.length > 0 ? dlId : undefined}
                    type="text"
                    value={value}
                    onChange={e => onUpdate(blockId!, s.k, e.target.value)}
                    style={{ ...inputBase, width: 110, ...validBorder(v, value.trim() !== '') }}
                    title={v.msg}
                    placeholder={s.format ?? '[1, 2, 3]'}
                  />
                  {invalid && <Text role="alert" type="supporting" style={{ fontSize: 12, lineHeight: 1.3, color: theme.color.errorLight }}>{v.msg}</Text>}
                </span></ParamInfo>
              ), divider)}
              {s.opts && s.opts.length > 0 && (
                <datalist id={dlId}>{s.opts.map(o => <option key={o} value={o} />)}</datalist>
              )}
            </>
          )
        }

        if (s.t === 'file') {
          const sampleCat = blockType ? SAMPLE_CATEGORY_BY_BLOCK[blockType] : undefined
          const fileAccept = (blockType ? ACCEPT_BY_BLOCK[blockType] : undefined) ?? DEFAULT_ACCEPT
          const state = uploadState[s.k]
          const meta = fileMetaState[s.k]
          const hasUrl = fields?.[s.k]?.startsWith('https://')
          const fname = meta?.name ?? (hasUrl ? fields![s.k].split('/').pop() : null)
          const fsize = meta?.size
          const divider = i === 0 ? dividerStyle : {}

          if (state === 'uploading') return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <HStack gap={1} style={fileCard as never}>
                  <Text style={fileNameStyle}>{meta?.name ?? 'Upload…'}</Text>
                  <Text style={fileMeta}><Loader2 size="xsm" style={{ animation: 'mlbSpin .8s linear infinite' }} /></Text>
                </HStack>
              ), divider)}
            </>
          )

          if (state === 'error') return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <HStack gap={1} style={fileCard as never}>
                  <Text style={{ ...errStyle, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={TriangleAlert} size="xsm" /> Échec</Text>
                  <button type="button" style={{ ...errStyle, background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }} onClick={() => inputRefs.current[s.k]?.click()}>Réessayer</button>
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} style={{ display: 'none' }} onChange={e => handleFile(s.k, e)} />
                </HStack>
              ), divider)}
            </>
          )

          if (hasUrl && fname) return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <HStack gap={1} style={fileCard as never}>
                  <Text style={fileNameStyle}>{fname}</Text>
                  {fsize && <Text style={fileMeta}>{fmtSize(fsize)}</Text>}
                  <button style={removeBtn} onClick={() => { onUpdate(blockId!, s.k, ''); setFileMetaState(m => { const n = { ...m }; delete n[s.k]; return n }) }}>×</button>
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} style={{ display: 'none' }} onChange={e => handleFile(s.k, e)} />
                </HStack>
              ), divider)}
            </>
          )

          return (
            <>
              {labelCell(s, row, divider)}
              {fieldCell(row, (
                <span style={{ display: 'flex' }}>
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} style={{ display: 'none' }} onChange={e => handleFile(s.k, e)} />
                  <button type="button" onClick={() => sampleCat ? setSampleOpen(s.k) : inputRefs.current[s.k]?.click()} style={{ ...fileBtn, fontFamily: 'inherit' }} title={s.desc}>
                    <Icon icon={FileUp} size="xsm" /> {sampleCat ? 'Données' : 'CSV'}
                  </button>
                </span>
              ), divider)}
            </>
          )
        }
        return null
      })}
      {sampleOpen && activeSampleCat && (
        <SampleDataModal
          category={activeSampleCat}
          onPick={(url) => { onUpdate?.(blockId!, sampleOpen, url); setSampleOpen(null) }}
          onChooseFile={() => { setSampleOpen(null); setTimeout(() => inputRefs.current[sampleOpen]?.click(), 0) }}
          onClose={() => setSampleOpen(null)}
        />
      )}
    </>
  )
})

export default BlockSegments
