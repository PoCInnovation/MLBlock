## 1. Supabase — RLS policies & trigger

- [x] 1.1 Créer les RLS policies sur `profiles` (SELECT, UPDATE pour `auth.uid() = id`)
- [x] 1.2 Créer les RLS policies sur `pipelines` (SELECT, INSERT, UPDATE, DELETE pour `user_id = auth.uid()`)
- [x] 1.3 Créer les RLS policies sur `jobs` (SELECT pour `user_id = auth.uid()`)
- [x] 1.4 Créer les RLS policies sur `job_outputs` (SELECT via subquery `jobs.user_id`)
- [x] 1.5 Créer la trigger function `handle_new_user()` et l'associer à `auth.users` pour insérer dans `profiles`

## 2. Frontend — Setup Supabase client

- [x] 2.1 Installer `@supabase/supabase-js`
- [x] 2.2 Créer `services/supabase.ts` — initialiser le client avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`
- [x] 2.3 Créer `services/auth.ts` — fonctions `signInWithEmail`, `signInWithMagicLink`, `signInWithGoogle`, `signUp`, `signOut`, `getSession`
- [x] 2.4 Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans `frontend/.env.example`

## 3. Frontend — Pages Login & Register

- [x] 3.1 Créer `pages/LoginPage.tsx` — formulaire email/pwd + magic link + Google boutons
- [x] 3.2 Créer `pages/RegisterPage.tsx` — formulaire email + password + confirmation
- [x] 3.3 Ajouter les routes dans `App.tsx` (screen: 'login', 'register')

## 4. Frontend — Axios interceptor & store

- [x] 4.1 Ajouter un `request interceptor` dans `api/client.ts` qui injecte le Bearer token
- [x] 4.2 Ajouter `user` state dans le store Zustand (`useAppStore`)
- [x] 4.3 Protéger `EditorPage.tsx` : rediriger vers login si pas de session
- [x] 4.4 Ajouter bouton Login/Logout dans la navbar (`HomeNav`, `EditorHeader`)

## 5. Déploiement

- [ ] 5.1 Configurer les env vars frontend sur Render (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
- [ ] 5.2 Commit, push, déployer
