import useAppStore from '../../store/useAppStore'
import { categories } from '../../mockdata/categories'
import { defs } from '../../mockdata/blocks'
import { colorFor } from '../../utils/blockHelpers'
import PaletteBlock from './PaletteBlock'

export default function BlockPalette({ startPaletteDrag }) {
  const selectedCat = useAppStore(s => s.category)
  const cat = categories.find(c => c.id === selectedCat)
  const types = Object.keys(defs).filter(t => defs[t].cat === selectedCat)

  return (
    <div style={{ width: 256, flexShrink: 0, background: '#221c19', borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <span style={{ width: 12, height: 12, borderRadius: 4, background: colorFor(selectedCat), display: 'inline-block' }} />
        <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 17 }}>
          {cat?.name}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 28px' }}>
        {types.map(type => (
          <PaletteBlock key={type} type={type} startPaletteDrag={startPaletteDrag} />
        ))}
      </div>
    </div>
  )
}
