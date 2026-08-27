import { Dialog, DialogTitle, DialogDescription, DialogFooter } from './dialog'
import { Save, LogOut, X } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import { theme } from '../../theme'

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '9px 16px', borderRadius: theme.radius.md,
  fontWeight: 800, fontSize: 13.5, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
  transition: 'filter .15s ease',
}

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
          style={{ ...btnBase, background: 'rgba(34,197,94,.18)', color: theme.color.successMuted, border: `1px solid rgba(34,197,94,.4)`, opacity: busy ? 0.6 : 1 }}
        >
          <Icon icon={Save} size="sm" /> Sauvegarder et quitter
        </button>
        <button
          onClick={onDiscard}
          disabled={busy}
          style={{ ...btnBase, background: 'rgba(224,112,95,.16)', color: theme.color.errorLight, border: `1px solid rgba(224,112,95,.4)`, opacity: busy ? 0.6 : 1 }}
        >
          <Icon icon={LogOut} size="sm" /> Quitter sans sauvegarder
        </button>
        <button onClick={onCancel} disabled={busy} style={{ ...btnBase, background: 'rgba(255,255,255,.06)', color: theme.color.textLight, border: `1px solid ${theme.color.border}` }}>
          <Icon icon={X} size="sm" /> Rester
        </button>
      </DialogFooter>
    </Dialog>
  )
}
