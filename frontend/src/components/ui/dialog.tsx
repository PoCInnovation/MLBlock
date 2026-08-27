import type { ReactNode } from 'react'
import { Dialog as AstryxDialog } from '@astryxdesign/core'


type DialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

/** Astryx Dialog — deep seam, no legacy `open` prop. Use `isOpen` (Astryx). */
export function Dialog({ isOpen, onOpenChange, children }: DialogProps) {
  return (
    <AstryxDialog isOpen={isOpen} onOpenChange={onOpenChange}>
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
