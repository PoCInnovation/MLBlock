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
  return <div className="text-base font-extrabold m-0">{children}</div>
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <div className="text-text-muted text-sm font-semibold leading-relaxed mt-2.5 mb-5">{children}</div>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="flex gap-2.5 justify-end flex-wrap">{children}</div>
}
