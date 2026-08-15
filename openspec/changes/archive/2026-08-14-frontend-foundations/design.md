## Context

- Frontend React 18 + Vite + TypeScript strict, **sans Tailwind** : les composants shadcn/ui sont portés à la main en styles inline dans `src/components/ui/` (card.tsx, dropdown-menu.tsx, hover-card.tsx, separator.tsx [Radix], dialog.tsx, field.tsx).
- Design system : `src/theme.ts` — objet JS (`color` avec 30+ entrées : bg, surface, surface2/3/4, accent, text, textMuted, border… ; `spacing`, `radius`, `shadow`), consommé via imports JS / style objects, sans variables CSS.
- CSS global brut : `src/index.css` (styles ReactFlow, règles canvas : `.grid-mode`, `.react-flow__node-block`, `.block-drag-handle`…).
- Fetching dispersé : `src/api/client.ts` (fetchCatalog, listPipelines, getPipeline, updatePipeline, deletePipeline, validateGraph, buildPipeline, executePipeline, getJob, getJobOutputs) ; le store zustand `src/store/useAppStore.ts` fait du fetch au boot (fetchCatalog) ; `src/hooks/useBlockRunner.ts` orchestre le run avec un `pollJob` maison (setInterval 3 s, 40 tries, pas de cleanup au démontage — bugs latents).
- Éditeur : `src/pages/EditorPage.tsx`, canvas `src/components/flow/` (FlowCanvas, BlockNode, ColumnNode, FlowLink, BlockSegments, FlowPalette), routes statiques dans `src/router.tsx` (8 routes), garde RequireAuth ; préférence de vue `viewMode` persistée en localStorage (`mlb-view-mode`).
- Backend FastAPI : hors périmètre. Motivation : voir proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Poser Tailwind v4 comme socle CSS : tokens du `theme.ts` branchés en variables CSS (`@theme`), préflight, `@layer components` ; refactor progressif des styles inline vers des classes utilitaires.
- Mettre l'état de l'éditeur dans l'URL (`/editor?pipeline=<uuid>&view=free|grid`) avec validation zod, remplaçant le localStorage `mlb-view-mode`.
- Remplacer le fetching du store et le polling maison par TanStack Query (état serveur), avec une frontière claire Query (serveur) / zustand (client) et des fonctions d'API enveloppées, pas réécrites.

**Non-Goals:**
- Pas de migration vers TanStack Router (React Router v7 conservé tel quel).
- Pas de positions de nœuds dans l'URL (elles restent dans le backend).
- Pas de réécriture de l'API client (`src/api/client.ts` est enveloppé, pas réécrit).
- Pas de changement du backend FastAPI ni du modèle de données pipeline.
- Pas d'autosave ni de parallélisation du run (hors périmètre du change).

## Decisions

### Phase 1 — Tailwind v4 (socle CSS)

#### D1. Tailwind v4 via le plugin Vite
Installation de `tailwindcss` + `@tailwindcss/vite` (v4) ; plugin déclaré dans `vite.config.ts` ; `@import "tailwindcss"` en tête de `src/index.css`.
- *Alternative rejetée* : config PostCSS standalone (v3) — le plugin Vite est le chemin officiel v4, zéro config supplémentaire.

#### D2. Tokens : `theme.ts` → `@theme` (variables CSS)
Mapper chaque entrée de `theme.color` en `--color-<kebab-case>` (bg, surface, surface2, surface3, surface4, canvas, accent, accentLight, text, textLight, textMuted, textDim, border, divider, status, error, success, warning, convert, info…), ainsi que `--spacing-*`, `--radius-*`, `--shadow-*` quand les valeurs sont exprimables. Les classes utilitaires Tailwind correspondantes (`bg-surface`, `text-muted`…) découlent automatiquement des variables.
- *Alternative rejetée* : garder le `theme.ts` comme seule source et générer les classes à la volée — les utilitaires Tailwind exigent des tokens CSS ; `@theme` est le mécanisme natif v4, le `theme.ts` reste la source unique dont les variables sont dérivées.

#### D3. Les variables restent accessibles pour les styles dynamiques
Les variables générées (`var(--color-accent)`, etc.) restent utilisables directement dans les styles dynamiques existants : border-top coloré du bloc, couleurs du canvas. Pour le bloc, la couleur de catégorie reste dynamique via `var(--color-<categorie>)`.

#### D4. Préflight inclus par défaut, risque assumé et contrôlable
Le préflight (reset CSS) est inclus par défaut. Risque sur le rendu existant (styles ReactFlow, canvas) : à vérifier au smoke test de la phase ; si le rendu casse de façon non réparable par ajustement, le préflight peut être désactivé (décision documentée, coût : perte du reset propre).

#### D5. Refactor progressif, ordre imposé
(a) composants `src/components/ui/` (card, dropdown-menu, hover-card, separator, dialog, field) : styles inline → classes utilitaires ; (b) composants flow (BlockNode, ColumnNode, FlowLink) ; (c) pages (EditorPage, ProjectsPage, LoginPage, RegisterPage). Le code reste hybride (inline + classes) pendant la transition — assumé, nettoyé au fil des étapes.

#### D6. CSS custom composé via `@layer components`
Les règles CSS custom (canvas, ReactFlow) sont composées dans `@layer components`, sans recours systématique à `@apply`.

#### D7. shadcn natif ensuite
Les nouveaux composants s'installent depuis le registre shadcn ; les portages manuels cessent (les composants `ui/` existants restent, migrés en D5, et sont remplacés au fil des besoins).

### Phase 2 — Search params + zod (état de l'éditeur dans l'URL)

#### D8. URL cible et schéma zod
URL cible : `/editor?pipeline=<uuid>&view=free|grid`. Nouveau module `src/utils/editorParams.ts` avec `editorParams = z.object({ pipeline: z.string().uuid().optional(), view: z.enum(['free','grid']).default('free') })`. Toujours `safeParse` (jamais `parse`) : URL invalide → fallback sur les défauts (`view: 'free'`, pas de pipeline).

#### D9. Sync zustand ↔ URL
- À l'ouverture de l'éditeur : lecture des search params → `loadPipeline` si `pipeline` présent ; `viewMode` initialisé depuis `view`.
- Changements : `viewMode` → `setSearchParams` (le localStorage `mlb-view-mode` est **remplacé** par l'URL ; le défaut reste `free`).
- Le pipeline ouvert : `pipeline` dans l'URL (le refresh conserve le pipeline ; le stash `mlb-pending-<userId>` reste pour les changements non sauvegardés — mécanisme indépendant, inchangé).

#### D10. Pas de positions de nœuds dans l'URL
Trop lourd ; les positions vivent dans le backend (inchangé).

#### D11. React Router v7 suffit
Pas de migration TanStack Router — décision arrêtée, `react-router-dom` v7 couvre search params + navigation.

### Phase 3 — TanStack Query (état serveur)

#### D12. `QueryClientProvider` dans `src/main.tsx`
Installation de `@tanstack/react-query` (v5) ; client singleton créé via `useState` dans `src/main.tsx`.

#### D13. Frontière Query / zustand
Query = état **serveur** (catalog, pipelines, pipeline, job, sorties, mutations) ; zustand = état **client** (nodes, edges, undo/redo, columns, viewMode, consoleLines, results). Le store ne fait plus de fetch.

#### D14. Fonctions d'API enveloppées, pas réécrites
`src/api/client.ts` reste tel quel ; chaque fonction est enveloppée par une query/mutation :
- `useQuery(['catalog'])` — staleTime long (le catalogue change rarement).
- `useQuery(['pipelines'])` — invalidée après chaque mutation.
- `useQuery(['pipeline', id])` — alimente `loadPipeline` (le store consomme).
- `useQuery(['job', jobId], { refetchInterval: (q) => ['done','error'].includes(q.state.data?.status) ? false : 3000 })` — **remplace `pollJob`** (setInterval maison, 40 tries, pas de cleanup : bugs latents).
- `useQuery(['job-outputs', jobId], { enabled: status === 'done' })` — remplace le `getJobOutputs` dans le timer.

#### D15. Run : `useMutation`
`useBlockRunner` (useCallback maison) → `useMutation` : même orchestration dans `mutationFn` (toServerPayload → validateGraph → ensureDraft/updatePipeline → buildPipeline → executePipeline → jobId) ; messages console conservés ; `onSuccess` → suivi du job (query `['job', jobId]`). Le run garde les erreurs par étape (graphe invalide → messages console, build échoué, 4xx du suivi).

#### D16. Option A : `isPending` source de vérité
`mutation.isPending` devient la source de vérité. `store.running`, `startRun`, `stopRun`, `failRun` sont **supprimés** ; le UI (bouton Run, guards, console) lit `isPending` et les états de la mutation. Refactor complet du UI, pas seulement du store.
- *Alternative rejetée* (option B implicite) : garder `running` dans le store et le synchroniser avec la mutation — double source de vérité, désynchronisation possible.

#### D17. `onStop` → cancel
Le stop annule la mutation/le polling (comportement : arrêter l'attente côté UI).

## Risks / Trade-offs

- **Préflight (reset) sur le rendu existant** : le reset Tailwind peut casser visuellement les styles ReactFlow / canvas et les composants pas encore migrés ; vérification au smoke test de la phase 1, désactivation possible (D4).
- **Option A — refactor UI complet** : suppression de `running`/`startRun`/`stopRun`/`failRun` touche le bouton Run, les guards et la console en même temps que le store — blast radius large, à faire dans un seul passage coordonné (pas d'état intermédiaire désynchronisé).
- **Vite dev watch** : les changements de forme du store (état supprimé/renommé) peuvent laisser l'état HMR périmé — redémarrer le dev server après édition du store.
- **Code hybride pendant la transition** : styles inline + classes utilitaires coexistent (phase 1) et store + Query coexistent (phase 3) — incohérences visuelles/architecturales temporaires assumées, résolues à la fin de chaque phase.
