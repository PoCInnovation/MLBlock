import { memo, useMemo, useRef, useState } from 'react'
import { X, PanelLeft, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { colorFor } from '../../utils/blockHelpers'
import { shouldIgnoreTap } from '../../utils/tapGuard'
import { theme } from '../../theme'
import { baselines, PATTERN_LABELS, ETAPE_LABELS, ETAPES, type Baseline } from '../../content/baselines'
import { NIVEAUX, NIVEAU_LABELS, NIVEAU_CONSIGNES, type Niveau } from '../../utils/niveaux'
import { juniorByNiveau, JUNIOR_BASELINES } from '../../utils/juniorCatalog'
import { kidLabel, kidAstuce } from '../../utils/kidLabels'
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
  /** Drag d'une baseline entiere (mime application/mlblock-pipeline). */
  onBaselineDragStart?: (e: React.DragEvent, slug: string) => void
  /** Clic/tap sur une baseline : charge la pipeline dans le canvas. */
  onBaselineLoad?: (slug: string) => void
  /**
   * Clic sur un bloc Junior : ajoute au centre (desktop + mobile).
   * Separe de onAdd (mobile seul, clic desktop volontairement inerte
   * pour les blocs Avance) pour ne pas changer le comportement Avance.
   */
  onJuniorAdd?: (type: string) => void
  /** Fermeture du tiroir mobile (affiche un bouton ✕ dans l'en-tête). */
  onClose?: () => void
  /** Collapse toggle for desktop sidebar — affiche un bouton en haut à droite. */
  onToggleCollapse?: () => void
  /** État replié (pour icône). */
  collapsed?: boolean
}

const FlowPalette = memo(function FlowPalette({ onDragStart, onAdd, onBaselineDragStart, onBaselineLoad, onJuniorAdd, onClose, onToggleCollapse }: FlowPaletteProps) {
  const catalog = useAppStore(s => s.catalog)
  const paletteMode = useAppStore(s => s.paletteMode)
  const setPaletteMode = useAppStore(s => s.setPaletteMode)
  const isJunior = paletteMode === 'junior'
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [etape, setEtape] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  // Un drag HTML5 (même court, ≤8px) marque le flag : le click qui suit ne
  // doit pas ajouter de bloc (dragStarted est réinitialisé au pointerdown).
  const dragStarted = useRef(false)

  // Carte type de bloc -> etapes ou il apparait (agregee sur les baselines).
  // Permet de filtrer les blocs unitaires par etape du pattern.
  const etapeByType = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const b of baselines) {
      for (const [e, types] of Object.entries(b.etapes ?? {})) {
        for (const t of types) {
          const cur = m.get(t) ?? []
          if (!cur.includes(e)) m.set(t, [...cur, e])
        }
      }
    }
    return m
  }, [])

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

  // Clic Junior : meme garde anti-drag que handleItemClick, mais ajoute
  // toujours au centre (desktop + mobile), contrairement a onAdd.
  const handleJuniorClick = (type: string, e: React.MouseEvent) => {
    if (dragStarted.current) {
      dragStarted.current = false
      pressStart.current = null
      return
    }
    const press = pressStart.current
    pressStart.current = null
    if (shouldIgnoreTap(press, e.clientX, e.clientY)) return
    onJuniorAdd?.(type)
  }

  const handleJuniorKeyDown = (type: string, e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (!dragStarted.current) onJuniorAdd?.(type)
  }

  if (!catalog) return null

  const categories = catalog.categories
  const q = query.trim().toLowerCase()

  const matches = (type: string) => {
    const def = catalog.blocks[type]
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    const matchQuery = !q || label.toLowerCase().includes(q)
    const matchCat = cat === 'all' || def.cat === cat
    const matchEtape = etape === 'all' || (etapeByType.get(type)?.includes(etape) ?? false)
    return matchQuery && matchCat && matchEtape
  }

  const hasAnyMatch = Object.keys(catalog.blocks).some(matches)

  // --- Mode Junior : groupement par Niveaux de liaisons ---
  const juniorGroups = juniorByNiveau(catalog?.blocks ?? {})
  const juniorBaselines = baselines.filter(b => JUNIOR_BASELINES.includes(b.slug))

  const matchesJunior = (type: string) => {
    const def = catalog.blocks[type]
    if (!def) return false
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    const k = kidLabel(type, label)
    return !q || k.toLowerCase().includes(q) || label.toLowerCase().includes(q) || type.includes(q)
  }

  const matchesJuniorBaseline = (b: Baseline) => {
    return !q || b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
  }

  const hasJuniorMatch =
    Object.values(juniorGroups).flat().some(matchesJunior) ||
    juniorBaselines.some(matchesJuniorBaseline)

  const niveauBadgeStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 999,
    border: `1.5px solid ${theme.color.accent}`,
    color: theme.color.accent,
    fontSize: 12,
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const renderBaselineCards = (list: Baseline[]) => list.map(b => (
    <ClickableCard
      key={b.slug}
      label={b.title}
      onClick={() => onBaselineLoad?.(b.slug)}
      padding={2}
    >
      <div
        draggable
        onDragStart={e => { dragStarted.current = true; onBaselineDragStart?.(e, b.slug) }}
        onPointerDown={e => { dragStarted.current = false; pressStart.current = { x: e.clientX, y: e.clientY } }}
        style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', cursor: 'grab' }}
        title={b.description}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text }}>{b.title}</span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: theme.color.accent }}>{PATTERN_LABELS[b.pattern]}</span>
        <span style={{ fontSize: 11, color: theme.color.textMuted, lineHeight: 1.3 }}>{b.description}</span>
      </div>
    </ClickableCard>
  ))

  const renderJuniorBlock = (type: string, niv: Niveau) => {
    const def = catalog.blocks[type]
    if (!def) return null
    const label = def.segs.find(s => s.t === 'text')?.v ?? type
    const kid = kidLabel(type, label)
    const astuce = kidAstuce(type)
    return (
      <ClickableCard
        key={type}
        label={kid}
        onClick={(e) => handleJuniorClick(type, e as unknown as React.MouseEvent)}
        padding={2}
      >
        <div
          draggable
          onDragStart={e => { dragStarted.current = true; onDragStart(e, type) }}
          onPointerDown={e => { dragStarted.current = false; pressStart.current = { x: e.clientX, y: e.clientY } }}
          onKeyDown={e => handleJuniorKeyDown(type, e)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', cursor: 'grab' }}
          title={def.description || undefined}
        >
          <span style={niveauBadgeStyle}>{niv}</span>
          <span style={dotStyle(colorFor(def.cat, categories))} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text }}>{kid}</span>
            {astuce && <span style={{ fontSize: 11, color: theme.color.textMuted, lineHeight: 1.3 }}>{astuce}</span>}
          </span>
        </div>
      </ClickableCard>
    )
  }

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
        <div style={{ marginTop: 10 }}>
          <ToggleButtonGroup
            type="single"
            label="Mode"
            value={paletteMode}
            onChange={(v) => setPaletteMode(v === 'avance' ? 'avance' : 'junior')}
            size="sm"
          >
            <Grid columns={2} gap={1.5}>
              <ToggleButton label="Junior" value="junior" />
              <ToggleButton label="Avance" value="avance" />
            </Grid>
          </ToggleButtonGroup>
        </div>
        {!isJunior && (
        <>
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
            <div style={{ marginTop: 8 }}>
              <ToggleButtonGroup
                type="single"
                label="Etapes du pattern"
                value={etape}
                onChange={(v) => setEtape((v as string) || 'all')}
                size="sm"
              >
                <Grid columns={2} gap={1.5}>
                  <ToggleButton label="Toutes" value="all" />
                  {ETAPES.map(e => (
                    <ToggleButton key={e} label={ETAPE_LABELS[e]} value={e} />
                  ))}
                </Grid>
              </ToggleButtonGroup>
            </div>
          </div>
        )}
        </>
        )}
      </div>
      <div style={scrollStyle}>
        {isJunior ? (
          <>
            {juniorBaselines.filter(matchesJuniorBaseline).length > 0 && (
              <div>
                <div style={{ ...catStyle, display: 'flex', alignItems: 'center', gap: 6, marginTop: 0 }}>
                  <Sparkles size={13} />
                  <span>Baselines</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {renderBaselineCards(juniorBaselines.filter(matchesJuniorBaseline))}
                </div>
              </div>
            )}
            {NIVEAUX.map(niv => {
              const types = juniorGroups[niv].filter(matchesJunior)
              if (types.length === 0) return null
              return (
                <div key={niv}>
                  <div style={catStyle}>{niv} - {NIVEAU_LABELS[niv]}</div>
                  <div style={{ fontSize: 11, color: theme.color.textMuted, margin: '-4px 0 8px', lineHeight: 1.3 }}>
                    {NIVEAU_CONSIGNES[niv]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {types.map(t => renderJuniorBlock(t, niv))}
                  </div>
                </div>
              )
            })}
            {!hasJuniorMatch && (
              <div style={{ color: theme.color.textMuted, fontSize: 13, fontWeight: 600, padding: '18px 6px', textAlign: 'center' }}>
                Aucun bloc ne correspond - essaie un autre mot
              </div>
            )}
          </>
        ) : (
          <>
        {baselines.length > 0 && (
          <div>
            <div style={{ ...catStyle, display: 'flex', alignItems: 'center', gap: 6, marginTop: 0 }}>
              <Sparkles size={13} />
              <span>Baselines</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {renderBaselineCards(baselines)}
            </div>
          </div>
        )}
        {!hasAnyMatch && baselines.length === 0 && (
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
          </>
        )}
      </div>
    </div>
  )
})

export default FlowPalette
