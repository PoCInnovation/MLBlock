# Plan d'Implémentation — Passage en SPA Pure (TanStack Router)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le frontend d'une configuration hybride TanStack Start vers une SPA React 19 pure et légère basée sur TanStack Router, avec génération statique des métadonnées SEO/OpenGraph pour les cours au build.

**Architecture:** Le frontend devient un build Vite statique unique dans `frontend/dist/`, servi par `serve` ou n'importe quel CDN statique avec fallback `/* → /index.html`. Au build, un script Node post-process injecte les métadonnées spécifiques (title, description, OpenGraph, JSON-LD) dans `dist/cours/<slug>/index.html` pour les robots sans exécution JS. Les requêtes applicatives continuent de dialoguer directement en client-side REST avec FastAPI et Supabase.

**Tech Stack:** React 19, Vite 7, TanStack Router (`@tanstack/react-router`, `@tanstack/router-plugin`), TanStack Query, Tailwind CSS v4, Docker, Node.js (scripts de build).

**Spec:** `docs/superpowers/specs/2026-10-13-spa-pure-design.md`

## Global Constraints

- Gestionnaire de paquets : `pnpm@9.15.4` obligatoire dans `frontend/`. Ne jamais utiliser `npm`, `yarn` ni `bun`.
- Sortie de build : un seul dossier `frontend/dist/` (suppression définitive de `dist/client` et `dist/server`).
- Variables d'environnement build : `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` restent supportées sans crash si absentes en local/CI.
- Qualité de code : `pnpm test` (Vitest), `pnpm exec eslint . --max-warnings 0`, `tsc --noEmit` doivent tous être strictement verts.
- Pas de nouvelle dépendance superflue (notamment pas de `gray-matter` : parsing regex léger dans le script SEO).

## Review Focus

1. **Fallback SPA sur route inconnue** : une URL inconnue servie par `serve -s dist` doit renvoyer `dist/index.html` sans erreur 404 du serveur.
2. **Priorité des fichiers statiques de cours** : une requête sur `/cours/predire-valeur-csv/` doit servir `dist/cours/predire-valeur-csv/index.html` (avec son `<head>` pré-rempli) et non le `dist/index.html` racine générique.
3. **Validité syntaxique du JSON-LD généré** : le bloc `<script type="application/ld+json">` injecté dans chaque cours doit être parsable par `JSON.parse` sans erreur de guillemets ou d'échappement HTML.
4. **Guards d'authentification sans écran blanc** : un accès direct à `/editor?pipeline=<uuid>` sans session active doit rediriger proprement vers `/login` sans boucle ni blocage indéfini.
5. **Absence de régression HMR en dev** : `pnpm dev` doit démarrer instantanément et le rechargement à chaud (HMR) CSS/composants doit fonctionner sans erreur de plugin.

---

### Task 1: Nettoyage des dépendances et scripts frontend

**Files:**
- Modify: `frontend/package.json:8-15,22-26`
- Delete: `frontend/scripts/fix-prerender.mjs`
- Modify: `frontend/pnpm-lock.yaml`

**Interfaces:**
- Consumes: néant
- Produces: scripts `build` et `start` mis à jour, suppression du paquet `@tanstack/react-start`.

- [ ] **Step 1: Mettre à jour `frontend/package.json`**
  - Supprimer la dépendance `"@tanstack/react-start": "^1.168.49"` de `dependencies`.
  - Mettre à jour le script `"build"` : `"tsc --noEmit && vite build && node scripts/generate-seo.mjs"`.
  - Mettre à jour le script `"start"` : `"serve -s dist -l tcp://0.0.0.0:80"`.
- [ ] **Step 2: Supprimer le script obsolète `frontend/scripts/fix-prerender.mjs`**
- [ ] **Step 3: Mettre à jour le lockfile pnpm**
  Run: `cd frontend && pnpm install`
  Expected: lockfile régénéré proprement sans `@tanstack/react-start`.
- [ ] **Step 4: Valider que `@tanstack/react-start` n'est plus présent**
  Run: `grep "react-start" frontend/package.json`
  Expected: aucun résultat (code retour 1).
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/package.json frontend/pnpm-lock.yaml
  git rm frontend/scripts/fix-prerender.mjs
  git commit -m "chore(frontend): remove @tanstack/react-start and fix-prerender script"
  ```

---

### Task 2: Unification de la configuration Vite & suppression de router.tsx

**Files:**
- Modify: `frontend/vite.config.ts:1-44`
- Delete: `frontend/src/router.tsx`

**Interfaces:**
- Consumes: `@tanstack/router-plugin/vite`
- Produces: Configuration Vite unifiée pour build et dev en SPA pure.

- [ ] **Step 1: Nettoyer `frontend/vite.config.ts`**
  - Supprimer l'import de `tanstackStart` (`@tanstack/react-start/plugin/vite`), `fs`, `coursDir`, `slugs`, et la variable `isDev`.
  - Ne conserver que les plugins nécessaires :
    ```typescript
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import tailwindcss from '@tailwindcss/vite'
    import { tanstackRouter } from '@tanstack/router-plugin/vite'
    import path from 'path'
    import { fileURLToPath } from 'url'

    const __dirname = path.dirname(fileURLToPath(import.meta.url))

    export default defineConfig({
      plugins: [
        tanstackRouter({ target: 'react', autoCodeSplitting: true }),
        react(),
        tailwindcss(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    })
    ```
- [ ] **Step 2: Supprimer `frontend/src/router.tsx`**
  - Supprimer ce fichier qui n'était conservé que pour l'export `getRouter` requis par Start.
- [ ] **Step 3: Vérifier le typecheck**
  Run: `cd frontend && pnpm exec tsc --noEmit`
  Expected: PASS (aucun appel résiduel à `getRouter` ou `react-start`).
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/vite.config.ts
  git rm frontend/src/router.tsx
  git commit -m "refactor(frontend): unify vite.config for pure SPA and remove router.tsx"
  ```

---

### Task 3: Unification des points d'entrée et gestion de l'auth (`main.tsx` & `__root.tsx`)

**Files:**
- Modify: `frontend/src/main.tsx:1-76`
- Modify: `frontend/src/routes/__root.tsx:1-73`

**Interfaces:**
- Consumes: `routeTree` (`./routeTree.gen`), `onAuthStateChange`, `getSession` (`./services/auth`), `HeadContent` (`@tanstack/react-router`)
- Produces: Arborescence de composants propre avec une seule instance de `QueryClientProvider`, gestion d'auth sans splash bloquant, et activation de `<HeadContent />`.

- [ ] **Step 1: Simplifier `frontend/src/main.tsx`**
  - Réduire `main.tsx` au rôle d'entrée React SPA standard :
    - Instancier `createRouter({ routeTree, scrollRestoration: true })`.
    - Déclarer le module TanStack Router (`Register`).
    - Rendre directement `<RouterProvider router={router} />` dans l'élément `#root`.
    - Supprimer la duplication de `Root`, `App`, `QueryClientProvider`, et le `useState(authReady)`.
- [ ] **Step 2: Mettre à jour `frontend/src/routes/__root.tsx`**
  - Importer `HeadContent` depuis `@tanstack/react-router`.
  - Conserver `beforeLoad` pour charger la session avant la résolution des routes filles.
  - Dans `RootComponent` :
    - Conserver `QueryClientProvider`, `ThemeProvider`, `Toaster`.
    - Ajouter `<HeadContent />` juste avant `<Outlet />`.
    - Conserver le listener `onAuthStateChange` pour gérer la synchronisation du store et le stash de secours (`writeStash`).
    - Supprimer le state `authReady` et le bloc de splash bloquant (`if (!authReady) return Chargement…`).
- [ ] **Step 3: Exécuter les tests unitaires frontend**
  Run: `cd frontend && pnpm test`
  Expected: PASS (tous les tests Vitest passent sans régression).
- [ ] **Step 4: Exécuter le linter**
  Run: `cd frontend && pnpm exec eslint src/main.tsx src/routes/__root.tsx --max-warnings 0`
  Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/main.tsx frontend/src/routes/__root.tsx
  git commit -m "refactor(frontend): centralize providers in __root and enable HeadContent"
  ```

---

### Task 4: Extension de `generate-seo.mjs` pour injection statique des métadonnées

**Files:**
- Modify: `frontend/scripts/generate-seo.mjs:1-42`
- Create: `frontend/scripts/generate-seo.test.mjs`

**Interfaces:**
- Consumes: `dist/index.html` (produit par `vite build`), fichiers `src/content/cours/*.md`
- Produces: `dist/sitemap.xml`, `dist/robots.txt`, `dist/llms.txt`, et `dist/cours/<slug>/index.html` avec métadonnées complètes.

- [ ] **Step 1: Écrire le test unitaire pour l'injection SEO (`scripts/generate-seo.test.mjs`)**
  - Vérifier que le parser frontmatter extrait correctement `title` et `description`.
  - Vérifier que l'injection remplace `<title>`, insère `<meta name="description">`, OpenGraph, canonical et le JSON-LD sans altérer le reste du template HTML.
- [ ] **Step 2: Exécuter le test pour vérifier l'échec initial**
  Run: `node --test frontend/scripts/generate-seo.test.mjs`
  Expected: FAIL (fonctions non encore exportées/implémentées).
- [ ] **Step 3: Mettre à jour `frontend/scripts/generate-seo.mjs`**
  - Supprimer les écritures dans `public/` et `dist/client/` : cibler uniquement `distDir = path.join(__dirname, '../dist')`.
  - Implémenter l'extraction frontmatter via regex :
    ```javascript
    export function extractFrontmatter(content) {
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (!match) return { title: '', description: '' }
      const yaml = match[1]
      const titleMatch = yaml.match(/^title:\s*(.+)$/m)
      const descMatch = yaml.match(/^description:\s*(.+)$/m)
      const clean = (s) => (s ? s.trim().replace(/^['"]|['"]$/g, '') : '')
      return {
        title: clean(titleMatch?.[1]),
        description: clean(descMatch?.[1]),
      }
    }
    ```
  - Implémenter la génération des fichiers `dist/cours/<slug>/index.html` :
    - Lire `dist/index.html` comme template de base.
    - Pour chaque `.md` dans `src/content/cours/` :
      - Extraire `title` et `description`.
      - Injecter les balises dans `<head>` :
        - `<title>${title} — MLBlock</title>`
        - `<meta name="description" content="${description}" />`
        - Balises OpenGraph (`og:title`, `og:description`, `og:type=article`, `og:image`, `og:url`)
        - Balises Twitter (`twitter:card=summary_large_image`)
        - `<link rel="canonical" href="${base}/cours/${slug}" />`
        - `<script type="application/ld+json">` avec schéma `Course` valide.
      - Écrire dans `path.join(distDir, 'cours', slug, 'index.html')`.
    - Générer également `dist/cours/index.html` avec le titre et la description de catalogue.
    - Générer `sitemap.xml`, `robots.txt`, `llms.txt` dans `dist/`.
- [ ] **Step 4: Exécuter le test de validation SEO**
  Run: `node --test frontend/scripts/generate-seo.test.mjs`
  Expected: PASS.
- [ ] **Step 5: Nettoyer le fichier de test unitaire throwaway**
  Run: `rm frontend/scripts/generate-seo.test.mjs`
- [ ] **Step 6: Commit**
  ```bash
  git add frontend/scripts/generate-seo.mjs
  git commit -m "feat(frontend): generate per-course static HTML with full SEO and OG metadata"
  ```

---

### Task 5: Mise à jour de Dockerfile et Render

**Files:**
- Modify: `frontend/Dockerfile:34-35`
- Modify: `render.yaml:55`

**Interfaces:**
- Consumes: dossier de sortie de build unifié `dist/`
- Produces: configurations de build et de déploiement pointant sur `dist/`.

- [ ] **Step 1: Mettre à jour `frontend/Dockerfile`**
  - Modifier la directive `CMD` :
    ```dockerfile
    CMD ["./node_modules/.bin/serve", "-s", "dist", "-l", "tcp://0.0.0.0:80"]
    ```
- [ ] **Step 2: Mettre à jour `render.yaml`**
  - Ligne 55 : changer `staticPublishPath: dist/client` en `staticPublishPath: dist`.
- [ ] **Step 3: Vérifier que `docker-compose.yml` et `docker-compose.coolify.yml` sont intacts**
  - Vérifier par relecture qu'ils pointent bien vers `frontend/Dockerfile` sans chemin codé en dur.
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/Dockerfile render.yaml
  git commit -m "chore(infra): point Dockerfile and Render static path to dist"
  ```

---

### Task 6: Validation complète de bout en bout (Build, Tests, Lint, Knip & Smoke)

**Files:**
- Verification only

**Interfaces:**
- Consumes: l'ensemble des livrables des tâches 1 à 5
- Produces: preuve d'exécution complète et absence de régression.

- [ ] **Step 1: Exécuter le build de production complet**
  Run: `cd frontend && pnpm run build`
  Expected: Succès complet (Vite build + generate-seo).
- [ ] **Step 2: Valider le contenu de `frontend/dist/`**
  Run:
  ```bash
  test -f frontend/dist/index.html && \
  test -f frontend/dist/sitemap.xml && \
  test -f frontend/dist/robots.txt && \
  test -f frontend/dist/llms.txt && \
  test -f frontend/dist/cours/predire-valeur-csv/index.html && \
  echo "Dist structure valid"
  ```
  Expected: `"Dist structure valid"`.
- [ ] **Step 3: Valider l'intégrité du HTML généré d'un cours**
  - Vérifier que `<title>` contient le vrai titre du cours et que le JSON-LD est parsable :
  ```bash
  node -e "
    const fs = require('fs');
    const html = fs.readFileSync('frontend/dist/cours/predire-valeur-csv/index.html', 'utf8');
    if (!html.includes('Prédire une valeur continue')) throw new Error('Missing title');
    const jsonLdMatch = html.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/);
    if (!jsonLdMatch) throw new Error('Missing JSON-LD');
    JSON.parse(jsonLdMatch[1]);
    console.log('Course HTML & JSON-LD valid');
  "
  ```
  Expected: `"Course HTML & JSON-LD valid"`.
- [ ] **Step 4: Exécuter la suite complète de tests Vitest**
  Run: `cd frontend && pnpm test`
  Expected: PASS.
- [ ] **Step 5: Exécuter le linter ESLint strict**
  Run: `cd frontend && pnpm exec eslint . --max-warnings 0`
  Expected: PASS.
- [ ] **Step 6: Exécuter l'analyse de code mort Knip**
  Run: `cd frontend && pnpm dlx knip --no-exit-code`
  Expected: aucun nouveau fichier orphelin ni exportation morte.
- [ ] **Step 7: Smoke test local avec le serveur statique**
  - Lancer brièvement `serve -s frontend/dist -l 3000` en arrière-plan, requêter `http://localhost:3000/cours/predire-valeur-csv` et `http://localhost:3000/editor`, puis arrêter le serveur.
  Expected: codes HTTP 200 renvoyés correctement.
- [ ] **Step 8: Rapport final et conclusion**
