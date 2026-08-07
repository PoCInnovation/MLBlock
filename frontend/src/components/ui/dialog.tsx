import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'
import { theme } from '../../theme'

/** Dialog accessible (Base UI) stylé avec les tokens du thème. */
export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 150 }}
        />
        <BaseDialog.Popup
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: theme.color.surface2,
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.lg,
            boxShadow: '0 20px 60px rgba(0,0,0,.55)',
            padding: 26,
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            outline: 'none',
            zIndex: 160,
          }}
        >
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <BaseDialog.Title style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
      {children}
    </BaseDialog.Title>
  )
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <BaseDialog.Description style={{ color: theme.color.textMuted, fontSize: 13.5, fontWeight: 600, lineHeight: 1.55, margin: '10px 0 20px' }}>
      {children}
    </BaseDialog.Description>
  )
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>
}
