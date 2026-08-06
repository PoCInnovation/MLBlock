# Design: supabase-oauth-providers

## Context

Projet Supabase `hrvbsbkcbtgephuntgqd` ; le backend valide déjà les JWT (`SUPABASE_JWT_SECRET`/`JWKS` configurés). Le frontend (`services/auth.ts`) a `signInWithEmail`, `signUp`, `signInWithGoogle`, magic link — **pas de Microsoft**. `frontend/.env` est vide (valeurs dummy de smoke retirées) — aucune auth ne marche en réel. supabase-js installé = 2.111.0 ; `Provider` union confirmée : Microsoft = `'azure'`. Docs consultées (Context7 + supabase.com) : Google = `signInWithOAuth({ provider: 'google' })` (implicit flow, pas de callback route) ; Azure = `provider: 'azure'` + `options.scopes: 'email'` **obligatoire** (Supabase exige un email valide d'Azure).

## Goals / Non-Goals

**Goals:**
- Login Microsoft fonctionnel côté frontend (fonction + bouton).
- Env frontend documenté (vraies valeurs) + `.env.example` complet.
- Checklist dashboard documentée (Google/Microsoft/email/Site URL).

**Non-Goals:**
- Création des credentials Google Cloud / Azure (comptes tiers — action manuelle documentée).
- Changement du backend (la validation JWT existe déjà).
- Autres providers OAuth (Apple, GitHub…) — hors périmètre.

## Decisions

### D1 — `signInWithMicrosoft` avec le scope email
```ts
export async function signInWithMicrosoft() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email' },
  })
  return { data, error }
}
```
Même signature que `signInWithGoogle` (retour `{data, error}`, gestion d'erreur dans la page). Le scope `email` est requis par Supabase Auth pour Azure (doc).
- *Alternative* : `provider: 'microsoft'` — rejeté : la union `Provider` de supabase-js 2.111.0 n'a que `'azure'`.

### D2 — Bouton LoginPage
« Continuer avec Microsoft » à côté de « Continuer avec Google » — même style `secondaryBtn`, `disabled={loading}`, même `handleX` (setError + setLoading + try/catch + `mapSupabaseError`). Aucun changement RegisterPage (OAuth se déclenche depuis le login).

### D3 — Env frontend
`frontend/.env` (gitignoré) : `VITE_SUPABASE_URL=https://hrvbsbkcbtgephuntgqd.supabase.co` + `VITE_SUPABASE_PUBLISHABLE_KEY=<valeur de backend/.env>`. Le `.env.example` reste la référence versionnée ; la doc indique où trouver les valeurs.

### D4 — Checklist dashboard (`docs/supabase-auth.md`)
Document des actions manuelles (hors repo) :
1. Google Cloud Console → OAuth client **Web** : origins `https://mlblock-frontend.onrender.com` + `http://localhost:5173` ; redirect URI `https://hrvbsbkcbtgephuntgqd.supabase.co/auth/v1/callback` ; scopes openid/email/profile → Client ID + Secret
2. Azure Entra ID → App registration (même redirect URI) → Client secret → Client ID + Secret
3. Dashboard Supabase → Auth → URL Configuration : Site URL `https://mlblock-frontend.onrender.com`, redirects + localhost
4. Dashboard → Providers → Email : Confirm email ON ; Google et Microsoft : toggle + credentials
5. Free tier : templates d'email non personnalisables sans SMTP custom (changelog 2026-06-03) — le mail de confirmation reste le template par défaut

## Risks / Trade-offs

- **Azure emails non vérifiés** : cas rares (app single-tenant pré-2023) — doc Supabase recommande le claim optionnel `xms_edov` ; mentionné dans la checklist mais non bloquant.
- **Credentials à rotation** : le secret Azure a une expiration — noter dans la doc.
- **Le dashboard ne peut pas être vérifié depuis le repo** (Management API 401 avec le token du backend) — la checklist est la source de vérité, la vérification finale = login réel.
