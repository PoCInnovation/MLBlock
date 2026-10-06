import React, { memo, useRef, useState } from 'react'
import type { Segment } from '../../types/catalog'
import { uploadFile, supabase } from '../../services/supabase'
import { FileUp, Loader2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useAppStore from '../../store/useAppStore'
import { describeParam } from '../../utils/paramHints'
import { ACCEPT_BY_BLOCK, DEFAULT_ACCEPT, SAMPLE_CATEGORY_BY_BLOCK } from '../../utils/samples'
import SampleDataModal from '../ui/SampleDataModal'

const FILE_CARD = 'flex items-center gap-2 rounded-lg bg-file/15 px-3 py-2 text-xs font-bold'
const FILE_BTN = 'bg-file/20 border border-dashed border-file/50 rounded-sm px-3 py-1 text-file-btn font-bold text-xs cursor-pointer inline-flex items-center gap-1'
const REMOVE_BTN = 'w-6 h-6 rounded-full border-none bg-black/20 text-file text-xs cursor-pointer p-0 inline-flex items-center justify-center'

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/** Chemin de stockage unique pour un upload : horodaté pour éviter les collisions de noms. */
function uploadPath(userId: string | undefined, blockId: string): string {
  return `${userId ?? 'anonymous'}/${blockId}_${Date.now()}.csv`
}

type BlockSegmentsProps = {
  segs: Segment[]
  fields?: Record<string, string>
  blockId?: string
  blockType?: string
  onUpdate?: (id: string, k: string, v: string) => void
  /** Autocomplete options per param key (e.g. target_column from the source CSV). */
  columnOptions?: Record<string, string[]>
}

/** Libellé lisible d'une clé de paramètre : target_column → target column. */
function humanKey(k: string): string {
  return k.replace(/_/g, ' ')
}

const LABEL_CLS = 'text-xs font-extrabold uppercase tracking-wide text-foreground'
const DESC_CLS = 'text-xs text-muted-foreground leading-snug'
const HINT_CLS = 'text-[11px] text-muted-foreground/90 font-semibold'
const ERR_CLS = 'text-xs font-bold text-destructive'

/**
 * Paramètres d'un bloc — liste verticale aérée : libellé, description backend,
 * champ pleine largeur, contrainte (« entre 1 et 100 ») et erreur live. Les
 * suggestions sont des chips cliquables plutôt qu'un datalist invisible.
 */
const BlockSegments = memo(function BlockSegments({
  segs,
  fields,
  blockId,
  blockType,
  onUpdate,
  columnOptions,
}: BlockSegmentsProps): React.ReactNode {
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
  const paramSegs = segs.filter(s => s.t !== 'text')

  const set = (k: string, v: string) => {
    if (!onUpdate || !blockId) return
    useAppStore.getState().commitUndoPoint()
    onUpdate(blockId, k, v)
  }

  /** Chips de suggestion : un tap remplit le champ (au lieu d'un datalist caché). */
  const suggestions = (k: string, opts: string[], current: string) =>
    opts.length > 0 ? (
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/80 self-center">
          Suggestions
        </span>
        {opts.slice(0, 8).map(o => (
          <button
            key={o}
            type="button"
            onClick={() => set(k, o)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
              o === current
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-foreground border-border hover:bg-muted'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    ) : null

  const row = (s: Exclude<Segment, { t: 'text' }>, field: React.ReactNode) => {
    const value = fields?.[s.k] ?? s.def ?? ''
    const { description, hint, invalid } = describeParam(s, value)
    return (
      <div key={s.k} className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/15 p-3.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={LABEL_CLS}>{humanKey(s.k)}</span>
            {s.t !== 'bool' && s.t !== 'file' && (
              <span className="text-[11px] font-bold text-muted-foreground/70">{s.t}</span>
            )}
          </div>
          {description && <p className={DESC_CLS}>{description}</p>}
        </div>
        {field}
        {invalid
          ? <span className={ERR_CLS}>{invalid}</span>
          : hint ? <span className={HINT_CLS}>{hint}</span> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {paramSegs.map(s => {
        const value = fields?.[s.k] ?? s.def ?? ''
        const readOnly = !onUpdate || !blockId

        if (s.t === 'sel') {
          return row(
            s,
            readOnly
              ? <Badge variant="outline" className="w-fit">{value || '—'}</Badge>
              : (
                <Select value={value} onValueChange={(v) => set(s.k, v)}>
                  <SelectTrigger size="sm" className="h-9 w-full text-sm">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {s.opts?.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
          )
        }

        if (s.t === 'sug') {
          return row(
            s,
            <>
              <Input
                type="text"
                value={value}
                onChange={e => set(s.k, e.target.value)}
                placeholder="Valeur libre…"
                className="h-9 text-sm"
                disabled={readOnly}
              />
              {suggestions(s.k, columnOptions?.[s.k] ?? s.opts ?? [], value)}
            </>,
          )
        }

        if (s.t === 'bool') {
          return row(
            s,
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={value === 'true'}
                disabled={readOnly}
                onCheckedChange={c => set(s.k, c ? 'true' : 'false')}
              />
              <span className="text-sm text-foreground">{value === 'true' ? 'Activé' : 'Désactivé'}</span>
            </label>,
          )
        }

        if (s.t === 'num') {
          const { invalid } = describeParam(s, value)
          return row(
            s,
            <>
              <Input
                type="number"
                value={value}
                onChange={e => set(s.k, e.target.value)}
                min={s.min ?? undefined}
                max={s.max ?? undefined}
                step={s.step ?? undefined}
                className={`h-9 text-sm ${invalid ? 'border-destructive' : ''}`}
                disabled={readOnly}
              />
              {suggestions(s.k, s.opts ?? [], value)}
            </>,
          )
        }

        if (s.t === 'list') {
          const { invalid } = describeParam(s, value)
          return row(
            s,
            <Input
              type="text"
              value={value}
              onChange={e => set(s.k, e.target.value)}
              placeholder="[1, 2, 3]"
              className={`h-9 font-mono text-sm ${invalid ? 'border-destructive' : ''}`}
              disabled={readOnly}
            />,
          )
        }

        if (s.t === 'file') {
          const sampleCat = blockType ? SAMPLE_CATEGORY_BY_BLOCK[blockType] : undefined
          const fileAccept = (blockType ? ACCEPT_BY_BLOCK[blockType] : undefined) ?? DEFAULT_ACCEPT
          const state = uploadState[s.k]
          const meta = fileMetaState[s.k]
          const hasUrl = fields?.[s.k]?.startsWith('https://')
          const fname = meta?.name ?? (hasUrl ? fields![s.k].split('/').pop() : null)
          const hidden = (
            <input
              ref={el => { inputRefs.current[s.k] = el }}
              type="file"
              accept={fileAccept}
              className="hidden"
              onChange={e => handleFile(s.k, e)}
            />
          )

          if (state === 'uploading') {
            return row(s, <div className={FILE_CARD}><span className="truncate">{meta?.name ?? 'Upload…'}</span><Loader2 className="size-3.5 animate-spin shrink-0" />{hidden}</div>)
          }
          if (state === 'error') {
            return row(s, (
              <div className={FILE_CARD}>
                <span className="text-error-light inline-flex items-center gap-1"><TriangleAlert className="size-3.5" /> Échec</span>
                <button type="button" className="bg-transparent border-none p-0 font-bold text-error-light cursor-pointer" onClick={() => inputRefs.current[s.k]?.click()}>Réessayer</button>
                {hidden}
              </div>
            ))
          }
          if (hasUrl && fname) {
            return row(s, (
              <div className={FILE_CARD}>
                <span className="truncate flex-1">{fname}</span>
                {meta && <span className="text-file-meta shrink-0">{fmtSize(meta.size)}</span>}
                <button
                  className={REMOVE_BTN}
                  onClick={() => {
                    set(s.k, '')
                    setFileMetaState(m => { const n = { ...m }; delete n[s.k]; return n })
                  }}
                >×</button>
                {hidden}
              </div>
            ))
          }
          return row(s, (
            <span className="flex gap-2">
              {sampleCat && (
                <button type="button" onClick={() => setSampleOpen(s.k)} className={FILE_BTN}>
                  <FileUp className="size-3.5" /> Données d’exemple
                </button>
              )}
              <button type="button" onClick={() => inputRefs.current[s.k]?.click()} className={FILE_BTN}>
                <FileUp className="size-3.5" /> Choisir un fichier
              </button>
              {hidden}
            </span>
          ))
        }

        return null
      })}

      {sampleOpen && activeSampleCat && (
        <SampleDataModal
          category={activeSampleCat}
          onPick={(url) => { set(sampleOpen, url); setSampleOpen(null) }}
          onChooseFile={() => { const k = sampleOpen; setSampleOpen(null); setTimeout(() => inputRefs.current[k]?.click(), 0) }}
          onClose={() => setSampleOpen(null)}
        />
      )}
    </div>
  )
})

export default BlockSegments