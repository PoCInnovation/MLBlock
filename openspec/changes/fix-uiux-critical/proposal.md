## Why

L'audit UI/UX (skill ui-ux-pro-max) a révélé des problèmes critiques qui cassent l'expérience : le mode avancé ne montre aucun feedback de run (console invisible), le run envoie des labels français au lieu des types (graphe invalide), le workflow d'auth n'a aucun loading ni gestion d'erreur, et l'accessibilité est quasi absente (zéro focus, contrôles non-clavier).

## What Changes

- **Mode avancé** : afficher la ConsolePanel en mode flow, envoyer `data.type` au lieu du label français comme type de node
- **Auth** : loading state sur login/register/logout, try/catch, messages d'erreur en français, vérifier `data.user` au register (faux succès)
- **Accessibilité** : retirer `outline: 'none'`, ajouter `:focus-visible`, convertir les `<span onClick>`/`<div onClick>` cliquables en `<button>`
- **Contraste** : corriger `#6f665e`/`#6b6560` sur fond sombre (messages succès, footer, empty states)
- **Supprimer les `■ Arrêté` trompeur** après une erreur de build (ne pas confondre échec et stop)

## Capabilities

### New Capabilities
- `flow-run-feedback`: console visible en mode avancé + types corrects au run
- `auth-feedback`: loading, try/catch, erreurs FR, validation register

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `FlowCanvas.tsx`, `useBlockRunner.ts`, `LoginPage.tsx`, `RegisterPage.tsx`, `HomeNav.tsx`, `EditorHeader.tsx`, `index.css`, `ConsolePanel.tsx`, `useAppStore.ts`
- **Aucun changement backend**
