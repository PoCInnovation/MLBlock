# Proposal: auth-refresh-persistence

## Why

Deux problèmes d'auth : (1) la session est perdue au refresh — le guard de `App.tsx` rend les routes avant que `getSession()` ne résolve (race : `/editor` → `<Navigate to="/login">` puis le user arrive et reste coincé sur /login), alors que la session est bien persistée en localStorage par supabase-js ; (2) le navigateur ne propose pas d'enregistrer email/mot de passe — les inputs n'ont pas d'attributs `autoComplete`.

## What Changes

- **Auth-ready gate** : `App.tsx` attend la résolution de `getSession` (splash bref) avant de rendre les routes — le refresh sur `/editor` restaure la session sans passer par /login.
- **Enregistrement navigateur** : `autoComplete` sur les inputs — login (`email` / `current-password`), register (`email` / `new-password` ×2). Aucun stockage de mot de passe par l'app (le gestionnaire natif du navigateur fait le travail).

## Capabilities

### New Capabilities
- `auth-refresh-persistence`: session restaurée au refresh (gate async) + enregistrement des identifiants par le navigateur (autoComplete).

### Modified Capabilities
<!-- Aucune spec existante — capability nouvelle. -->
