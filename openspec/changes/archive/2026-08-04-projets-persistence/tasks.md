## 1. Backend — persistance & limites

- [x] 1.1 Migration : colonne `pipelines.is_draft` (bool, défaut true) + FK `pipelines.user_id → profiles.id` avec `ondelete=CASCADE` (ALTER TABLE)
- [x] 1.2 Schéma : `PipelineNode.position: dict | None` (optionnel) ; `PipelineDetail`/résumé exposent `is_draft`
- [x] 1.3 `POST /api/pipelines` : plafond 20 projets non-drafts → 409 (message FR) ; draft par défaut si `is_draft=true` (run)
- [x] 1.4 `GET /api/pipelines` : filtre `is_draft=false` ; `PUT /{id}` : formalise (name, is_draft=false)
- [x] 1.5 Run : à la création d'un draft, suppression des autres drafts du même utilisateur (1 draft/user)
- [x] 1.6 Tests backend : plafond 20 (409), filtre drafts, formalisation, cascade, draft unique

## 2. Frontend — API & store

- [x] 2.1 Client API : `listPipelines()` (GET, size 100) et `getPipeline(id)` dans `api/client.ts`
- [x] 2.2 Store : action `loadPipeline(nodes, edges)` → script (linéaire) + flowNodes (avancé, positions ou auto-layout fallback) + setPipelineId
- [x] 2.3 Action store `savePipeline(name)` : POST create (nommé) ou PUT update + formalisation du draft

## 3. Frontend — page « Mes projets »

- [x] 3.1 Route `/projets` : liste (cartographie `listPipelines`), cartes nom + date modif, états vide/chargement/erreur
- [x] 3.2 Actions carte : Ouvrir (loadPipeline + navigate /editor), Supprimer (confirm + deletePipeline), Exporter (modal partagé)
- [x] 3.3 « Nouveau projet » (désactivé à 20 avec message FR) et « Importer » (file picker → validation → POST → /editor)
- [x] 3.4 CTA accueil : « Mes projets » → `/projets` (HeroSection)

## 4. Frontend — éditeur : sauvegarde & import/export

- [x] 4.1 Bouton « Sauvegarder » dans EditorHeader (modal de nom au premier save ; formalise le draft)
- [x] 4.2 Modal d'export [JSON | Code] : JSON = pipeline courant ; Code = `POST /{id}/generate` (création draft si pas de pipelineId) ; téléchargement blob
- [x] 4.3 Bouton « Importer » de l'éditeur : fichier `.json` → validation (types connus) → crée + ouvre
- [x] 4.4 useBlockRunner : run sans pipelineId → draft (`is_draft=true`, name « brouillon », cleanup anciens drafts)

## 5. Vérification

- [x] 5.1 Build frontend (`tsc --noEmit && vite build`) + tests backend (`uv run python -m pytest`)
- [x] 5.2 Smoke navigateur : créer → sauvegarder → liste → rouvrir (layout restauré) → exporter JSON → importer (round-trip) → export code → supprimer
