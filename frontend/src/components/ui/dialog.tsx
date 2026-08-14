import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'

/** Dialog accessible (Base UI) stylé avec les tokens du thème. */
export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-black/55 z-[150]" />
        <BaseDialog.Popup
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface2 border border-border rounded-lg shadow-[0_20px_60px_rgba(0,0,0,.55)] p-[26px] w-[400px] max-w-[calc(100vw_-_32px)] outline-none z-[160]"
        >
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <BaseDialog.Title className="text-[17px] font-extrabold m-0">
      {children}
    </BaseDialog.Title>
  )
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <BaseDialog.Description className="text-text-muted text-[13.5px] font-semibold leading-[1.55] mt-[10px] mb-5">
      {children}
    </BaseDialog.Description>
  )
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="flex gap-2.5 justify-end flex-wrap">{children}</div>
}
