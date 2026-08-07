## Context

Le backend possède déjà un CRUD pipelines complet et scopé par utilisateur : `GET/POST /api/pipelines`, `GET/PUT/DELETE /{id}`, `POST /{id}/generate` (→ `{"code": main.py}`), `POST /{id}/execute`. La table `pipelines` stocke `nodes`/`edges` (JSON), une colonne `code` (alimentée à l'exécution uniquement — provenance, pas persistance), et les FKs cascade jobs/job_outputs existent. Le run frontend (`useBlockRunner`) crée/update silencieusement un pipeline « mon-premier-modèle » au premier run ; `pipelineId` vit en mémoire. Les boutons Importer/Exporter de l'éditeur sont des placeholders sans `onClick`. Aucune page projets, aucun load explicite, aucun save nommé.

## Goals / Non-Goals

**Goals:**
- Persister les pipelines comme projets nommés, listables, rouvrables, supprimables (20 max/utilisateur)
- Sauvegarde explicite depuis l'éditeur ; le run crée un brouillon invisible qui ne pollue pas la liste
- Import/export JSON (format MLBlock) + export du code généré à la demande
- Restaurer le canvas (linéaire et avancé, avec layout) à l'ouverture d'un projet
- Backend inchangé sur la génération de code (déterministe, à la demande)

**Non-Goals:**
- Stocker le main.py à la sauvegarde (généré à l'export/exécution uniquement)
- Route de conversion main.py → JSON (le JSON est la source de vérité)
- Versioning / historique des projets
- Collaboration multi-utilisateurs, partage, rôles
- Renommage des blocs / édition du code généré dans l'éditeur

## Decisions

### D1 — JSON = source de vérité ; main.py généré à la demande
Le save écrit uniquement `nodes`/`edges` (JSON). `POST /{id}/generate` (existant) produit le main.py à l'export code et à l'exécution. La colonne `code` existante reste telle quelle (provenance d'exécution).

### D2 — Modèle draft
- Nouvelle colonne `pipelines.is_draft: bool = True` (migration SQL simple, défaut `true` pour les nouvelles lignes).
- Run sans `pipelineId` → `POST` avec `name="brouillon"`, `is_draft=true` ; à la création d'un draft, suppression des autres drafts de l'utilisateur (1 seul draft actif).
- « Sauvegarder » : sans `pipelineId` → `POST` (nom saisi, `is_draft=false`) ; avec `pipelineId` → `PUT` + formalisation (`name`, `is_draft=false`).
- `GET /api/pipelines` filtre `WHERE is_draft = false` (liste « Mes projets »).
- Le plafond de 20 compte les projets non-drafts.

### D3 — Format JSON étendu : position optionnelle
`PipelineNode` gagne `position: dict[x,y] | None = None`. Rétro-compatible : les lignes existantes et les imports sans position chargent avec auto-layout (fallback client, placement en grille/snake). Les flux du canvas avancé stockent/restaurent les positions via ce champ.

### D4 — Page « Mes projets » et navigation
- Nouvelle route `/projets` (React Router) ; le CTA de `HeroSection` navigue vers `/projets` (texte « Mes projets »).
- Cartes : nom, date de modification, menu d'actions (Ouvrir / Exporter / Supprimer avec confirmation).
- « Nouveau projet » → `/editor` vierge. « Importer » → sélecteur de fichier → validation → `POST` → `/editor` sur le projet créé.
- L'éditeur ouvre un projet : `GET /{id}` → action store `loadPipeline` (conversion JSON serveur → script + flowNodes + positions ; auto-layout si absence).

### D5 — Import/Export dans l'éditeur et dans « Mes projets »
- **Exporter** (header éditeur + carte projet) : modal de choix [JSON | Code] → téléchargement blob (`application/json` / `text/x-python`). Code = `POST /{id}/generate` (si pas de `pipelineId` dans l'éditeur, création du draft d'abord).
- **Importer** (header éditeur + page projets) : fichier `.json` → validation (schéma MLBlock : nodes/edges, types connus du catalogue, sinon 400 avec message FR) → crée un projet → ouvre dans l'éditeur.
- Le JSON exporté est exactement le format accepté à l'import (symétrie).

### D6 — Plafond 20 et cascade
- `POST /api/pipelines` : si `count(projets non-drafts de l'utilisateur) >= 20` → `409` « Limite de 20 projets atteinte ». Le frontend désactive « Nouveau projet » et affiche le message.
- FK `pipelines.user_id → profiles.id` : ajout de `ondelete=CASCADE` (migration ALTER TABLE) pour la cascade user → pipelines → jobs → job_outputs.

### D7 — Client API frontend
Ajout de `listPipelines()` (GET, paginé — page 1, size 100) et `getPipeline(id)` dans `api/client.ts`.

## Risks / Trade-offs

- **Drafts orphelins** : un run sans save puis refresh laisse un draft (invisible) — borné à 1 draft/utilisateur par le cleanup à la création ; acceptable pour un PoC. Risque faible.
- **Migration `is_draft`** : les pipelines existants en db (créés par les runs précédents) deviennent invisibles dans « Mes projets » (drafts). Acceptable — ils étaient déjà « mon-premier-modèle » anonymes ; l'utilisateur peut les rouvrir via un nouvel export si besoin. À documenter.
- **Position du canvas** : le format ne stockait pas le layout ; les projets antérieurs à la change se ré-ouvrent avec auto-layout. Perte ponctuelle, sans régression pour les nouveaux.
- **Synchronisation save/run** : run puis save sur le même canvas → PUT idempotent, pas de conflit (pas de multi-tab géré — hors scope).
- **Import strict** : les fichiers JSON non-MLBlock (autre outil) sont rejetés — format propriétaire assumé (l'import « respecte notre format json »).
