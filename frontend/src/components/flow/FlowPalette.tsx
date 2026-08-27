import { memo, useRef, useState } from 'react'
import { X, PanelLeft, PanelRight, ChevronDown, ChevronUp } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { colorFor } from '../../utils/blockHelpers'
import { shouldIgnoreTap } from '../../utils/tapGuard'
import { theme } from '../../theme'
import { ToggleButtonGroup, ToggleButton, Grid, ClickableCard, IconButton, TextInput } from '@astryxdesign/core'

const paletteStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  flex: 1,
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  background: theme.color.surface2,
  border: `1px solid ${theme.color.border}`,
  borderRadius: theme.radius.xl,
  boxShadow: '0 8px 32px rgba(0,0,0,.12)',
  backdropFilter: 'blur(8px)',
  overflow: 'hidden',
  transition: 'none',
}
const headerStyle: React.CSSProperties = {
  padding: '14px 18px 12px',
  borderBottom: `1px solid ${theme.color.border}`,
  flexShrink: 0,
  fontFamily: theme.font.heading,
  fontWeight: 600,
  fontSize: 17,
  color: theme.color.text,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
}

const chipsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  marginTop: 10,
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  background: active ? theme.color.accent : theme.color.surface3,
  color: active ? '#fff' : theme.color.textMuted,
  transition: 'background .2s, color .2s',
})

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '14px 14px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const catStyle: React.CSSProperties = {
  fontFamily: theme.font.heading,
  fontWeight: 600,
  fontSize: 13,
  color: theme.color.textMuted,
  margin: '12px 0 8px',
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '8px 10px',
  borderRadius: theme.radius.md,
  marginBottom: 8,
  cursor: 'grab',
  background: theme.color.surface3,
  border: `1px solid ${theme.color.border}`,
  color: theme.color.text,
  fontSize: 13,
  fontWeight: 700,
  transition: 'background .2s, border-color .2s',
  userSelect: 'none',
}

const emptyStyle: React.CSSProperties = {
  color: theme.color.textDim,
  fontSize: 13,
  textAlign: 'center',
  padding: '20px 0',
}

const dotStyle = (color: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: 3,
  background: color,
  flexShrink: 0,
})

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
  const [cat, setCat] = useState('all')
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
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    const matchQuery = !q || label.toLowerCase().includes(q)
    const matchCat = cat === 'all' || def.cat === cat
    return matchQuery && matchCat
  }

  const hasAnyMatch = Object.keys(catalog.blocks).some(matches)

  return (
    <div style={paletteStyle} className="floating-panel flow-palette-inner">
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Blocs</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {onToggleCollapse && (
              <IconButton
                label="Replier la palette"
                icon={<PanelLeft size={16} />}
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
              />
            )}
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Fermer"
                style={{ background: 'none', border: 'none', color: theme.color.textMuted, cursor: 'pointer', fontWeight: 900, fontSize: 16, width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>
        <TextInput
          label="Rechercher un bloc"
          isLabelHidden
          value={query}
          onChange={setQuery}
          placeholder="Rechercher un bloc…"
        />
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.color.textMuted }}>Filtres</span>
          <IconButton
            label={filtersOpen ? 'Replier les filtres' : 'Déplier les filtres'}
            icon={filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            variant="ghost"
            size="sm"
            onClick={() => setFiltersOpen(v => !v)}
          />
        </div>
        {filtersOpen && (
          <div style={{ marginTop: 8 }}>
            <ToggleButtonGroup
              type="single"
              label="Catégories"
              value={cat}
              onChange={(v) => setCat((v as string) || 'all')}
              size="sm"
            >
              <Grid columns={2} gap={1.5}>
                <ToggleButton label="Tous" value="all" />
                {categories.map(c => (
                  <ToggleButton key={c.id} label={c.name} value={c.id} />
                ))}
              </Grid>
            </ToggleButtonGroup>
          </div>
        )}
      </div>
      <div style={scrollStyle}>
        {!hasAnyMatch && (
          <div style={{ color: theme.color.textMuted, fontSize: 13, fontWeight: 600, padding: '18px 6px', textAlign: 'center' }}>
            Aucun bloc ne correspond
          </div>
        )}
        {categories.map(c => {
          const types = Object.keys(catalog.blocks).filter(t => catalog.blocks[t].cat === c.id && matches(t))
          if (types.length === 0) return null
          return (
            <div key={c.id}>
              <div style={catStyle}>{c.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {types.map(type => {
                const def = catalog.blocks[type]
                const label = def.segs.find(s => s.t === 'text')?.v ?? type
                return (
                  <ClickableCard
                    key={type}
                    label={label}
                    onClick={(e) => handleItemClick(type, e as unknown as React.MouseEvent)}
                    padding={2}
                  >
                    <div
                      draggable
                      onDragStart={e => { dragStarted.current = true; onDragStart(e, type) }}
                      onPointerDown={e => { dragStarted.current = false; pressStart.current = { x: e.clientX, y: e.clientY } }}
                      onKeyDown={e => handleItemKeyDown(type, e)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', cursor: 'grab' }}
                      title={def.description || undefined}
                      role="button"
                      tabIndex={0}
                    >
                      <span style={dotStyle(colorFor(c.id, categories))} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text }}>{label}</span>
                    </div>
                  </ClickableCard>
                )
              })}
              </div>
            </div>
          )
        })}
        {Object.keys(catalog.blocks).filter(matches).length === 0 && (
          <div style={emptyStyle}>Aucun bloc trouvé</div>
        )}
      </div>
    </div>
  )
})

export default FlowPalette
