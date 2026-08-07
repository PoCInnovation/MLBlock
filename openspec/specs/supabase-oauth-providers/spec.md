## Purpose

Les utilisateurs peuvent se connecter avec Microsoft (et Google) via OAuth, en plus de l'email/mot de passe et du lien magique.

## Requirements

### Requirement: Login Microsoft
The frontend MUST expose a Microsoft sign-in via `signInWithOAuth({ provider: 'azure', options: { scopes: 'email' } })` (provider `azure` = Microsoft dans supabase-js), avec un bouton « Continuer avec Microsoft » dans LoginPage, même traitement d'erreur que Google (`mapSupabaseError`).

#### Scenario: Bouton Microsoft
- **WHEN** l'utilisateur clique « Continuer avec Microsoft » sur la page login
- **THEN** `signInWithOAuth({ provider: 'azure', options: { scopes: 'email' } })` est appelé, avec loading + gestion d'erreur FR

#### Scenario: Erreur OAuth
- **WHEN** le provider Azure retourne une erreur
- **THEN** un message FR s'affiche (via `mapSupabaseError`), sans crash

### Requirement: Env frontend documenté
The frontend env MUST be documented with the real values: `VITE_SUPABASE_URL=https://hrvbsbkcbtgephuntgqd.supabase.co` and `VITE_SUPABASE_PUBLISHABLE_KEY` (from `backend/.env`), with `.env.example` as the versioned reference.

#### Scenario: Valeurs réelles
- **WHEN** un développeur configure `frontend/.env`
- **THEN** la doc indique exactement les deux variables et où trouver leurs valeurs

### Requirement: Checklist dashboard documentée
The repo MUST document the manual dashboard steps to enable Google and Microsoft providers: credentials from Google Cloud Console and Azure Entra ID, redirect URI `https://hrvbsbkcbtgephuntgqd.supabase.co/auth/v1/callback`, Site URL `https://mlblock-frontend.onrender.com`, Confirm email ON.

#### Scenario: Checklist Google/Microsoft
- **WHEN** un mainteneur suit `docs/supabase-auth.md`
- **THEN** il peut activer les deux providers dans le dashboard avec les credentials des consoles tierces et les bonnes URL de callback
