import { useState } from 'react'
import useAppStore from '../../store/useAppStore'
import { colorFor } from '../../utils/blockHelpers'
import { theme } from '../../theme'

const paletteStyle: React.CSSProperties = {
  width: 260,
  flexShrink: 0,
  height: '100%',
  background: theme.color.surface2,
  borderRight: `1px solid rgba(255,255,255,.06)`,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}

const headerStyle: React.CSSProperties = {
  padding: '14px 18px 12px',
  borderBottom: '1px solid rgba(255,255,255,.05)',
  flexShrink: 0,
  fontFamily: theme.font.heading,
  fontWeight: 600,
  fontSize: 17,
  color: theme.color.text,
}

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  marginTop: 10,
  borderRadius: theme.radius.md,
  border: `1px solid rgba(255,255,255,.1)`,
  background: 'rgba(255,255,255,.05)',
  color: theme.color.text,
  fontSize: 13,
}

const chipsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  marginTop: 10,
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  background: active ? theme.color.accent : 'rgba(255,255,255,.05)',
  color: active ? '#fff' : theme.color.textMuted,
  transition: 'background .2s, color .2s',
})

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '14px 14px 28px',
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
  padding: '8px 10px',
  borderRadius: theme.radius.md,
  marginBottom: 8,
  cursor: 'grab',
  background: 'rgba(255,255,255,.04)',
  border: `1px solid rgba(255,255,255,.06)`,
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
}

export default function FlowPalette({ onDragStart }: FlowPaletteProps) {
  const catalog = useAppStore(s => s.catalog)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')

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

  return (
    <div style={paletteStyle}>
      <div style={headerStyle}>
        Blocks
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un block…"
          style={searchInputStyle}
        />
        <div style={chipsStyle}>
          <button style={chipStyle(cat === 'all')} onClick={() => setCat('all')}>Tous</button>
          {categories.map(c => (
            <button key={c.id} style={chipStyle(cat === c.id)} onClick={() => setCat(c.id)}>{c.name}</button>
          ))}
        </div>
      </div>
      <div style={scrollStyle}>
        {categories.map(c => {
          const types = Object.keys(catalog.blocks).filter(t => catalog.blocks[t].cat === c.id && matches(t))
          if (types.length === 0) return null
          return (
            <div key={c.id}>
              <div style={catStyle}>{c.name}</div>
              {types.map(type => {
                const def = catalog.blocks[type]
                const label = def.segs.find(s => s.t === 'text')?.v ?? type
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={e => onDragStart(e, type)}
                    style={itemStyle}
                  >
                    <span style={dotStyle(colorFor(c.id, categories))} />
                    <span>{label}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
        {Object.keys(catalog.blocks).filter(matches).length === 0 && (
          <div style={emptyStyle}>Aucun block trouvé</div>
        )}
      </div>
    </div>
  )
}
