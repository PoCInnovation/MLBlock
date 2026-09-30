import { memo, useRef, useState } from 'react'
import { X, PanelLeft, ChevronDown, ChevronUp } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { colorFor } from '../../utils/blockHelpers'
import { shouldIgnoreTap } from '../../utils/tapGuard'
import { ALL_STAGES, stageOfBlock, stageKey } from '../../utils/stages'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type FlowPaletteProps = {
  onDragStart: (e: React.DragEvent, type: string) => void
  /**
   * Tap-to-add (mobile uniquement — le tiroir passe onAdd, la sidebar desktop
   * non : un clic desktop sur un item doit rester inerte).
   */
  onAdd?: (type: string) => void
  /** Fermeture du tiroir mobile (affiche un bouton ✕ dans l'en-tête). */
  onClose?: () => void
  /** Collapse toggle for desktop sidebar — affiche un bouton en haut à droite. */
  onToggleCollapse?: () => void
  /** État replié (pour icône). */
  collapsed?: boolean
}

const FlowPalette = memo(function FlowPalette({ onDragStart, onAdd, onClose, onToggleCollapse }: FlowPaletteProps) {
  const catalog = useAppStore(s => s.catalog)
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  // Un drag HTML5 (même court, ≤8px) marque le flag : le click qui suit ne
  // doit pas ajouter de bloc (dragStarted est réinitialisé au pointerdown).
  const dragStarted = useRef(false)

  const handleItemClick = (type: string, e: React.MouseEvent) => {
    if (dragStarted.current) {
      dragStarted.current = false
      pressStart.current = null
      return
    }
    const press = pressStart.current
    pressStart.current = null
    if (shouldIgnoreTap(press, e.clientX, e.clientY)) return
    onAdd?.(type)
  }

  const handleItemKeyDown = (type: string, e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (!dragStarted.current) onAdd?.(type)
  }

  if (!catalog) return null

  const categories = catalog.categories
  const q = query.trim().toLowerCase()

  const matches = (type: string) => {
    const def = catalog.blocks[type]
    if (!showAdvanced && def.advanced) return false
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    const matchQuery = !q || label.toLowerCase().includes(q)
    const blockStage = def.stage ?? stageOfBlock(type, def.cat)
    const matchStage = stageFilter === 'all' || String(blockStage) === stageFilter || stageKey(blockStage) === stageFilter
    return matchQuery && matchStage
  }

  const hasAnyMatch = Object.keys(catalog.blocks).some(matches)

  return (
    <div className="floating-panel w-full h-full flex-1 self-stretch flex flex-col min-h-0 bg-surface2 border border-border rounded-2xl shadow-lg backdrop-blur-sm overflow-hidden">
      <div className="px-4.5 pt-3.5 pb-3 border-b border-border shrink-0 font-heading font-semibold text-base text-text flex flex-col items-stretch">
        <div className="flex items-center justify-between">
          <span>Blocks</span>
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <Button
                title="Replier la palette"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleCollapse}
              >
                <PanelLeft className="size-4" />
              </Button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="bg-transparent border-none text-text-muted cursor-pointer font-black text-base w-9 h-9 inline-flex items-center justify-center rounded-full"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un Block…"
          className="mt-2 h-8 text-xs"
        />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted">Filtres</span>
          <Button
            title={filtersOpen ? 'Replier les filtres' : 'Déplier les filtres'}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setFiltersOpen(v => !v)}
          >
            {filtersOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
        {filtersOpen && (
          <div className="mt-2 flex flex-col gap-2.5">
            <ToggleGroup
              type="single"
              value={stageFilter}
              onValueChange={(v: string) => setStageFilter(v || 'all')}
              className="grid grid-cols-2 gap-1.5 justify-start"
            >
              <ToggleGroupItem value="all" className="text-xs justify-start px-2 h-7">
                Tous
              </ToggleGroupItem>
              {ALL_STAGES.map(s => (
                <ToggleGroupItem key={s.id} value={String(s.id)} className="text-xs justify-start px-2 h-7">
                  {s.key} {s.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex items-center justify-between px-1 py-0.5">
              <span className="text-xs font-semibold text-text-muted">Avancé</span>
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3.5 pt-3.5 pb-7 flex flex-col gap-2.5">
        {!hasAnyMatch && (
          <div className="text-text-muted text-sm font-semibold px-1.5 py-4.5 text-center">
            Aucun Block ne correspond
          </div>
        )}
        {ALL_STAGES.map(s => {
          const types = Object.keys(catalog.blocks).filter(t => {
            const def = catalog.blocks[t]
            const bStage = def.stage ?? stageOfBlock(t, def.cat)
            return bStage === s.id && matches(t)
          })
          if (types.length === 0) return null
          return (
            <div key={s.id}>
              <div className="flex items-center gap-2 mt-3.5 mb-2">
                <Badge
                  className="text-xs font-extrabold px-1.5 py-0.5 rounded border"
                  style={{ backgroundColor: `${s.color}22`, color: s.color, border: `1px solid ${s.color}66` }}
                >
                  {s.key}
                </Badge>
                <span className="font-heading font-bold text-xs text-text">
                  {s.label}
                </span>
                <span className="text-xs text-text-muted ml-auto">
                  {types.length} {types.length > 1 ? 'Blocks' : 'Block'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {types.map(type => {
                  const def = catalog.blocks[type]
                  const label = def.segs.find(s => s.t === 'text')?.v ?? type
                  return (
                    <Card
                      key={type}
                      onClick={(e) => handleItemClick(type, e as unknown as React.MouseEvent)}
                      className="cursor-pointer hover:border-primary/50 transition-colors p-2 bg-card border-border shadow-xs"
                    >
                      <CardContent className="p-0">
                        <div
                          draggable
                          onDragStart={e => { dragStarted.current = true; onDragStart(e, type) }}
                          onPointerDown={e => { dragStarted.current = false; pressStart.current = { x: e.clientX, y: e.clientY } }}
                          onKeyDown={e => handleItemKeyDown(type, e)}
                          className="flex items-center gap-2 w-full cursor-grab"
                          title={def.description || undefined}
                          role="button"
                          tabIndex={0}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ background: colorFor(def.cat, categories) }}
                          />
                          <span className="text-xs font-bold text-text">{label}</span>
                          {def.advanced && (
                            <span className="text-xs text-text-dim ml-auto font-semibold">
                              Avancé
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
        {Object.keys(catalog.blocks).filter(matches).length === 0 && (
          <div className="text-text-dim text-xs text-center py-5">Aucun Block trouvé</div>
        )}
      </div>
    </div>
  )
})

export default FlowPalette
