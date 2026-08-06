# Supabase Auth — configuration

## Providers

Google et Microsoft sont activés comme sign-in providers Supabase. Le code
frontend appelle `signInWithOAuth({ provider: 'google' })` et
`signInWithOAuth({ provider: 'azure', options: { scopes: 'email' } })`.

### Callback commun aux deux providers

```
https://hrvbsbkcbtgephuntgqd.supabase.co/auth/v1/callback
```

Déclaré dans Google Cloud Console (OAuth client Web) et Azure Entra ID
(App registration) — identique pour les deux.

## Checklist manuelle (hors repo)

### 1. Google Cloud Console (console.cloud.google.com → Auth Platform → Clients)

- Créer un OAuth client **Web**
- Authorized origins : `https://mlblock-frontend.onrender.com` + `http://localhost:5173`
- Authorized redirect URI : le callback ci-dessus
- Scopes : `openid` + `email` + `profile` (non sensibles → pas de vérification d'app requise)
- Récupérer Client ID (`…apps.googleusercontent.com`) et Client Secret (`GOCSPX-…`)

### 2. Azure Entra ID (portal.azure.com → App registrations)

- **New registration** → Redirect URI (Web) : le callback ci-dessus
- Certificates & secrets → **Client secrets** → copier la **Value** (pas le Secret ID — visible une seule fois)
- Récupérer l'**Application (client) ID** (GUID)
- Noter la date d'expiration du secret (rotation)

### 3. Dashboard Supabase (https://supabase.com/dashboard/project/hrvbsbkcbtgephuntgqd/auth/providers)

- Auth → URL Configuration : Site URL = `https://mlblock-frontend.onrender.com` ; redirects += `http://localhost:5173`
- Providers → Email : **Confirm email** ON
- Providers → Google : toggle ON + Client ID + Secret
- Providers → Microsoft : toggle ON + Client ID + Secret

### 4. Env frontend

`frontend/.env` (gitignoré — les valeurs réelles sont dans `backend/.env`) :

```env
VITE_SUPABASE_URL=https://hrvbsbkcbtgephuntgqd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<valeur de backend/.env>
```

Les credentials OAuth (Google/Microsoft ID + Secret) sont stockés en
sauvegarde dans `backend/.env` (`GOOGLE_CLIENT_ID`… `MICROSOFT_CLIENT_SECRET`).
Le backend ne les consomme pas — ils servent au dashboard Supabase.

## Notes

- **Pas de domaine vérifié ni de vérification d'app requis** (scopes non sensibles) — l'écran de consentement montre un avertissement « non vérifié » sans bloquer.
- **Free tier** : les templates d'email Supabase ne sont pas personnalisables sans SMTP custom (changelog 2026-06-03) — le mail de confirmation reste le template par défaut.
- **Emails Azure non vérifiés** : cas rares (app single-tenant pré-2023) — la doc Supabase recommande le claim optionnel `xms_edov` si applicable.
- Le secret Azure a une date d'expiration — la renouveler avant échéance, sinon le login Microsoft casse.
