import type { ReactNode } from 'react'
import { Dialog as AstryxDialog, AlertDialog as AstryxAlertDialog } from '@astryxdesign/core'

type DialogProps = {
  open?: boolean
  isOpen?: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
}

/** Astryx Dialog wrapper — accepts both `open` (legacy) and `isOpen` (Astryx). Keeps focus trap via native <dialog>. */
export function Dialog({ open, isOpen, onOpenChange, children }: DialogProps) {
  const resolvedOpen = isOpen ?? open ?? false
  return (
    <AstryxDialog isOpen={resolvedOpen} onOpenChange={onOpenChange}>
      {children}
    </AstryxDialog>
  )
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{children}</div>
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <div style={{ color: 'var(--color-text-muted)', fontSize: 13.5, fontWeight: 600, lineHeight: 1.55, marginTop: 10, marginBottom: 20 }}>{children}</div>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>
}

/** Astryx AlertDialog re-export for destructive confirmations (UnsavedChangesDialog etc). */
export function AlertDialog(props: React.ComponentProps<typeof AstryxAlertDialog>) {
  return <AstryxAlertDialog {...props} />
}
export { AstryxAlertDialog as AlertDialogPrimitive }
