## 1. Code frontend

- [x] 1.1 `services/auth.ts` : ajouter `signInWithMicrosoft()` (`provider: 'azure'`, `options.scopes: 'email'`)
- [x] 1.2 `LoginPage.tsx` : bouton « Continuer avec Microsoft » (même style/loading/erreur que Google)

## 2. Env

- [x] 2.1 `frontend/.env.example` : commenter les vraies valeurs attendues (URL du projet + clé publishable)
- [x] 2.2 Doc : indiquer que `frontend/.env` doit contenir les valeurs réelles (disponibles dans `backend/.env`)

## 3. Checklist dashboard

- [x] 3.1 Créer `docs/supabase-auth.md` : Google Cloud (client Web, origins, redirect URI `…/auth/v1/callback`, scopes), Azure Entra (app registration, secret, scope email), dashboard (Site URL, redirects localhost, Confirm email, toggle providers), notes free tier SMTP + expiration du secret Azure

## 4. Vérification

- [x] 4.1 Build frontend (`npm run build`) — tsc OK
- [x] 4.2 Smoke : le bouton Microsoft est rendu et déclenche `signInWithOAuth` (provider azure) — vérifié en inspectant le handler (le flux OAuth complet nécessite les credentials dashboard)
