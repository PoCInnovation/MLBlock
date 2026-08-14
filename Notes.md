# MLBlock — Todo list

> Mise à jour : 2026-08-14. `[x]` = fait, `[ ]` = reste à faire.

## UI & expérience


- [x] **Vue grille kanban switchable** (bouton « Vue libre / Vue colonnes ») : colonnes libres (créer/renommer/dupliquer/supprimer/déplacer via dropdown), drag+snap col/row, règle gauche→droite (liens vers colonnes strictement supérieures), colonnes générées automatiquement pour les pipelines existants, cartes auto-size au contenu (packing par hauteurs mesurées), colonne 0 non supprimable
- [x] **Routage des liens par couloirs** : lien adjacent → couloir au-dessus des deux cartes ; lien sautant → au-dessus de la colonne source puis en dessous des traversées ; câble rendu au-dessus des blocs/colonnes (z-index 999), espacement des liens parallèles (lane), flèche de direction
- [x] **Composants shadcn/ui portés** (base-nova, styles inline — pas de Tailwind) : Card (header/content/footer), DropdownMenu complet (Group, Sub, Checkbox, Radio, Shortcut, variant destructive), HoverCard (aperçu colonnes + infos des params de blocs)
- [x] Undo/redo : 2 piles (50 max), commit par geste (dragStop), raccourcis Ctrl+Z/Shift+Z/Y, snapshots avec colonnes
- [x] Indicateur de sauvegarde : bouton « Sauvegardé » désactivé quand propre
- [x] Fix backfill des pipelines chargés (le map avait le piège `![]` : `if (d?.segs?.length) return n`)
- [x] Sélection de colonne au clic retirée (drop toujours dans la colonne sous la souris)
- [x] Icônes Lucide partout, **zéro émoji** (~30 remplacés : Save/Play/Square, Upload/Download, FileText/FileCode2, toasts, CSV, landing)
- [x] Navbar de l'éditeur désengorgée : 12 contrôles → 5 + menu ⋮ (Base UI) — Importer/Exporter/Mes projets/Tout effacer/Déconnexion dans le menu
- [x] Garde « modifications non sauvegardées » : dirty par fingerprint, dialog 3 actions à la navigation/logout, **stash localStorage + restauration** après refresh ou session expirée (bannière « Travail récupéré »)
- [x] Audit a11y : `prefers-reduced-motion` respecté, contraste `textDim` 4.4:1, contrôles upload en `<button>`, état vide recherche palette
- [x] Hover states + transitions 150ms (CTA hero, cartes projets, palette, boutons)
- [x] Nom du projet éditable inline dans le header (persisté au save uniquement)
- [x] Boutons « Mes projets » (nav accueil + header éditeur)
- [x] Cohérence palette (tokens `inputBg`/`status`/`rail`)


- [ ] Animation « convoyeur de camions » sur les liens entre blocs
- [ ] Sélecteur multi-runs dans le panel Résultats
- [ ] Responsive mobile de l'éditeur / projets / auth (desktop-first assumé)

## Blocks


- [x] Types + conversions : feu tricolore, dérivation inputs, multi-sorties, `df_to_tensor`, 5 blocs réparés
- [x] Params éditables + intelligence (métadonnées docstring FR, autocomplétion colonnes)
- [x] `plot_predictions` retourne les octets PNG


- [x] Ajouter des types de données (images, …)
- [x] Ajouter des blocs (passer en revue les exercices de base de l'IA un par un)
- [x] ⚠ **Torchvision manque dans pyproject.toml** → blocs transforms (to_tensor, normalize, random_crop, random_flip, resize) plantent au runtime — décision en attente

## Résultats & exécution


- [x] Visualisation des résultats : contrat de sortie typé (image/curve/metrics/metric/texte), panel Console/Résultats (courbe SVG, image data URL)
- [x] Run de pipeline complet : build → execute → polling → outputs ; exécution locale réelle (`MLBLOCK_RUN_MODE=local`), dispatch GPU
- [x] Endpoint `GET /jobs/{id}/outputs` ; bugs du générateur corrigés (callbacks `/api/jobs/`, params coércés, `chk_job_status`)
- [x] **Gestion d'erreur GPU** : job vide `{}` corrigé (racine : `expire_on_commit` de SQLAlchemy → `session.refresh(job)` avant retour), erreur affichée + polling arrêté sur 4xx (hors 429)

## Projets


- [x] Page « Mes projets » : liste, ouvrir, supprimer, exporter (modal JSON/Code), importer (validation types), nouveau (20 max)
- [x] Modèle draft (brouillon invisible 1/user), plafond 20, cascade user→pipelines
- [x] Import/export symétriques (position du canvas conservée)
- [x] **Bibliothèque de données d'exemple FR** : 11 samples (bucket Supabase public), modal « Données d'entraînement », bloc `load_text`
 
## Auth


- [x] Session restaurée au refresh (gate `authReady`) + autoComplete navigateur
- [x] OAuth Microsoft (provider azure) — **change non archivée**
- [x] RHF + checklist mot de passe + erreurs FR
- [x] **Vraie auth Supabase en local** (`VITE_SUPABASE_URL` réel) + mode dev `MLBLOCK_DEV_AUTH` (backend) / RequireAuth dummy (jamais en prod) ; interceptor axios résilient (session corrompue → requête sans header)


- [ ] Credentials Google Cloud + Azure Entra → dashboard Supabase (action utilisateur)
- [x] Archiver `supabase-oauth-providers`, `ui-param-polish`, `dict-port-splitting`, `result-visualization`, `uiux-audit-fixes`, `unsaved-changes-guard`

## Déploiement


- [x] Keep-alive : `GET /health` + UptimeRobot (quota 720/750 h/mois)
- [x] Fix déploiement : Python 3.11, matplotlib lazy, gymnasium retirés, retry catalog 5×15s

- [x] Vérifier la création du monitor UptimeRobot

## Tutos

- [ ] Deux cours (avancé / facile) au format .md
- [ ] Imaginer l'UI/UX
- [ ] Coder l'UI/UX

## Idées


## Divers
