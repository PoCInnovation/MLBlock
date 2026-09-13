import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { theme } from '../../theme'

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
        Type convertible détecté : insérer automatiquement le bloc adaptateur <strong>{displayName}</strong> ?
      </DialogDescription>
      <DialogFooter>
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: theme.radius.md,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            background: 'rgba(255,255,255,.06)',
            color: theme.color.textMuted,
            border: `1px solid ${theme.color.border}`,
            fontFamily: 'inherit',
          }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: theme.radius.md,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            background: theme.color.accent,
            color: '#fff',
            border: 'none',
            fontFamily: 'inherit',
          }}
        >
          Insérer
        </button>
      </DialogFooter>
    </Dialog>
  )
}
