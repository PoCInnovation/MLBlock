## Why

Le frontend souffre d'incohérences structurelles : styles inline partout (~150 objets `CSSProperties`), composants shadcn/ui portés à la main sans socle CSS, fetching dispersé entre `api/client.ts` et le store zustand, et un polling maison fragile (`setInterval` 3 s, 40 tentatives, sans cleanup au démontage). Ce change pose trois fondations qui rendent le frontend cohérent, maintenable et testable.

## What Changes

- **Socle CSS Tailwind v4** : installation de Tailwind v4 (`tailwindcss` + `@tailwindcss/vite`), branchement des tokens de `src/theme.ts` dans `@theme` (couleurs, espacements, rayons, ombres) tout en conservant l'accès via `var(--color-*)` pour les styles dynamiques ; migration progressive des composants portés à la main (`src/components/ui/`, composants flow, pages) des styles inline vers des classes utilitaires ; les nouveaux composants s'installent depuis le registre shadcn natif au lieu d'être portés à la main. Le code reste hybride (inline + classes) pendant la transition.
- **État de l'éditeur dans l'URL** : le pipeline ouvert et le mode de vue (`free`/`grid`) vivent dans les search params (`/editor?pipeline=<uuid>&view=free|grid`), validés par un schéma zod avec fallback sur les défauts en cas d'URL invalide ; le refresh conserve le pipeline ouvert et le mode de vue ; le stockage localStorage du mode de vue est remplacé par l'URL (le stash des changements non sauvegardés est conservé, il reste indépendant).
- **État serveur via TanStack Query** : les fonctions de `api/client.ts` sont enveloppées par des queries/mutations (`catalog`, `pipelines`, `pipeline`, `job`, `job-outputs`) avec invalidation après mutation et suivi du job par refetch à intervalle ; le polling maison (`pollJob` dans `useBlockRunner`) est supprimé ; le run devient une mutation dont l'état (`isPending`) est la source de vérité unique, remplaçant `store.running`/`startRun`/`stopRun`/`failRun` ; les erreurs par étape (graphe invalide, build échoué, 4xx) et les messages console sont conservés.
- **Séparation des responsabilités de l'état** : les données serveur relèvent de TanStack Query (catalogue, pipelines, pipeline, job, sorties, mutations) ; l'état client (nœuds, arêtes, undo/redo, colonnes, mode de vue, console, résultats) reste dans zustand.

## Capabilities

### New Capabilities
- `frontend-foundations`: fondations techniques du frontend — socle CSS basé sur des tokens, état de l'éditeur partageable dans l'URL, et gestion unifiée de l'état serveur

### Modified Capabilities
<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend** : `src/index.css` et `vite.config.ts` (Tailwind v4) ; `src/theme.ts` (tokens branchés dans `@theme`) ; migration des composants `src/components/ui/`, `src/components/flow/` et des pages ; nouveaux modules de validation des paramètres d'éditeur ; refactor de `src/api/client.ts` (enveloppé), `src/store/useAppStore.ts` (état serveur retiré), `src/hooks/useBlockRunner.ts` (polling supprimé) ; `src/main.tsx` (provider de requêtes)
- **Dépendances** : ajout de `tailwindcss` + `@tailwindcss/vite` et `@tanstack/react-query` (v5)
- **Aucun changement backend** ; l'API FastAPI et le contrat HTTP restent identiques
- **Comportements** : le mode de vue et le pipeline ouvert deviennent partageables via l'URL ; le stockage localStorage `mlb-view-mode` est remplacé par l'URL (valeur par défaut inchangée : `free`)
