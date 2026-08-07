# TODO

## Frontend
- [ ] Liste de blocks scrollable, recherchable et filtrable

## OAuth Google + Microsoft

Le code est prêt (Google ✓, Microsoft à ajouter — change `supabase-oauth-providers`).
Reste les étapes manuelles ci-dessous (consoles tierces + dashboard Supabase).

### 1. Google Cloud Console (console.cloud.google.com → Auth Platform → Clients)
- [ ] Créer un OAuth client **Web**
  - Authorized origins : `https://mlblock-frontend.onrender.com` + `http://localhost:5173`
  - Authorized redirect URI : `https://hrvbsbkcbtgephuntgqd.supabase.co/auth/v1/callback`
  - Scopes : openid + email + profile
- [ ] Copier le **Client ID** (`…apps.googleusercontent.com`) et le **Client Secret** (`GOCSPX-…`)

### 2. Azure Entra ID (portal.azure.com → App registrations)
- [ ] **New registration** → Redirect URI (Web) : `https://hrvbsbkcbtgephuntgqd.supabase.co/auth/v1/callback`
- [ ] **Certificates & secrets → Client secrets** → créer un secret → copier la **Value** (pas le Secret ID)
- [ ] Copier l'**Application (client) ID** (le GUID)

### 3. Dashboard Supabase (https://supabase.com/dashboard/project/hrvbsbkcbtgephuntgqd/auth/providers)
- [ ] Auth → URL Configuration : Site URL = `https://mlblock-frontend.onrender.com` ; redirects += `http://localhost:5173`
- [ ] Providers → Email : **Confirm email** ON
- [ ] Providers → **Google** : toggle ON + coller Client ID + Secret
- [ ] Providers → **Microsoft** : toggle ON + coller Client ID + Secret
- [ ] Vérifier le login de bout en bout (bouton Google + bouton Microsoft)

### 4. Env frontend
- [ ] `frontend/.env` : `VITE_SUPABASE_URL=https://hrvbsbkcbtgephuntgqd.supabase.co` + `VITE_SUPABASE_PUBLISHABLE_KEY` (= valeur de `backend/.env`)
- [ ] Coller les 4 valeurs (Google ID/Secret, Microsoft ID/Secret) dans `backend/.env` (variables `GOOGLE_CLIENT_ID`… déjà ajoutées) — sauvegarde

### Notes
- Pas besoin de domaine vérifié ni de vérification d'app (scopes non sensibles)
- Le secret Azure expire — noter la date
- Les templates d'email Supabase ne sont pas personnalisables sur le free tier
