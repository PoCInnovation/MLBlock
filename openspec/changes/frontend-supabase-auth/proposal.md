## Why

Le frontend n'a aucune authentification : les pages sont toutes publiques et les appels API n'envoient pas de JWT. Les routes protégées du backend (pipelines, jobs, execute) sont donc inaccessibles depuis le frontend. On ajoute Supabase Auth pour permettre l'inscription, la connexion et la transmission du token au backend.

## What Changes

- Ajout de `@supabase/supabase-js` comme dépendance frontend
- Création de pages Login et Register dédiées
- Création d'un service auth (`signIn`, `signUp`, `signOut`, `getSession`) et intégration Axios interceptor pour le Bearer JWT
- L'éditeur (`/build`) est protégé : redirige vers Login si pas de session
- Ajout de `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans `.env.example` frontend
- Ajout des RLS policies sur les tables Supabase (profiles, pipelines, jobs, job_outputs)
- Trigger Supabase pour créer une ligne `profiles` à l'inscription

## Capabilities

### New Capabilities
- `user-auth-frontend`: pages Login/Register, service auth, Axios interceptor, protection de l'éditeur
- `supabase-rls-policies`: RLS policies et trigger `profiles` à l'inscription

### Modified Capabilities
<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `package.json` (+@supabase/supabase-js), `src/pages/` (+LoginPage, RegisterPage), `src/services/` (+supabase.ts, +auth.ts), `src/api/client.ts` (axios interceptor), `src/store/useAppStore.ts` (+user state), `src/App.tsx` (routing), `frontend/.env.example`
- **Supabase**: RLS policies sur 4 tables, trigger `on_auth_user_created`
- **Déploiement**: Frontend à rebuild, nouvelles env vars frontend à configurer sur Render
