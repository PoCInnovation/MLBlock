# MLBlock — Todo list

> Mise à jour : 2026-08-07. `[x]` = fait, `[ ]` = reste à faire.

## UI & expérience

### Fait
- [x] Icônes Lucide partout, **zéro émoji** (~30 remplacés : Save/Play/Square, Upload/Download, FileText/FileCode2, toasts, CSV, landing)
- [x] Navbar de l'éditeur désengorgée : 12 contrôles → 5 + menu ⋮ (Base UI) — Importer/Exporter/Mes projets/Tout effacer/Déconnexion dans le menu
- [x] Garde « modifications non sauvegardées » : dirty par fingerprint, dialog 3 actions à la navigation/logout, **stash localStorage + restauration** après refresh ou session expirée (bannière « Travail récupéré »)
- [x] Audit a11y : `prefers-reduced-motion` respecté, contraste `textDim` 4.4:1, contrôles upload en `<button>`, état vide recherche palette
- [x] Hover states + transitions 150ms (CTA hero, cartes projets, palette, boutons)
- [x] Nom du projet éditable inline dans le header (persisté au save uniquement)
- [x] Boutons « Mes projets » (nav accueil + header éditeur)
- [x] Cohérence palette (tokens `inputBg`/`status`/`rail`)

### Reste à faire
- [ ] Animation « convoyeur de camions » sur les liens entre blocs
- [ ] Sélecteur multi-runs dans le panel Résultats
- [ ] Responsive mobile de l'éditeur / projets / auth (desktop-first assumé)

## Blocks

### Fait
- [x] Types + conversions : feu tricolore, dérivation inputs, multi-sorties, `df_to_tensor`, 5 blocs réparés
- [x] Params éditables + intelligence (métadonnées docstring FR, autocomplétion colonnes)
- [x] `plot_predictions` retourne les octets PNG

### Reste à faire
- [ ] Ajouter des types de données (images, …)
- [ ] Ajouter des blocs (passer en revue les exercices de base de l'IA un par un)
- [ ] ⚠ **Torchvision manque dans pyproject.toml** → blocs transforms (to_tensor, normalize, random_crop, random_flip, resize) plantent au runtime — décision en attente

## Résultats & exécution

### Fait
- [x] Visualisation des résultats : contrat de sortie typé (image/curve/metrics/metric/texte), panel Console/Résultats (courbe SVG, image data URL)
- [x] Run de pipeline complet : build → execute → polling → outputs ; exécution locale réelle (`MLBLOCK_RUN_MODE=local`), dispatch GPU
- [x] Endpoint `GET /jobs/{id}/outputs` ; bugs du générateur corrigés (callbacks `/api/jobs/`, params coércés, `chk_job_status`)

## Projets

### Fait
- [x] Page « Mes projets » : liste, ouvrir, supprimer, exporter (modal JSON/Code), importer (validation types), nouveau (20 max)
- [x] Modèle draft (brouillon invisible 1/user), plafond 20, cascade user→pipelines
- [x] Import/export symétriques (position du canvas conservée)

## Auth

### Fait
- [x] Session restaurée au refresh (gate `authReady`) + autoComplete navigateur
- [x] OAuth Microsoft (provider azure) — **change non archivée**
- [x] RHF + checklist mot de passe + erreurs FR

### Reste à faire
- [ ] Credentials Google Cloud + Azure Entra → dashboard Supabase (action utilisateur)
- [ ] Archiver `supabase-oauth-providers`, `ui-param-polish`, `dict-port-splitting`, `result-visualization`, `uiux-audit-fixes`, `unsaved-changes-guard`

## Déploiement

### Fait
- [x] Keep-alive : `GET /health` + UptimeRobot (quota 720/750 h/mois)
- [x] Fix déploiement : Python 3.11, matplotlib lazy, gymnasium retirés, retry catalog 5×15s

### Reste à faire
- [ ] Redéployer le backend sur Render (commits depuis `1784006`)
- [ ] Vérifier la création du monitor UptimeRobot

## Tutos

### Reste à faire
- [ ] Deux cours (avancé / facile) au format .md
- [ ] Imaginer l'UI/UX
- [ ] Coder l'UI/UX

## Idées

- [ ] Toutes les sorties des blocs accessibles partout → système linéaire enrichi

## Divers

- [ ] Tests : 91 passed backend, 7 pré-existants (`/api/blocks*`) — hors périmètre
- [ ] Env : `uv run python -m pytest` (le shebang de `.venv/bin/pytest` pointe vers un vieux venv)
