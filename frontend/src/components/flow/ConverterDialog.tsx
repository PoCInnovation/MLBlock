import { Button } from '@astryxdesign/core'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'

type Props = {
  open: boolean
  blockName: string
  blockLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConverterDialog({ open, blockName, blockLabel, onConfirm, onCancel }: Props) {
  const displayName = blockLabel && blockLabel !== blockName ? `${blockLabel} (${blockName})` : blockName

  return (
    <Dialog isOpen={open} onOpenChange={o => { if (!o) onCancel() }}>
      <DialogTitle>Type convertible détecté</DialogTitle>
      <DialogDescription>
        Type convertible détecté : insérer automatiquement le Block adaptateur <strong>{displayName}</strong> ?
      </DialogDescription>
      <DialogFooter>
        <Button
          label="Annuler"
          variant="secondary"
          size="sm"
          onClick={onCancel}
        />
        <Button
          label="Insérer"
          variant="primary"
          size="sm"
          onClick={onConfirm}
        />
      </DialogFooter>
    </Dialog>
  )
}
