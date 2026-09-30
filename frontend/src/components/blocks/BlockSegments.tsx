import React, { memo, useRef, useState } from 'react'
import type { Segment } from '../../types/catalog'
import { uploadFile, supabase } from '../../services/supabase'
import { FileUp, Loader2, TriangleAlert } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { HStack } from '@astryxdesign/core'
import useAppStore from '../../store/useAppStore'
import { ACCEPT_BY_BLOCK, DEFAULT_ACCEPT, SAMPLE_CATEGORY_BY_BLOCK } from '../../utils/samples'
import SampleDataModal from '../ui/SampleDataModal'
import { HoverCard } from '@astryxdesign/core/HoverCard'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { TextInput } from '@astryxdesign/core/TextInput'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Selector } from '@astryxdesign/core/Selector'
import { FileInput } from '@astryxdesign/core/FileInput'

const FILE_CARD = 'flex items-center gap-1.5 basis-full bg-file/15 rounded-lg px-2 py-1 text-xs font-bold'
const FILE_NAME = 'text-file max-w-25 overflow-hidden text-ellipsis whitespace-nowrap'
const FILE_META = 'text-file-meta text-xs font-semibold'
const FILE_BTN = 'bg-file/20 border border-dashed border-file/50 rounded-sm px-2 py-0.5 text-file-btn font-bold text-xs cursor-pointer inline-block'
const REMOVE_BTN = 'w-6 h-6 rounded-full border-none bg-black/20 text-file text-xs leading-6 cursor-pointer p-0 inline-flex items-center justify-center'
const ERR_CLS = 'text-error-light text-xs font-semibold cursor-pointer'


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
        <div className="min-w-50 flex flex-col gap-1.5">
          <Text type="label">{p.k}</Text>
          {p.desc && <Text type="body" color="secondary" className="text-xs">{p.desc}</Text>}
          <div className="text-xs text-text-dim flex flex-col gap-0.75">
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
      <span className="inline">{children}</span>
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

  const handleFilePicked = async (k: string, files: File | File[] | null) => {
    const file = Array.isArray(files) ? files[0] : files
    if (!file || !onUpdate || !blockId) return
    setUploadState(s => ({ ...s, [k]: 'uploading' }))
    setFileMetaState(s => ({ ...s, [k]: { name: file.name, size: file.size } }))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const path = uploadPath(user?.id, blockId)
      const url = await uploadFile(file, 'user-uploads', path)
      if (url) {
        onUpdate(blockId, k, url)
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
  const labelCell = (s: Exclude<Segment, { t: 'text' }>, row: number) => (
    <Text key={`l${row}`} type="label" color="secondary" className="col-start-1 justify-self-end self-center py-0.75 leading-none" style={{ gridRow: row }}>
      {s.k}:
    </Text>
  )
  const fieldCell = (row: number, children: React.ReactNode) => (
    <span key={`f${row}`} className="col-start-3 justify-self-start py-0.75" style={{ gridRow: row }}>
      {children}
    </span>
  )
  // Ligne de séparation body/params : gérée par BlockNode (rangée dédiée
  // col-span-3). Un borderTop par cellule créait un escalier au croisement
  // avec le séparateur vertical (label et champ n'ont pas la même hauteur).
  
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
              {labelCell(s, row)}
              {fieldCell(row, <Badge variant="neutral" label={s.def ?? ''} />)}
            </>
          )
        }

        const value = fields![s.k] ?? s.def ?? ''
        const cols = columnOptions?.[s.k]

        // Suggestions (datalist) pour un champ libre — choices docstring ou colonnes CSV
        if (cols || s.t === 'sug') {
          const opts = cols ?? (s.t === 'sug' ? s.opts : [])
          const dlId = `mlb-dl-${blockId}-${s.k}`
                    return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <TextInput
                    label={s.k}
                    isLabelHidden
                    value={value}
                    onChange={(v) => onUpdate(blockId!, s.k, v)}
                    onFocus={() => useAppStore.getState().commitUndoPoint()}
                    placeholder={cols ? 'colonne…' : undefined}
                    width={110}
                    size="sm"
                    {...({ list: dlId } as unknown as Record<string, unknown>)}
                  />
                </ParamInfo>
              )}
              <datalist id={dlId}>{opts.map(o => <option key={o} value={o} />)}</datalist>
            </>
          )
        }

        if (s.t === 'sel') {
                    return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <Selector
                    label={s.k}
                    isLabelHidden
                    value={value}
                    onChange={(v) => onUpdate(blockId!, s.k, v)}
                    options={s.opts}
                    size="sm"
                    width={130}
                    {...({ onFocus: () => useAppStore.getState().commitUndoPoint() } as unknown as Record<string, unknown>)}
                  />
                </ParamInfo>
              )}
            </>
          )
        }

        if (s.t === 'bool') {
          const checked = value === 'true'
                    return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <CheckboxInput
                    label={s.k}
                    isLabelHidden
                    value={checked}
                    onChange={(c) => onUpdate(blockId!, s.k, c ? 'true' : 'false')}
                    onFocus={() => useAppStore.getState().commitUndoPoint()}
                    size="sm"
                  />
                </ParamInfo>
              )}
            </>
          )
        }

        if (s.t === 'num') {
          const v = validateSeg(s, value)
          const placeholder = s.min != null && s.max != null ? `entre ${s.min} et ${s.max}` : undefined
          // datalist incompatible avec NumberInput → TextInput quand suggestions
          const useText = !!s.opts && s.opts.length > 0
                    if (useText) {
            const dlId = `mlb-dl-${blockId}-${s.k}`
            return (
              <>
                {labelCell(s, row)}
                {fieldCell(row,
                  <ParamInfo seg={s}>
                    <TextInput
                      label={s.k}
                      isLabelHidden
                      value={value}
                      onChange={(val) => onUpdate(blockId!, s.k, val)}
                      onFocus={() => useAppStore.getState().commitUndoPoint()}
                      placeholder={placeholder}
                      status={!v.ok && value.trim() !== '' ? { type: 'error', message: v.msg } : undefined}
                      width={s.w ?? 90}
                      size="sm"
                      {...({ list: dlId } as unknown as Record<string, unknown>)}
                    />
                  </ParamInfo>
                )}
                <datalist id={dlId}>{s.opts!.map(o => <option key={o} value={o} />)}</datalist>
              </>
            )
          }
          return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <NumberInput
                    label={s.k}
                    isLabelHidden
                    value={value.trim() === '' || Number.isNaN(Number(value)) ? null : Number(value) ?? null}
                    onChange={(val: number | null) => onUpdate(blockId!, s.k, val == null ? '' : String(val))}
                    onFocus={() => useAppStore.getState().commitUndoPoint()}
                    min={s.min ?? null}
                    max={s.max ?? null}
                    step={s.step ?? null}
                    status={!v.ok ? { type: 'error', message: v.msg } : undefined}
                    placeholder={placeholder}
                    isWheelEnabled={false}
                    hasClear
                    width={s.w ?? 90}
                    size="sm"
                  />
                </ParamInfo>
              )}
            </>
          )
        }

        if (s.t === 'list') {
          const v = validateSeg(s, value)
          const dlId = `mlb-dl-${blockId}-${s.k}`
                    return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <TextInput
                    label={s.k}
                    isLabelHidden
                    value={value}
                    onChange={(val) => onUpdate(blockId!, s.k, val)}
                    onFocus={() => useAppStore.getState().commitUndoPoint()}
                    placeholder={s.format ?? '[1, 2, 3]'}
                    status={!v.ok && value.trim() !== '' ? { type: 'error', message: v.msg } : undefined}
                    width={110}
                    size="sm"
                    {...(s.opts && s.opts.length > 0 ? ({ list: dlId } as unknown as Record<string, unknown>) : {})}
                  />
                </ParamInfo>
              )}
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
          
          if (state === 'uploading') return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <HStack gap={1} className={FILE_CARD}>
                  <Text className={FILE_NAME}>{meta?.name ?? 'Upload…'}</Text>
                  <Text className={FILE_META}><Icon icon={Loader2} size="xsm" className="animate-spin" /></Text>
                </HStack>
              )}
            </>
          )

          if (state === 'error') return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <HStack gap={1} className={FILE_CARD}>
                  <Text className={`${ERR_CLS} inline-flex items-center gap-1`}><Icon icon={TriangleAlert} size="xsm" /> Échec</Text>
                  <button type="button" className={`${ERR_CLS} bg-transparent border-none p-0 font-body`} onClick={() => inputRefs.current[s.k]?.click()}>Réessayer</button>
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} className="hidden" onChange={e => handleFile(s.k, e)} />
                </HStack>
              )}
            </>
          )

          if (hasUrl && fname) return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <HStack gap={1} className={FILE_CARD}>
                  <Text className={FILE_NAME}>{fname}</Text>
                  {fsize && <Text className={FILE_META}>{fmtSize(fsize)}</Text>}
                  <button className={REMOVE_BTN} onClick={() => { onUpdate(blockId!, s.k, ''); setFileMetaState(m => { const n = { ...m }; delete n[s.k]; return n }) }}>×</button>
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} className="hidden" onChange={e => handleFile(s.k, e)} />
                </HStack>
              )}
            </>
          )

          // Sample-enabled blocks keep the sample picker button; otherwise use Astryx FileInput
          if (sampleCat) {
            return (
              <>
                {labelCell(s, row)}
                {fieldCell(row,
                  <span className="flex">
                    <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} className="hidden" onChange={e => handleFile(s.k, e)} />
                    <button type="button" onClick={() => setSampleOpen(s.k)} className={`${FILE_BTN} font-body`} title={s.desc}>
                      <Icon icon={FileUp} size="xsm" /> Données
                    </button>
                  </span>
                )}
              </>
            )
          }

          return (
            <>
              {labelCell(s, row)}
              {fieldCell(row,
                <FileInput
                  label={s.k}
                  isLabelHidden
                  value={null}
                  onChange={(files) => handleFilePicked(s.k, files)}
                  accept={fileAccept}
                  placeholder="CSV"
                  width={140}
                />
              )}
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
