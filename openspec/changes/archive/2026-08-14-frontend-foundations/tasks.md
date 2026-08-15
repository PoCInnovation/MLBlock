## 1. Phase 1 — Tailwind v4 (socle CSS)

- [x] 1.1 Installer `tailwindcss` et `@tailwindcss/vite` (v4) et enregistrer le plugin dans `vite.config.ts`
- [x] 1.2 Ajouter `@import "tailwindcss";` dans `src/index.css` (préflight inclus) et vérifier le démarrage du dev server
- [x] 1.3 Mapper `src/theme.ts` vers `@theme` : `--color-<kebab-case>` pour chaque entrée de `theme.color` (bg, surface, surface2/3/4, canvas, accent, accentLight, text, textLight, textMuted, textDim, border, divider, status, error, success, warning, convert, info…) et `--spacing-*`, `--radius-*`, `--shadow-*` quand les valeurs sont exprimables
- [x] 1.4 Vérifier que les variables générées restent accessibles via `var(--color-...)` pour les styles dynamiques (border-top coloré du bloc, couleurs du canvas)
- [x] 1.5 Refactorer les composants `src/components/ui/` (card, dropdown-menu, hover-card, separator, dialog, field) : styles inline → classes utilitaires Tailwind
- [x] 1.6 Refactorer les composants flow (BlockNode, ColumnNode, FlowLink) : styles inline → classes utilitaires
- [x] 1.7 Refactorer les pages (EditorPage, ProjectsPage, LoginPage, RegisterPage) : styles inline → classes utilitaires
- [x] 1.8 Regrouper le CSS custom restant dans `@layer components` (pas d'`@apply` systématique)
- [x] 1.9 Smoke navigateur : rendu vérifié sur éditeur, projets, login, register après le préflight (corriger toute régression visuelle)

## 2. Phase 2 — Search params + zod (état de l'éditeur dans l'URL)

- [x] 2.1 Créer `src/utils/editorParams.ts` : schéma zod `editorParams` (`pipeline: z.string().uuid().optional()`, `view: z.enum(['free','grid']).default('free')`) avec `safeParse` uniquement et fallback sur les défauts en cas d'URL invalide
- [x] 2.2 Au chargement de l'éditeur : lire les search params — `loadPipeline` si `pipeline` est présent ; initialiser `viewMode` depuis `view`
- [x] 2.3 Brancher l'écriture : tout changement de `viewMode` → `setSearchParams` ; le pipeline ouvert → `pipeline` dans l'URL (le stash `mlb-pending-<userId>` reste inchangé)
- [x] 2.4 Retirer le localStorage `mlb-view-mode` (lecture et écriture) ; le défaut reste `free`
- [x] 2.5 Smoke navigateur : refresh conserve pipeline et vue ; une URL `/editor?pipeline=<uuid>&view=grid` partagée restaure l'état ; une URL invalide retombe sur les défauts

## 3. Phase 3 — TanStack Query (état serveur)

- [x] 3.1 Installer `@tanstack/react-query` (v5) et ajouter `QueryClientProvider` dans `src/main.tsx` avec un client singleton (via `useState`)
- [x] 3.2 Remplacer le `fetchCatalog` du boot par `useQuery(['catalog'])` avec un `staleTime` long (le catalogue change rarement)
- [x] 3.3 Remplacer `listPipelines` par `useQuery(['pipelines'])`, invalidée après chaque mutation (create/update/delete)
- [x] 3.4 Remplacer `getPipeline` par `useQuery(['pipeline', id])` qui alimente `loadPipeline` (le store reste consommateur)
- [x] 3.5 Remplacer `pollJob` (setInterval maison, 40 tries, sans cleanup) par `useQuery(['job', jobId])` avec `refetchInterval` conditionnel : 3 s, désactivé quand le statut est `done` ou `error`
- [x] 3.6 Remplacer le `getJobOutputs` du timer par `useQuery(['job-outputs', jobId], { enabled: status === 'done' })`
- [x] 3.7 Convertir l'orchestration du run en `useMutation` (même séquence dans `mutationFn` : toServerPayload → validateGraph → ensureDraft/updatePipeline → buildPipeline → executePipeline → jobId) ; messages console conservés ; `onSuccess` → suivi du job
- [x] 3.8 Option A : supprimer `running`, `startRun`, `stopRun`, `failRun` du store et refactorer le UI complet (bouton Run, guards, console) pour lire `isPending` et les états de la mutation
- [x] 3.9 `onStop` → cancel de la mutation/polling (arrêt de l'attente côté UI)
- [x] 3.10 Smoke navigateur : run complet (graphe invalide, succès, arrêt via onStop), suivi du job sans polling maison, erreurs par étape affichées dans la console
