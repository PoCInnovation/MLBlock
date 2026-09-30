import React, { memo, useRef, useState } from 'react'
import type { Segment } from '../../types/catalog'
import { uploadFile, supabase } from '../../services/supabase'
import { FileUp, Loader2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import useAppStore from '../../store/useAppStore'
import { ACCEPT_BY_BLOCK, DEFAULT_ACCEPT, SAMPLE_CATEGORY_BY_BLOCK } from '../../utils/samples'
import SampleDataModal from '../ui/SampleDataModal'

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
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="inline">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="min-w-50 flex flex-col gap-1.5">
        <span className="font-semibold text-sm text-foreground">{p.k}</span>
        {p.desc && <span className="text-xs text-muted-foreground">{p.desc}</span>}
        <div className="text-xs text-muted-foreground flex flex-col gap-0.75">
          <span>Type : {p.t}</span>
          {p.def !== undefined && p.def !== '' && <span>Défaut : {p.def}</span>}
          {p.min != null && <span>Min : {p.min}</span>}
          {p.max != null && <span>Max : {p.max}</span>}
          {p.step != null && <span>Pas : {p.step}</span>}
          {p.odd === true && <span>Valeurs impaires uniquement</span>}
          {p.opts && p.opts.length > 0 && <span>Choix : {p.opts.join(', ')}</span>}
          {p.format && <span>Format : {p.format}</span>}
        </div>
      </HoverCardContent>
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


  const activeSampleCat = blockType ? SAMPLE_CATEGORY_BY_BLOCK[blockType] : undefined

  // Cellules de la grille commune (portée par BlockNode : grid-cols-[1fr_auto_1fr]).
  // Chaque segment occupe une rangée (gridRow = startRow + i) : le label à droite
  // de sa colonne (collé au séparateur), le champ à gauche de la sienne. Le
  // séparateur central est rendu par BlockNode et traverse body + params.
  // Pas de gap-y : les cellules portent leur padding vertical, sinon le
  // séparateur serait segmenté aux gaps.
  const labelCell = (s: Exclude<Segment, { t: 'text' }>, row: number) => (
    <span key={`l${row}`} className="col-start-1 justify-self-end self-center py-0.75 leading-none text-xs font-semibold text-muted-foreground" style={{ gridRow: row }}>
      {s.k}:
    </span>
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
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row, <Badge variant="outline">{s.def ?? ''}</Badge>)}
            </React.Fragment>
          )
        }

        const value = fields![s.k] ?? s.def ?? ''
        const cols = columnOptions?.[s.k]

        // Suggestions (datalist) pour un champ libre — choices docstring ou colonnes CSV
        if (cols || s.t === 'sug') {
          const opts = cols ?? (s.t === 'sug' ? s.opts : [])
          const dlId = `mlb-dl-${blockId}-${s.k}`
          return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdate(blockId!, s.k, e.target.value)}
                    onFocus={() => useAppStore.getState().commitUndoPoint()}
                    placeholder={cols ? 'colonne…' : undefined}
                    className="h-7 w-[110px] text-xs px-2"
                    list={dlId}
                  />
                </ParamInfo>
              )}
              <datalist id={dlId}>{opts.map(o => <option key={o} value={o} />)}</datalist>
            </React.Fragment>
          )
        }

        if (s.t === 'sel') {
          return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <Select value={value} onValueChange={(v) => { useAppStore.getState().commitUndoPoint(); onUpdate(blockId!, s.k, v) }}>
                    <SelectTrigger size="sm" className="h-7 w-[130px] text-xs">
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      {s.opts?.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ParamInfo>
              )}
            </React.Fragment>
          )
        }

        if (s.t === 'bool') {
          const checked = value === 'true'
          return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <div className="flex items-center h-7">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        useAppStore.getState().commitUndoPoint()
                        onUpdate(blockId!, s.k, c ? 'true' : 'false')
                      }}
                    />
                  </div>
                </ParamInfo>
              )}
            </React.Fragment>
          )
        }
        if (s.t === 'num') {
          const v = validateSeg(s, value)
          const placeholder = s.min != null && s.max != null ? `entre ${s.min} et ${s.max}` : undefined
          const useText = !!s.opts && s.opts.length > 0
          if (useText) {
            const dlId = `mlb-dl-${blockId}-${s.k}`
            return (
              <React.Fragment key={row}>
                {labelCell(s, row)}
                {fieldCell(row,
                  <ParamInfo seg={s}>
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => onUpdate(blockId!, s.k, e.target.value)}
                      onFocus={() => useAppStore.getState().commitUndoPoint()}
                      placeholder={placeholder}
                      className={`h-7 w-[${s.w ?? 90}px] text-xs px-2 ${!v.ok && value.trim() !== '' ? 'border-destructive' : ''}`}
                      list={dlId}
                    />
                  </ParamInfo>
                )}
                <datalist id={dlId}>{s.opts!.map(o => <option key={o} value={o} />)}</datalist>
              </React.Fragment>
            )
          }
          return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => {
                      useAppStore.getState().commitUndoPoint()
                      onUpdate(blockId!, s.k, e.target.value)
                    }}
                    min={s.min ?? undefined}
                    max={s.max ?? undefined}
                    step={s.step ?? undefined}
                    placeholder={placeholder}
                    className={`h-7 w-[${s.w ?? 90}px] text-xs px-2 ${!v.ok ? 'border-destructive' : ''}`}
                  />
                </ParamInfo>
              )}
            </React.Fragment>
          )
        }

        if (s.t === 'list') {
          const v = validateSeg(s, value)
          const dlId = `mlb-dl-${blockId}-${s.k}`
          return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <ParamInfo seg={s}>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdate(blockId!, s.k, e.target.value)}
                    onFocus={() => useAppStore.getState().commitUndoPoint()}
                    placeholder={s.format ?? '[1, 2, 3]'}
                    className={`h-7 w-[110px] text-xs px-2 ${!v.ok && value.trim() !== '' ? 'border-destructive' : ''}`}
                    {...(s.opts && s.opts.length > 0 ? { list: dlId } : {})}
                  />
                </ParamInfo>
              )}
              {s.opts && s.opts.length > 0 && (
                <datalist id={dlId}>{s.opts.map(o => <option key={o} value={o} />)}</datalist>
              )}
            </React.Fragment>
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
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <div className={FILE_CARD}>
                  <span className={FILE_NAME}>{meta?.name ?? 'Upload…'}</span>
                  <span className={FILE_META}><Loader2 className="size-3 animate-spin" /></span>
                </div>
              )}
            </React.Fragment>
          )

          if (state === 'error') return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <div className={FILE_CARD}>
                  <span className={`${ERR_CLS} inline-flex items-center gap-1`}><TriangleAlert className="size-3" /> Échec</span>
                  <button type="button" className={`${ERR_CLS} bg-transparent border-none p-0 font-body`} onClick={() => inputRefs.current[s.k]?.click()}>Réessayer</button>
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} className="hidden" onChange={e => handleFile(s.k, e)} />
                </div>
              )}
            </React.Fragment>
          )

          if (hasUrl && fname) return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <div className={FILE_CARD}>
                  <span className={FILE_NAME}>{fname}</span>
                  {fsize && <span className={FILE_META}>{fmtSize(fsize)}</span>}
                  <button className={REMOVE_BTN} onClick={() => { onUpdate(blockId!, s.k, ''); setFileMetaState(m => { const n = { ...m }; delete n[s.k]; return n }) }}>×</button>
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} className="hidden" onChange={e => handleFile(s.k, e)} />
                </div>
              )}
            </React.Fragment>
          )

          if (sampleCat) {
            return (
              <React.Fragment key={row}>
                {labelCell(s, row)}
                {fieldCell(row,
                  <span className="flex">
                    <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} className="hidden" onChange={e => handleFile(s.k, e)} />
                    <button type="button" onClick={() => setSampleOpen(s.k)} className={`${FILE_BTN} font-body`} title={s.desc}>
                      <FileUp className="size-3 inline-block mr-1" /> Données
                    </button>
                  </span>
                )}
              </React.Fragment>
            )
          }

          return (
            <React.Fragment key={row}>
              {labelCell(s, row)}
              {fieldCell(row,
                <span className="flex">
                  <input ref={el => { inputRefs.current[s.k] = el }} type="file" accept={fileAccept} className="hidden" onChange={e => handleFile(s.k, e)} />
                  <button type="button" onClick={() => inputRefs.current[s.k]?.click()} className={`${FILE_BTN} font-body`} title={s.desc}>
                    <FileUp className="size-3 inline-block mr-1" /> CSV
                  </button>
                </span>
              )}
            </React.Fragment>
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
