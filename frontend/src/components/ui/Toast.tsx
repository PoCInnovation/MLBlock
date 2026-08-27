import { useEffect } from 'react'
import useAppStore from '../../store/useAppStore'
import { CheckCircle2, XCircle, Zap } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import { theme } from '../../theme'

const style: React.CSSProperties = {
  position: 'fixed',
  top: 72,
  right: 20,
  zIndex: 9999,
  background: theme.color.surface3,
  border: '1px solid',
  borderRadius: theme.radius.md,
  padding: '10px 14px',
  color: theme.color.text,
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  maxWidth: 380,
  boxShadow: theme.shadow.block,
}

export default function Toast() {
  const toast = useAppStore(s => s.toast)
  const clearToast = useAppStore(s => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 5000)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  if (!toast) return null

  const color = toast.kind === 'error' ? theme.color.error : theme.color.convert
  const iconColor = toast.kind === 'error' ? 'error' as const : toast.kind === 'success' ? 'success' as const : 'warning' as const
  return (
    <div role="alert" style={{ ...style, borderColor: color }}>
      {toast.kind === 'error' ? <Icon icon={XCircle} size="md" color={iconColor} /> : toast.kind === 'success' ? <Icon icon={CheckCircle2} size="md" color={iconColor} /> : <Icon icon={Zap} size="md" color={iconColor} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action?.(); clearToast() }}
          style={{
            background: color, color: '#fff', border: 'none', borderRadius: 6,
            padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Convertir
        </button>
      )}
    </div>
  )
}
