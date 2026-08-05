type NotchProps = {
  color: string
  side: 'top' | 'bottom'
  left?: number
}

const base: React.CSSProperties = {
  position: 'absolute',
  left: 20,
  width: 24,
  height: 11,
  borderRadius: '0 0 999px 999px',
}

export default function Notch({ color, side, left }: NotchProps) {
  return (
    <div style={{
      ...base,
      top: side === 'top' ? 0 : undefined,
      bottom: side === 'bottom' ? -11 : undefined,
      left: left ?? 20,
      background: color,
    }} />
  )
}
