# Proposal: supabase-oauth-providers

## Why

L'auth Supabase est à moitié câblée : le code frontend gère email/password et Google (`signInWithGoogle`), mais **Microsoft manque** (pas de fonction ni de bouton), le `frontend/.env` est vide (aucune auth ne fonctionne réellement), et les providers Google/Microsoft ne sont pas configurés dans le dashboard Supabase (projet `hrvbsbkcbtgephuntgqd`). L'utilisateur veut « juste ajouter Google et Microsoft en sign-in provider ».

## What Changes

- **Code** : `signInWithMicrosoft()` dans `services/auth.ts` (`signInWithOAuth({ provider: 'azure', options: { scopes: 'email' } })` — `azure` = Microsoft dans supabase-js, scope `email` requis par Supabase Auth) + bouton « Continuer avec Microsoft » dans `LoginPage`.
- **Env** : `frontend/.env` documenté avec les vraies valeurs (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`, disponibles dans `backend/.env`) + `.env.example` complet.
- **Checklist dashboard** : doc `docs/supabase-auth.md` — configuration providers Google/Microsoft (credentials depuis Google Cloud Console + Azure Entra ID, redirect URI `https://hrvbsbkcbtgephuntgqd.supabase.co/auth/v1/callback`), Site URL, Confirm email. Actions manuelles hors repo.

## Capabilities

### New Capabilities
- `supabase-oauth-providers`: login Microsoft côté frontend, env documenté, checklist dashboard Google/Microsoft.

### Modified Capabilities
<!-- Aucune spec existante — capability nouvelle. -->
