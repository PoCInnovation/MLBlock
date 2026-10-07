import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { Segment } from '../../types/catalog'
import axios from 'axios'
import { FileUp, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useAppStore from '../../store/useAppStore'
import { describeParam } from '../../utils/paramHints'
import {
  acceptsFile,
  confirmUpload,
  deleteFile,
  isFileAssetExpired,
  listFiles,
  previewFile,
  requestUpload,
  type FileAssetItem,
  type FilePreview,
} from '../../api/client'
import { DEFAULT_ACCEPT, SAMPLE_CATEGORY_BY_BLOCK, kindOf } from '../../utils/samples'
import SampleDataModal from '../ui/SampleDataModal'

const FILE_CARD = 'flex items-center gap-2 rounded-lg bg-file/15 px-3 py-2 text-xs font-bold'
const FILE_BTN = 'bg-file/20 border border-dashed border-file/50 rounded-sm px-3 py-1 min-h-11 text-file-btn font-bold text-xs cursor-pointer inline-flex items-center gap-1'
const REMOVE_BTN = 'w-11 h-11 rounded-full border-none bg-black/20 text-file text-xs cursor-pointer p-0 inline-flex items-center justify-center shrink-0'

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/** Message FR d'un échec d'envoi : détail serveur d'abord, jamais de code HTTP brut. */
function fileErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const detail = (e.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (!e.response) return 'Envoi interrompu — vérifie ta connexion puis réessaie'
  }
  return "Échec de l'envoi — réessaie dans un moment"
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
  const [progressState, setProgressState] = useState<Record<string, number>>({})
  const [fileErrorState, setFileErrorState] = useState<Record<string, string>>({})
  const [previewState, setPreviewState] = useState<Record<string, { kind: string } & FilePreview>>({})
  const [dragState, setDragState] = useState<Record<string, boolean>>({})
  const [gallery, setGallery] = useState<{
    open: string | null; items: FileAssetItem[]; loading: boolean; loaded: boolean; error: string | null
  }>({ open: null, items: [], loading: false, loaded: false, error: null })
  const [sampleOpen, setSampleOpen] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const abortRefs = useRef<Record<string, AbortController>>({})
  // Garde de fetch galerie : un flag posé DANS un updater setState ne serait lu
  // qu'après le batch React — la ref reste synchrone.
  const galleryOkRef = useRef(false)

  const clearUploadFlag = (k: string) => {
    setUploadState(s => {
      const next = { ...s }
      delete next[k]
      return next
    })
  }

  /** request-upload → PUT direct signé → confirm : les octets ne transitent pas par le backend. */
  const handleFile = async (k: string, file: File, accept: string) => {
    if (!onUpdate || !blockId) return
    if (!acceptsFile(accept, file.name)) {
      setUploadState(s => ({ ...s, [k]: 'error' }))
      setFileErrorState(s => ({ ...s, [k]: `Ce bloc attend ${accept} — choisis un fichier compatible` }))
      return
    }
    if (file.size <= 0) {
      setUploadState(s => ({ ...s, [k]: 'error' }))
      setFileErrorState(s => ({ ...s, [k]: 'Fichier vide — choisis un fichier non vide' }))
      return
    }
    const ctrl = new AbortController()
    abortRefs.current[k] = ctrl
    let assetId: string | null = null
    setUploadState(s => ({ ...s, [k]: 'uploading' }))
    setProgressState(s => ({ ...s, [k]: 0 }))
    setFileMetaState(s => ({ ...s, [k]: { name: file.name, size: file.size } }))
    setFileErrorState(s => {
      const next = { ...s }
      delete next[k]
      return next
    })
    try {
      const req = await requestUpload({
        name: file.name,
        size_bytes: file.size,
        mime: file.type || 'application/octet-stream',
        ...(blockType ? { block_type: blockType } : {}),
      })
      assetId = req.id
      await axios.put(req.signed_url, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        signal: ctrl.signal,
        onUploadProgress: e => {
          const total = e.total ?? 0
          if (total > 0) setProgressState(s => ({ ...s, [k]: Math.round((e.loaded / total) * 100) }))
        },
      })
      const done = await confirmUpload(req.id)
      onUpdate(blockId, k, done.public_url)
      setPreviewState(s => ({ ...s, [k]: { kind: done.kind, ...done.preview } }))
      galleryOkRef.current = false
      setGallery(g => ({ ...g, loaded: false }))
      clearUploadFlag(k)
      setProgressState(s => {
        const next = { ...s }
        delete next[k]
        return next
      })
    } catch (e) {
      if (ctrl.signal.aborted) {
        clearUploadFlag(k)
        // La réservation pending ne doit pas bloquer le quota 30 j : on la supprime.
        if (assetId) void deleteFile(assetId).catch(() => {})
      } else {
        setUploadState(s => ({ ...s, [k]: 'error' }))
        setFileErrorState(s => ({ ...s, [k]: fileErrorMessage(e) }))
      }
    } finally {
      delete abortRefs.current[k]
    }
  }

  const cancelUpload = (k: string) => abortRefs.current[k]?.abort()

  const ensureGallery = useCallback(async () => {
    if (galleryOkRef.current) return
    galleryOkRef.current = true
    setGallery(g => ({ ...g, loading: true, error: null }))
    try {
      const items = await listFiles()
      setGallery(g => ({ ...g, items, loaded: true, loading: false }))
    } catch (e) {
      galleryOkRef.current = false
      setGallery(g => ({ ...g, loading: false, error: fileErrorMessage(e) }))
    }
  }, [])

  const toggleGallery = (k: string) => {
    setGallery(g => ({ ...g, open: g.open === k ? null : k }))
    void ensureGallery()
  }

  const applyGalleryFile = async (k: string, item: FileAssetItem) => {
    if (!onUpdate || !blockId) return
    useAppStore.getState().commitUndoPoint()
    onUpdate(blockId, k, item.public_url)
    setFileMetaState(s => ({ ...s, [k]: { name: item.name, size: item.size_bytes } }))
    try {
      const preview = await previewFile(item.id)
      setPreviewState(s => ({ ...s, [k]: { kind: item.kind, rows: preview.rows, url: preview.url } }))
    } catch {
      // Aperçu indisponible : le fichier reste utilisable.
    }
    setGallery(g => ({ ...g, open: null }))
  }

  const removeGalleryFile = async (id: string) => {
    try {
      await deleteFile(id)
      setGallery(g => ({ ...g, items: g.items.filter(i => i.id !== id) }))
    } catch (e) {
      setGallery(g => ({ ...g, error: fileErrorMessage(e) }))
    }
  }

  const activeSampleCat = blockType ? SAMPLE_CATEGORY_BY_BLOCK[blockType] : undefined
  const paramSegs = segs.filter(s => s.t !== 'text')
  const needsGalleryCheck = paramSegs.some(
    s => s.t === 'file' && (fields?.[s.k] ?? '').startsWith('https://'),
  )

  // Badge « expiré » : charge la galerie quand un param fichier pointe déjà une URL.
  useEffect(() => {
    if (needsGalleryCheck) void ensureGallery()
  }, [needsGalleryCheck, ensureGallery])

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
          const fileAccept = s.accept ?? DEFAULT_ACCEPT
          const state = uploadState[s.k]
          const meta = fileMetaState[s.k]
          const progress = progressState[s.k] ?? 0
          const errorMsg = fileErrorState[s.k]
          const preview = previewState[s.k]
          const fileValue = fields?.[s.k] ?? ''
          const hasUrl = fileValue.startsWith('https://')
          const expired = hasUrl && isFileAssetExpired(fileValue, gallery.items, gallery.loaded)
          const fname = meta?.name ?? (hasUrl ? fileValue.split('/').pop() : null)
          const kind = preview?.kind ?? kindOf(fileAccept)
          const hidden = (
            <input
              ref={el => { inputRefs.current[s.k] = el }}
              type="file"
              accept={fileAccept}
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void handleFile(s.k, f, fileAccept)
              }}
            />
          )
          const pickFile = (f: File | undefined) => {
            if (f) void handleFile(s.k, f, fileAccept)
          }
          const previewBlock = preview && (kind === 'csv' || kind === 'text') && preview.rows?.length ? (
            <div className="flex flex-col gap-0.5 rounded-lg bg-background/60 p-2 font-mono text-[11px] leading-snug max-h-28 overflow-hidden">
              {preview.rows.slice(0, 5).map((r, i) => (
                <span key={i} className="truncate text-muted-foreground">{r.join(' · ')}</span>
              ))}
            </div>
          ) : preview && kind === 'image' && preview.url ? (
            <img src={preview.url} alt="" className="max-h-28 w-fit rounded-lg border border-border/60" />
          ) : null
          const galleryBlock = gallery.open === s.k ? (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 p-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/80">
                Mes fichiers
              </span>
              {gallery.loading && <span className={HINT_CLS}>Chargement…</span>}
              {gallery.error && <span className={ERR_CLS}>{gallery.error}</span>}
              {!gallery.loading && !gallery.error && gallery.items.length === 0 && (
                <span className={HINT_CLS}>Aucun fichier — dépose ton premier ci-dessus.</span>
              )}
              {gallery.items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  <span className="truncate flex-1 font-bold">{item.name}</span>
                  <span className="text-file-meta shrink-0">{fmtSize(item.size_bytes)}</span>
                  <button type="button" className={FILE_BTN} onClick={() => void applyGalleryFile(s.k, item)}>
                    Utiliser
                  </button>
                  <button
                    type="button"
                    className={REMOVE_BTN}
                    aria-label={`Supprimer ${item.name}`}
                    onClick={() => void removeGalleryFile(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null
          const sourceButtons = (
            <span className="flex flex-wrap gap-2">
              {sampleCat && (
                <button type="button" onClick={() => setSampleOpen(s.k)} className={FILE_BTN}>
                  <FileUp className="size-3.5" /> Données d’exemple
                </button>
              )}
              <button type="button" onClick={() => toggleGallery(s.k)} className={FILE_BTN}>
                <FileUp className="size-3.5" /> Mes fichiers
              </button>
            </span>
          )

          if (state === 'uploading') {
            return row(s, (
              <div className="flex flex-col gap-2">
                <div className={FILE_CARD}>
                  <span className="truncate flex-1">{meta?.name ?? 'Upload…'}</span>
                  <span className="text-file-meta shrink-0">{progress} %</span>
                  <button
                    type="button"
                    className="bg-transparent border-none p-0 font-bold text-file-btn cursor-pointer"
                    onClick={() => cancelUpload(s.k)}
                  >
                    Annuler
                  </button>
                  {hidden}
                </div>
                <Progress value={progress} />
              </div>
            ))
          }
          if (state === 'error') {
            return row(s, (
              <div className="flex flex-col gap-2">
                <div className={FILE_CARD}>
                  <span className="text-error-light inline-flex items-center gap-1 flex-1">
                    <TriangleAlert className="size-3.5 shrink-0" /> {errorMsg ?? 'Échec'}
                  </span>
                  <button
                    type="button"
                    className="bg-transparent border-none p-0 font-bold text-error-light cursor-pointer shrink-0"
                    onClick={() => inputRefs.current[s.k]?.click()}
                  >
                    Réessayer
                  </button>
                  {hidden}
                </div>
                {sourceButtons}
                {galleryBlock}
              </div>
            ))
          }
          if (hasUrl && fname) {
            return row(s, (
              <div className="flex flex-col gap-2">
                <div className={FILE_CARD}>
                  <span className="truncate flex-1">{fname}</span>
                  {meta && <span className="text-file-meta shrink-0">{fmtSize(meta.size)}</span>}
                  {expired && <span className="text-error-light shrink-0">Expiré — réimporte</span>}
                  <button type="button" className={FILE_BTN} onClick={() => inputRefs.current[s.k]?.click()}>
                    Remplacer
                  </button>
                  <button
                    className={REMOVE_BTN}
                    aria-label="Retirer le fichier"
                    onClick={() => {
                      set(s.k, '')
                      setFileMetaState(m => { const n = { ...m }; delete n[s.k]; return n })
                      setPreviewState(p => { const n = { ...p }; delete n[s.k]; return n })
                    }}
                  >
                    ×
                  </button>
                  {hidden}
                </div>
                {previewBlock}
                {sourceButtons}
                {galleryBlock}
              </div>
            ))
          }
          return row(s, (
            <div className="flex flex-col gap-2">
              <div
                role="button"
                tabIndex={readOnly ? undefined : 0}
                onClick={() => inputRefs.current[s.k]?.click()}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && !readOnly) {
                    e.preventDefault()
                    inputRefs.current[s.k]?.click()
                  }
                }}
                onDragOver={e => { e.preventDefault(); setDragState(d => ({ ...d, [s.k]: true })) }}
                onDragLeave={() => setDragState(d => ({ ...d, [s.k]: false }))}
                onDrop={e => {
                  e.preventDefault()
                  setDragState(d => ({ ...d, [s.k]: false }))
                  pickFile(e.dataTransfer.files?.[0])
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border border-dashed px-3 py-5 text-center cursor-pointer transition-colors ${
                  dragState[s.k] ? 'border-accent bg-accent/10' : 'border-file/50 bg-file/10'
                }`}
              >
                <FileUp className="size-5 text-file-btn" />
                <span className="text-xs font-bold">Dépose ton fichier ici ou touche pour choisir</span>
                <span className={HINT_CLS}>Formats : {fileAccept}</span>
                {hidden}
              </div>
              {sourceButtons}
              {galleryBlock}
            </div>
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