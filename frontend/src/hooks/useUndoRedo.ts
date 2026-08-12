import { useEffect } from 'react'
import useAppStore from '../store/useAppStore'

/** Raccourcis clavier undo/redo de l'éditeur : Ctrl/Cmd+Z (undo),
    Ctrl/Cmd+Shift+Z et Ctrl/Cmd+Y (redo). Ignorés quand le focus est dans un
    champ de saisie (le navigateur gère l'annulation du texte). */
export function useUndoRedo(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target && target.isContentEditable)
      ) {
        return
      }
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const store = useAppStore.getState()
      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
      } else if (key === 'y') {
        e.preventDefault()
        store.redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
