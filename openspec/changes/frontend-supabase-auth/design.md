## Context

Frontend actuel : aucune auth. Backend : valide les JWT Supabase via `get_current_user()`. Supabase : projet connecté, auth configurée (email/password, magic link, Google OAuth), JWT secret et JWKS URL renseignés.

## Goals / Non-Goals

**Goals:**
- Login / Register / Logout fonctionnels depuis le frontend
- Token JWT envoyé sur chaque appel API au backend
- Éditeur protégé : redirige vers Login si pas de session
- RLS policies assurant l'isolation des données par user
- Trigger pour créer le row `profiles` à l'inscription

**Non-Goals:**
- Ne pas changer le backend (auth déjà prête)
- Ne pas ajouter de gestion de rôles (tous les users sont égaux)
- Ne pas gérer le password reset (sera une future amélioration)

## Decisions

1. **Client Supabase JS initialisé dans un module dédié** (`services/supabase.ts`)
   - Configuré avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Singleton exporté, réutilisé partout

2. **Auth service** (`services/auth.ts`) avec interface simple :
   - `signInWithEmail(email, password)`
   - `signInWithMagicLink(email)`
   - `signInWithGoogle()`
   - `signUp(email, password)`
   - `signOut()`
   - `getSession()` — check au mount de l'app
   - Pas de lib externe de UI — les pages sont en React pur avec le store

3. **Axios interceptor** : dans `api/client.ts`, ajouter un `request interceptor` qui lit le token depuis le service auth et l'injecte dans `Authorization: Bearer <token>`

4. **Pages dédiées** :
   - `/login` : formulaire email/pwd + boutons magic link et Google
   - `/register` : email + password + confirmation
   - Navigation depuis la Home Navbar (déjà stylée)

5. **Protection de l'éditeur** : dans `EditorPage.tsx`, checker `user` dans le store au mount. Si pas de session, rediriger vers Login (changer `screen` dans le store)

6. **RLS policies** : une policy par table :
   - `profiles` : `USING (auth.uid() = id)` pour SELECT/UPDATE
   - `pipelines` : `USING (auth.uid() = user_id)` pour SELECT/INSERT/UPDATE/DELETE
   - `jobs` : `USING (auth.uid() = user_id)` pour SELECT
   - `job_outputs` : `USING (job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid()))`

7. **Trigger profiles** : `on_auth_user_created` — function Supabase qui insert dans `profiles` avec `id = NEW.id`

## Risks / Trade-offs

- **[Dépendance externe]** `@supabase/supabase-js` ajoute ~15KB au bundle → acceptable
- **[UX OAuth]** Google OAuth nécessite de configurer les redirect URIs dans la Google Cloud Console → mitigation : commencer par email/pwd + magic link, Google optionnel
- **[RLS existantes]** Les RLS sont déjà activées sur les 4 tables mais sans policies → les requêtes tombent par défaut. Ajouter les policies avant le déploiement frontend
