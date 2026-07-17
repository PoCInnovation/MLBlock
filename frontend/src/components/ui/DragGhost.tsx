import useAppStore from '../../store/useAppStore'

export default function DragGhost() {
  const drag = useAppStore(s => s.drag)
  if (!drag || !drag.active || !drag.moved) return null

  return (
    <div style={{
      position: 'fixed',
      left: drag.x,
      top: drag.y,
      transform: 'translate(-50%, -50%) rotate(-2.5deg)',
      background: drag.color,
      color: '#2a211c',
      fontWeight: 800,
      fontSize: 14,
      padding: '11px 16px',
      borderRadius: 12,
      boxShadow: '0 12px 28px rgba(0,0,0,.45)',
      pointerEvents: 'none',
      zIndex: 9999,
      whiteSpace: 'nowrap',
      opacity: 0.95,
    }}>
      {drag.label}
    </div>
  )
}
