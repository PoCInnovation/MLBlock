## Why

Un utilisateur qui modifie son projet (blocs du canvas ou nom) puis quitte la page — navigation, back/forward, refresh, fermeture d'onglet, déconnexion — **perd silencieusement son travail** : la pipeline vit uniquement en mémoire, rien n'est persisté avant le clic « Sauvegarder » (décision explicite). Le cas le plus douloureux : la session expire en cours d'édition → le guard redirige vers /login et le canvas est perdu. Aucun avertissement ni filet de récupération n'existe.

## What Changes

- **Détection de modifications** : fingerprint de l'état projet (script, flowNodes, flowEdges, projectName) comparé au snapshot du dernier save/load — une comparaison, pas un flag (aucune action à oublier).
- **Garde de navigation** : migration React Router `BrowserRouter` → `createBrowserRouter` + `useBlocker` dans `EditorPage` — couvre logo, menu, boutons back/forward en un point.
- **Dialog « Modifications non sauvegardées »** (composant `Dialog` Base UI, déjà installé — même pattern que le shadcn dialog proposé) avec 3 actions : [Sauvegarder et quitter] [Quitter sans sauvegarder] [Rester]. Utilisé aussi pour la **déconnexion** quand le projet est modifié.
- **Stash de récupération localStorage** (`mlblock-pending-<userId>`) : session expirée ou refresh/fermeture d'onglet avec travail non sauvegardé → snapshot sync écrit dans localStorage → après login (ou reload), **restauration automatique** du canvas + toast « Travail récupéré ». « Quitter sans sauvegarder » supprime le stash (discard explicite).
- **`beforeunload`** : prompt natif conservé quand dirty + stash sync écrit (filet de récupération).

## Capabilities

### New Capabilities
- `unsaved-changes`: garde de navigation, dialog de confirmation, stash de récupération localStorage, restauration après login/reload.

### Modified Capabilities
<!-- Aucune spec existante modifiée — capability purement nouvelle. -->

## User Impact

- Plus jamais de perte silencieuse : chaque sortie avec modifications déclenche une confirmation.
- Session expirée → le travail est récupéré après reconnexion (automatique, toast).
- Refresh accidentel → le travail revient après reload.
- Le modal de logout invite à sauvegarder avant de partir.
