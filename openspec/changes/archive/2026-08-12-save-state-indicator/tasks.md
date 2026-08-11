## 1. Implémentation

- [x] 1.1 `EditorHeader.tsx` : bouton « Sauvegarder » principal — `disabled={!isDirty() || saving}`, style grisé quand désactivé, label « Sauvegardé » + icône Check quand propre
- [x] 1.2 Build frontend : `npm run build` (tsc + vite) OK

## 2. Validation

- [x] 2.1 Smoke navigateur : ouvrir l'éditeur (bouton « Sauvegardé » désactivé), modifier le canvas (bouton « Sauvegarder » actif), sauvegarder (retour à « Sauvegardé »)
- [x] 2.2 Commit + push dev/chedli + fast-forward main