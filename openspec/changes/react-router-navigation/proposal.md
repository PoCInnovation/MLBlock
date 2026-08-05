## Why

Au refresh, la page est perdue : la navigation vit dans le store Zustand (`screen`), qui est en mémoire et reset au reload. L'URL reste `/` donc rien ne peut être restauré. Le problème est résolu en déplaçant la navigation vers l'URL via React Router.

## What Changes

- Ajout de `react-router-dom` comme dépendance
- `App.tsx` : le `switch` sur `screen` devient des `<Routes>`
- `main.tsx` : wrapper `<BrowserRouter>`
- Store : suppression de `screen` et des 6 actions `go*()` (`goBuild`, `goHome`, `goLogin`, `goRegister`, `goHowItWorks`, `goAbout`)
- Les 39 usages de `go*()` dans 9 fichiers remplacent `useNavigate()`
- Route `/editor` protégée (redirige vers `/login` si pas de session)
- Le `render.yaml` garde la rewrite `/* → /index.html` (déjà en place)

## Capabilities

### New Capabilities
- `url-routing`: React Router remplace le routing par état store, URLs partageables, refresh restauré

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `react-router-dom` (+50KB), `App.tsx`, `main.tsx`, store allégé, 9 fichiers migrés
- **Aucun changement backend**
- **Aucun changement render.yaml** (la rewrite SPA existe déjà)
