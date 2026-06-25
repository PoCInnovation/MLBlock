import { defs } from '../../mockdata/blocks'
import { colorFor } from '../../utils/blockHelpers'
import BlockSegments from '../blocks/BlockSegments'

type PaletteBlockProps = {
  type: string
  startPaletteDrag: (type: string, e: React.PointerEvent) => void
}

export default function PaletteBlock({ type, startPaletteDrag }: PaletteBlockProps) {
  const d = defs[type]
  const color = colorFor(d.cat)

  return (
    <div
      onPointerDown={e => startPaletteDrag(type, e)}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
        color: '#2a211c', fontWeight: 800, fontSize: 14,
        background: color, padding: '14px 15px 13px', borderRadius: 12,
        marginBottom: 18, cursor: 'grab',
        boxShadow: '0 2px 0 rgba(0,0,0,.18)', userSelect: 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 20, width: 24, height: 11, background: '#221c19', borderRadius: '0 0 999px 999px' }} />
      <div style={{ position: 'absolute', bottom: -11, left: 20, width: 24, height: 11, background: color, borderRadius: '0 0 999px 999px' }} />
      <BlockSegments segs={d.segs} />
    </div>
  )
}
