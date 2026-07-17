import { hatBorderRadius } from '../../utils/snapLogic'

const ACCENT = '#D97757'

type HatBlockProps = {
  hatRef: React.RefObject<HTMLDivElement | null>
  hatBand: number | null
  n: number
  band0: number | null
}

export default function HatBlock({ hatRef, hatBand, n, band0 }: HatBlockProps) {
  const radius = hatBorderRadius(n, hatBand, band0)
  const minWidth = hatBand != null ? hatBand + 'px' : undefined

  return (
    <div
      ref={hatRef}
      style={{
        position: 'relative',
        zIndex: n + 2,
        color: '#fff',
        fontWeight: 800,
        fontSize: 15,
        padding: '13px 20px 15px',
        borderRadius: radius,
        minWidth,
        boxShadow: '0 2px 0 rgba(0,0,0,.2)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        userSelect: 'none',
        background: ACCENT,
      }}
    >
      <span style={{ fontSize: 12 }}>▶</span>
      Démarrer le projet
      <div style={{ position: 'absolute', bottom: -11, left: 20, width: 24, height: 11, background: ACCENT, borderRadius: '0 0 999px 999px' }} />
    </div>
  )
}
