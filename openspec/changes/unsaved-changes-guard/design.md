## Context

La pipeline vit en mémoire (store zustand) : `script` (linéaire), `flowNodes`/`flowEdges` (avancé), `projectName` (éditable inline, persisté au save seulement). Seul `mlblock-editor-mode` et la session sont en localStorage. Les chemins de sortie : 3 navigations React Router (logo → `/`, menu → `/projets`, Déconnexion), back/forward (popstate), refresh/fermeture (beforeunload). `LoginPage` navigue vers `/editor` après connexion — point de restauration naturel. Base UI (déjà installé pour le menu ⋮) fournit `Dialog`/`AlertDialog` — pas besoin de react-aria-components.

## Goals / Non-Goals

**Goals:**
- Avertir avant toute sortie avec modifications non sauvegardées (navigation, back/forward, logout)
- Récupérer le travail non sauvegardé après session expirée ou refresh (stash localStorage)
- Dialog accessible partagé (Base UI), actions : sauvegarder et quitter / quitter sans sauvegarder / rester

**Non-Goals:**
- Autosave (contredit « sauvegardé uniquement à la sauvegarde »)
- Persistance multi-onglets (une seule entrée par user, PoC)
- TTL du stash (une entrée/user suffit ; ajout si accumulation)
- Garde sur les pages hors éditeur (le travail vit dans l'éditeur)

## Decisions

### D1 — Dirty par fingerprint, pas par flag
`isDirty()` compare `JSON.stringify({script, flowNodes, flowEdges, projectName})` au `savedFingerprint` stocké au dernier save/load/import/« nouveau projet ». Aucune action mutatrice à modifier — les oublis de future évolution ne peuvent pas rendre le garde muet. Coût : un stringify par check (canvas petit).

### D2 — Garde de navigation via data router + useBlocker
Migration `BrowserRouter` → `createBrowserRouter` (7 routes en routes array + wrapper `RequireAuth` qui lit `user` du store ; le gate `authReady` reste global dans App). `useBlocker` dans `EditorPage` : `blocker.state === 'blocked'` → dialog. Couvre les 3 navigations + back/forward en un point. Condition : blocker actif seulement si `user` existe et `isDirty()` (pas de garde sur session expirée).

### D3 — Dialog Base UI partagé
`components/ui/dialog.tsx` : `Dialog`, `DialogTitle`, `DialogDescription`, `DialogFooter` (styles tokens du thème, scrim 55%, fermeture Escape/outside). Contenu « Modifications non sauvegardées » partagé entre le guard de navigation et le logout (mêmes 3 actions). Le logout : menu → si `isDirty()` → dialog → « Sauvegarder et quitter » (savePipeline puis signOut+navigate) / « Quitter sans sauvegarder » (discard stash + signOut) / « Rester ». Si propre → logout direct.

### D4 — Stash de récupération localStorage
Format : `{name, nodes, edges, pipelineId, savedAt}` sous `mlblock-pending-<userId>`.
- **Session expirée** (user → null dans EditorPage, effect watch) : stash sync + le redirect /login existant fait le reste.
- **beforeunload** (dirty, avec ou sans session) : stash sync (écriture synchrone autorisée) + prompt natif conservé.
- **Restauration** (EditorPage mount) : stash présent → `loadPipeline(stash)` + toast « Travail récupéré — Sauvegarder pour conserver » + suppression du stash. `pipelineId` restauré si présent (le save fera PUT, sinon POST).
- **« Quitter sans sauvegarder »** : supprime le stash (discard explicite).

### D5 — Ordre des checks à la sortie
1. `isDirty()` ? sinon sortie directe.
2. `user` ? sinon stash + sortie (le redirect gère le login).
3. Dialog : [Sauvegarder et quitter] async save → proceed ; [Quitter sans sauvegarder] discard stash → proceed ; [Rester] reset.

## Risks / Trade-offs

- **Migration router** : restructuration du routing (App.tsx → routes array + RequireAuth) — risque de régression de navigation à couvrir par smoke complet (routes, guards, gate authReady).
- **Stash sur avantunload** : écriture synchrone localStorage OK (petite taille) ; le prompt natif reste (l'utilisateur confirme la sortie, le stash est le filet).
- **Restauration automatique** : un stash ancien se restaure silencieusement au prochain /editor — acceptable PoC (une entrée/user), le toast invite à sauvegarder ou le discard se fait par « Quitter sans sauvegarder ».
- **fingerprint** : le drag avancé met à jour flowNodes à chaque move → dirty pendant le drag (correct) ; la bascule Avancé/Linéaire ne modifie pas le fingerprint (conversion, pas contenu).
