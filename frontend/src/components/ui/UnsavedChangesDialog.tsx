import { Dialog, DialogTitle, DialogDescription, DialogFooter } from './dialog'
import { Save, LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <Button
          onClick={onSave}
          disabled={busy}
          variant="outline"
          className="bg-success/20 text-success border-success/40 hover:bg-success/30"
        >
          <Save className="size-4 mr-2" /> Sauvegarder et quitter
        </Button>
        <Button
          onClick={onDiscard}
          disabled={busy}
          variant="outline"
          className="bg-error/20 text-error-light border-error/40 hover:bg-error/30"
        >
          <LogOut className="size-4 mr-2" /> Quitter sans sauvegarder
        </Button>
        <Button
          onClick={onCancel}
          disabled={busy}
          variant="secondary"
        >
          <X className="size-4 mr-2" /> Rester
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
