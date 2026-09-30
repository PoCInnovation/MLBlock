import { Dialog, DialogTitle, DialogDescription, DialogFooter } from './dialog'
import { Save, LogOut, X } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
const btnBase = "inline-flex items-center gap-2 px-4 py-2 rounded-md font-extrabold text-sm cursor-pointer border transition-all disabled:opacity-60"
type Props = {
  open: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
  busy?: boolean
}

/** Dialog partagé : modifications non sauvegardées (navigation, logout). */
export default function UnsavedChangesDialog({ open, onSave, onDiscard, onCancel, busy = false }: Props) {
  return (
    <Dialog isOpen={open} onOpenChange={o => { if (!o && !busy) onCancel() }}>
      <DialogTitle>Modifications non sauvegardées</DialogTitle>
      <DialogDescription>
        Ton projet a changé (blocs ou nom) mais n'a pas été enregistré. Que veux-tu faire ?
      </DialogDescription>
      <DialogFooter>
        <button
          onClick={onSave}
          disabled={busy}
          className={`${btnBase} bg-success/20 text-success border-success/40`}
        >
          <Icon icon={Save} size="sm" /> Sauvegarder et quitter
        </button>
        <button
          onClick={onDiscard}
          disabled={busy}
          className={`${btnBase} bg-error/20 text-error-light border-error/40`}
        >
          <Icon icon={LogOut} size="sm" /> Quitter sans sauvegarder
        </button>
        <button onClick={onCancel} disabled={busy} className={`${btnBase} bg-surface3 text-text border-border`}>
          <Icon icon={X} size="sm" /> Rester
        </button>
      </DialogFooter>
    </Dialog>
  )
}
