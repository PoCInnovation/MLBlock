## Context

Le routing actuel est un champ `screen` dans le store Zustand. 39 usages de `go*()` sur 9 fichiers. Au refresh, `screen` reset et l'URL `/` ne permet aucune restauration. Le backend FastAPI est séparé — on veut rester un SPA statique, pas un framework full-stack.

## Goals / Non-Goals

**Goals:**
- URLs routées : `/`, `/editor`, `/login`, `/register`, `/how-it-works`, `/about`
- Refresh restaure la page
- Supprimer `screen` + 6 `go*()` du store
- Route `/editor` protégée

**Non-Goals:**
- Pas de Next.js / TanStack Start (backend séparé, SPA statique suffit)
- Pas de HashRouter (la rewrite SPA Render existe déjà)
- Pas de changement de la logique métier (script, catalog, exécution)

## Decisions

1. **`react-router-dom`** — seul, pas de framework full-stack
   - Alternative: API History native — mais React Router est le standard, ~50KB, bien testé
   - Alternative: Next.js/TanStack — rejeté car backend déjà séparé (2 serveurs pour rien)

2. **`BrowserRouter`** (pas HashRouter)
   - Le `render.yaml` a déjà `routes: [{ type: rewrite, source: /*, destination: /index.html }]`
   - Refresh sur `/editor` → index.html → React Router restaure la route

3. **Structure des routes** dans `App.tsx` :
   ```tsx
   <Routes>
     <Route path="/" element={<HomePage />} />
     <Route path="/editor" element={user ? <EditorPage /> : <LoginPage />} />
     <Route path="/login" element={<LoginPage />} />
     <Route path="/register" element={<RegisterPage />} />
     <Route path="/how-it-works" element={<HowItWorksPage />} />
     <Route path="/about" element={<AboutPage />} />
   </Routes>
   ```

4. **Store** : supprimer `screen`, `goBuild`, `goHome`, `goLogin`, `goRegister`, `goHowItWorks`, `goAbout`. Conserver le reste.

5. **Migration des 39 usages** — remplacement mécanique :
   - `const goBuild = useAppStore(s => s.goBuild)` → `const navigate = useNavigate()`
   - `onClick={goBuild}` → `onClick={() => navigate('/editor')}`
   - Mapping : `goBuild→/editor`, `goHome→/`, `goLogin→/login`, `goRegister→/register`, `goHowItWorks→/how-it-works`, `goAbout→/about`
   - Logout : `signOut(); setUser(null); navigate('/')`

## Risks / Trade-offs

- **[Migration mécanique]** 39 usages → risque d'en rater un → mitigation : grep après migration, build + test
- **[Route protégée]** `/editor` sans session → redirect login → déjà géré par le `user` du store
- **[Historique]** `goHome` resettait `catalog`/`pipelineId` — à recréer dans le handler navigate si nécessaire
