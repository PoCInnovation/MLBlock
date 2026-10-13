# Spécification — Passage du frontend en SPA pure (Vite + TanStack Router)

Date : 2026-10-13
Statut : Proposition — en attente de validation
Périmètre : `frontend/`, `render.yaml`, `docs/coolify/`, `.github/workflows/ci.yml` (lecture seule, aucun changement attendu)

---

## 1. Contexte & intention

Le frontend est servi comme site statique (`render.yaml` : `runtime: static`, `staticPublishPath: dist/client` ; `frontend/Dockerfile` : `serve -s dist/client`). Il parle directement à FastAPI (`src/api/client.ts`, axios) et à Supabase (auth + Realtime) depuis le navigateur. Il n'existe **aucune** server function ni route API TanStack Start (`createServerFn` / `createAPIFileRoute` : 0 occurrence dans `src/`).

Pourtant le build de production passe par `@tanstack/react-start` (prerender) alors que le dev tourne en SPA (`vite.config.ts` : `isDev ? tanstackRouter : tanstackStart`). Conséquences constatées :

- **Le prerender ne produit aucun contenu utile.** `dist/client/cours/<slug>/index.html` contient `<title>MLBlock</title>` et `<div id="root">Chargement…</div>` : `RootComponent` rend le splash tant que `authReady` (posé dans un `useEffect`, donc jamais au build) est `false`. Aucun meta, OpenGraph ni JSON-LD de cours n'est émis ; les `head()` des routes `cours.tsx` / `cours.$slug.tsx` sont du code mort en prod (`HeadContent` n'est rendu nulle part dans `src/`).
- **Deux stacks de build** (dev ≠ prod) et un hack de réparation (`scripts/fix-prerender.mjs`) qui ré-enveloppe le HTML généré.
- **Double initialisation** de l'auth/QueryClient : `src/main.tsx` (`Root` + `App`) et `src/routes/__root.tsx` (`RootComponent`) font chacun `getSession()` + `onAuthStateChange()` + `QueryClientProvider`. En SPA (dev) les deux s'exécutent.

**Intention** : une seule stack, la même en dev et en prod, la plus simple possible, avec un vrai gain SEO/partage social sur les pages de cours — sans changer la logique réseau, l'auth ni le routeur.

## 2. Décisions déjà actées avec le propriétaire

- Rester sur **React** (le canvas repose sur `@xyflow/react`).
- Garder **TanStack Router** (23 fichiers l'importent ; `validateSearch` + Zod sur `/editor` ; comparaison faite avec React Router 8 : pas de search params typés, migration disproportionnée).
- Cible : **SPA pure**, pas de SSR (choix explicite « SPA pure (TanStack Router) »).
- Souci : « le plus simple, efficace, éprouvé ».

## 3. Objectifs, non-objectifs, anti-objectifs

### Objectifs
1. Supprimer `@tanstack/react-start`, `scripts/fix-prerender.mjs` et la bifurcation dev/prod de `vite.config.ts`.
2. Sortie de build unique dans `frontend/dist/` (fin de `dist/client` / `dist/server`).
3. Mettre à jour tous les consommateurs du chemin de sortie : `package.json` (`start`), `Dockerfile` (`CMD`), `render.yaml` (`staticPublishPath`), scripts SEO.
4. Une seule source d'initialisation providers/auth (plus de doublon `main.tsx` / `__root.tsx`).
5. Pages de cours : HTML statique par cours (`dist/cours/<slug>/index.html`) avec `<title>`, description, canonical, OpenGraph/Twitter et JSON-LD réels, injectés au build. `/cours` et `/` reçoivent aussi leur head.
6. `sitemap.xml`, `robots.txt`, `llms.txt` continuent d'être générés, dans `dist/`.

### Non-objectifs
- Pas de SSR, pas de rendu du markdown au build (le corps du cours reste rendu côté client ; seul le `<head>` statique est injecté).
- Pas de changement de logique de `api/client.ts`, de l'auth Supabase, du Realtime, du backend.
- Pas de migration vers React Router, pas de changement de framework UI.

### Anti-objectifs (échec même si « ça marche »)
- Réintroduire un second mécanisme de build/prerender « léger ».
- Régresser le routage : deep link `/editor?pipeline=<uuid>`, redirection `/login` si non connecté, `/cours/<slug>`.
- Double balise `<title>` / `description` / `canonical` après hydratation.

## 4. Contraintes

- `pnpm@9.15.4`, Node ≥ 22 (voir `Dockerfile`, CI). Pas de `npm`/`yarn`.
- Hébergement statique : fallback SPA `/* → /index.html` (Render `routes` rewrite ; `serve -s`). Les fichiers existants (`dist/cours/<slug>/index.html`) sont servis avant le fallback.
- Variables d'env build inchangées : `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `VITE_SITE_URL`. Le build CI/Docker tourne avec des valeurs placeholder Supabase : ne doit pas planter.
- `public/{sitemap.xml,robots.txt,llms.txt}` sont **versionnés** aujourd'hui (générés puis committés) : à traiter explicitement (voir §6).

## 5. Changements prévus (vue d'ensemble)

| Fichier | Changement |
|---|---|
| `frontend/package.json` | Retirer `@tanstack/react-start`. `build` : `tsc --noEmit && vite build && node scripts/generate-seo.mjs`. `start` : `serve -s dist -l tcp://0.0.0.0:80`. Lockfile régénéré (`pnpm install`). |
| `frontend/vite.config.ts` | Plugins : `tanstackRouter({ target: 'react', autoCodeSplitting: true })`, `react()`, `tailwindcss()`. Suppression de `isDev`, `slugs`, `fs`, `pages`, `prerender`, `sitemap`. |
| `frontend/scripts/fix-prerender.mjs` | Supprimé. |
| `frontend/scripts/generate-seo.mjs` | Écrit dans `dist/` seulement ; génère en plus les `dist/cours/<slug>/index.html` (+ `dist/cours/index.html`) à partir de `dist/index.html` en remplaçant le `<head>`. Valeurs échappées HTML. |
| `frontend/src/router.tsx` | Supprimé (`getRouter` n'est utilisé que par Start). |
| `frontend/src/main.tsx` | Réduit à `createRouter({ routeTree, scrollRestoration: true })` + `Register` + `RouterProvider`. Plus de `Root`/`App`/`QueryClient` ici. |
| `frontend/src/routes/__root.tsx` | Unique propriétaire : `QueryClientProvider`, `ThemeProvider`, `Toaster`, abonnement `onAuthStateChange` + stash, et `<HeadContent />` pour que les `head()` de routes soient réellement appliqués côté client. |
| `frontend/Dockerfile` | `CMD [... "serve", "-s", "dist", ...]` (remplace `dist/client`). |
| `docker-compose.yml` & `docker-compose.coolify.yml` | Audités : aucun chemin de build ni volume en dur (délèguent au Dockerfile). Aucun changement nécessaire. |
| `render.yaml` | `staticPublishPath: dist`. |
| `docs/coolify/coolify-deployment.md` | Vérifier/mettre à jour toute mention du chemin de sortie (le doc cite « Nginx » alors que l'image utilise `serve` : à ne corriger que si c'est lié). |

## 6. Détails de conception

### 6.1 Head statique des pages de cours
Au build, `generate-seo.mjs` lit chaque `src/content/cours/*.md`, extrait `title` et `description` du frontmatter (simple lecture clé/valeur ; le parseur complet de `content/cours/index.ts` dépend de `import.meta.glob` et n'est pas importable depuis Node), puis écrit le HTML. Contenu injecté : `<title>`, `meta description`, `og:title/description/image/type`, `twitter:card`, `link rel=canonical`, JSON-LD `Course` — mêmes valeurs que `head()` de `cours.$slug.tsx`. Base URL : `SITE_URL` (déjà utilisé par le script).

### 6.2 Source de vérité du head & absence de doublons
Deux producteurs coexistent : le HTML statique injecté (crawlers sans JS, aperçus Discord/LinkedIn) et `head()` + `<HeadContent />` (navigation client). Risque : `<title>`/meta dupliqués après hydratation. À valider par un smoke test (compter `title`, `meta[name=description]`, `link[rel=canonical]` dans `document.head` sur `/cours/<slug>` en chargement direct puis après navigation client). Si doublons : retirer `head()` des routes de cours au profit du seul HTML statique + `document.title`, ou l'inverse. **Choix laissé au builder selon le résultat.**

### 6.3 Initialisation auth
`__root.tsx` a déjà `beforeLoad` qui `await getSession()` puis `setUser` ; `editor.tsx` re-vérifie. Le garde `authReady` + splash « Chargement… » en devient redondant. **Ma recommandation (non validée) :** supprimer `authReady`/splash et laisser `beforeLoad` bloquer le rendu ; à confirmer par test des cas : (a) `/editor?pipeline=<uuid>` déconnecté → `/login`, (b) connecté → éditeur chargé, (c) session expirée → stash `pending-stash` écrit.

### 6.4 Fichiers versionnés `public/*`
`generate-seo.mjs` écrit aujourd'hui dans `dist`, `dist/client` **et** `public/`. En SPA on n'écrit que dans `dist/`. Le builder décide s'il garde des copies versionnées dans `public/` (utile pour `vite dev`) ou les supprime et les ajoute à `.gitignore`. **Ma décision par défaut :** ne plus écrire dans `public/` pendant le build (effet de bord sur l'arbre source) et laisser les fichiers existants tels quels jusqu'à décision du propriétaire.

### 6.5 `scrollRestoration`
`router.tsx` (prod/Start) active `scrollRestoration: true` ; `main.tsx` (dev) non. **Mon choix :** l'activer, comportement de prod conservé.

## 7. Plan de vérification (acceptation)

1. `pnpm install --frozen-lockfile` (après mise à jour du lockfile), `pnpm run build`, `pnpm test`, `pnpm exec eslint . --max-warnings 0`, `pnpm knip` : verts, `knip` sans nouveau fichier orphelin.
2. `dist/` contient `index.html`, `assets/`, `sitemap.xml`, `robots.txt`, `llms.txt`, `cours/<slug>/index.html` pour **chaque** `.md` ; pas de `dist/client`, pas de `dist/server`.
3. Chaque `dist/cours/<slug>/index.html` : `<title>` = « <titre du cours> — MLBlock », description, canonical, OG, JSON-LD valide (`JSON.parse`), inclut le `<script type="module">` d'entrée Vite.
4. Servir `dist/` (`pnpm start` ou `serve -s dist`) : `/`, `/cours`, `/cours/<slug>`, `/login`, `/editor` répondent ; chargement direct de `/cours/<slug>` rend le cours ; URL inconnue retombe sur `index.html`.
5. Navigateur réel (smoke) : login → `/projets` → ouverture d'un projet → `/editor` ; recharge de `/editor?pipeline=<uuid>` ; pas de doublon de balises head (§6.2).
6. Docker : `docker build frontend` puis le conteneur sert `dist/` avec health check OK (`wget http://127.0.0.1:80/`).

## 8. Laissé au builder

- Ordre des commits, formulation exacte du script d'injection.
- Choix 6.2 (quelle source de head gagne) et 6.4 selon les résultats de test.
- Mise à jour de `AGENTS.md` du projet si une phrase sur `router.tsx`/Start y subsiste (le commentaire de `router.tsx` mentionne une version d'AGENTS qui parle d'un « shim »).

## 9. Risques connus

- Perte d'un éventuel indexage actuel des URLs `/cours/*` : non mesurée (pas d'accès à Search Console). Le prerender actuel n'émet pas de contenu, donc régression improbable ; le head statique est une amélioration nette.
- Les aperçus sociaux dépendent du fait que l'hébergeur serve `dist/cours/<slug>/index.html` avant le rewrite `/*` : à confirmer sur Render après déploiement (hors périmètre local).

## 10. Appels du rédacteur (à relire)

Issus de la relecture « builder » ; aucun n'est une décision du propriétaire.

1. **Parsing du frontmatter au build** : lecture par regex clé/valeur (`title`, `description`), **aucune nouvelle dépendance** (pas de `gray-matter`). Les 9 cours actuels n'utilisent que des valeurs scalaires pour ces deux champs.
2. **Auth** : suppression de `authReady` et du splash « Chargement… » ; `beforeLoad` racine bloque le rendu jusqu'à la session. Repli : si un flash ou une régression apparaît aux tests de §6.3, réintroduire un garde minimal dans `__root.tsx`.
3. **`public/*` SEO** : le build n'y écrit plus ; les trois fichiers versionnés restent en place, sans modification, jusqu'à ta décision.
4. **Head** : `head()` des routes + `<HeadContent />` conservés par défaut ; si le smoke test de §6.2 montre des doublons, retirer `head()` des routes de cours et garder le HTML statique + `document.title`.
5. **`scrollRestoration: true`** conservé (comportement de prod actuel).
