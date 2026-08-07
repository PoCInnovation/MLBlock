## 1. Fondations — fingerprint + dialog

- [x] 1.1 Store : `savedFingerprint` + `isDirty()` (JSON.stringify script/flowNodes/flowEdges/projectName vs snapshot) ; snapshot au loadPipeline, savePipeline succès, clearAll+« nouveau projet »
- [x] 1.2 `components/ui/dialog.tsx` : Dialog Base UI (Title/Description/Footer, scrim 55%, Escape/outside, styles tokens)

## 2. Router — data router + useBlocker

- [x] 2.1 Migration `BrowserRouter` → `createBrowserRouter` : routes array (7 routes), wrapper `RequireAuth` (user du store), gate `authReady` global conservé
- [x] 2.2 `useBlocker` dans EditorPage : activé si `user` && `isDirty()` → dialog 3 actions (sauvegarder et quitter async / quitter sans sauvegarder + discard stash / rester)
- [x] 2.3 Smoke navigation : toutes les routes + guards + gate + back/forward

## 3. Logout + stash

- [x] 3.1 Déconnexion : si `isDirty()` → même dialog (save→signOut / discard→signOut / rester) ; sinon logout direct
- [x] 3.2 Stash : helper `pending-stash.ts` (write/read/clear, clé `mlblock-pending-<userId>`, format {name, nodes, edges, pipelineId, savedAt})
- [x] 3.3 Session expirée : effect EditorPage sur user→null → stash sync si dirty
- [x] 3.4 beforeunload : stash sync si dirty + prompt natif conservé
- [x] 3.5 Restauration : EditorPage mount → stash présent → loadPipeline + toast « Travail récupéré — Sauvegarder pour conserver » + clear stash

## 4. Vérification

- [x] 4.1 Build frontend (`tsc --noEmit && vite build`)
- [x] 4.2 Smoke navigateur : modif → navigation (dialog, 3 actions) ; modif → logout ; refresh avec modif → restauration ; session expirée (user null simulé) → stash + login → restauration ; « Quitter sans sauvegarder » → stash supprimé
