# Design : circuit fichier unifié (upload → aperçu → exécution)

Date : 2026-10-06 · Approche validée : **A — backend médiateur avec URL signée**.
Statut : sections 1–4 approuvées en brainstorming, en attente de relecture de cette spec.

## 1. Intention

Repenser le circuit « fichier » de bout en bout : quels blocs acceptent des fichiers,
comment l'utilisateur les fournit, ce qu'il voit pendant/après, comment le backend
les consomme à l'exécution. Succès = démo fluide pour débutants + fiabilité
(erreurs actionnables) + formats génériques + un seul circuit cohérent.

## 2. Décisions cadrées (questions résolues)

- Formats : circuit générique — CSV, images, texte, modèles (`.pt`/`.pkl`), audio, gros fichiers.
- Accès exécution : **URL publique en param** (le code généré télécharge ; marche en local et sur Vast.ai).
- Persistance : **table `file_assets` dédiée**.
- UI : progression réelle + aperçu + dropzone + galerie « Mes fichiers ».
- Rétention : **TTL (30 j, env `FILE_TTL_DAYS`)**, pas de conservation indéfinie ; **quota par user
  (env `FILE_QUOTA_BYTES`, ex. 500 Mo)** réservé avant upload (anti-exploit).

## 3. Données & stockage

Table `file_assets` (SQLModel) : `id` UUID · `owner_id` FK users · `name` · `storage_path` ·
`public_url` · `mime` (sniffé serveur) · `size_bytes` (réel au confirm) ·
`kind` (`csv|image|text|model|audio|other`) · `status` (`pending|ready|expired`) ·
`created_at` · `expires_at` (créé + TTL).

- Bucket unique `user-uploads` réutilisé, layout `{owner_id}/{asset_id}_{nom_sanitizé}`
  (unicité par ID, extension réelle conservée — fini le `.csv` forcé).
- Lecture publique (exécution sans auth), écriture par URL signée uniquement.
- Quota : `SUM(ready+pending non expirés) + demandé ≤ quota`, sinon `413` FR.
- Nettoyage : au `confirm` + tâche périodique (`expires_at < now()` → ligne + objet) ;
  suppression manuelle depuis la galerie (libère le quota).
- Pipeline importée référençant un asset expiré : signalée au chargement
  (« fichier expiré, réimporte-le »), pas de 404 pandas à l'exécution.

## 4. Contrat blocs-fichiers

- `ParamInfo`/`FileSeg` gagne `accept` + `kind`, déclarés via la docstring DSL existante
  (`(format: .csv)`), exposés par `GET /api/catalog`. Suppression de `ACCEPT_BY_BLOCK` en dur.
- `request-upload` prend `block_type?` : refus **tôt** si mismatch (`415` FR).
- Aperçu piloté par `kind` : csv/text → premières lignes ; image → miniature ;
  model/audio → fiche métadonnées.
- Migration : `load_csv`, `load_text`, `load_image` adoptent le contrat (lecture URL inchangée).
- Rétrocompat : URL brutes existantes continuent de fonctionner, aucune migration forcée.

## 5. UX & feedback (100 % shadcn, tactile)

Dropzone dans l'inspecteur (drag & drop + tap, `accept` du catalogue, refus avant upload).
`Progress` sur le PUT direct + Annuler. Aperçu selon `kind` avant de lancer.
Erreurs actionnables (jamais de code HTTP brut). Galerie `GET /api/files` : réutilisation
en un tap, suppression manuelle, badge + CTA sur expiré. Zones ≥ 44 px, rien au survol seul.
Import JSON pipeline : inchangé.

## 6. Exécution backend

- `POST /api/files/request-upload {nom, taille, mime, block_type?}` (auth `get_current_user`) →
  vérifie quota + accept → asset `pending` → URL signée d'écriture.
- `PUT` direct frontend → storage (zéro charge backend).
- `POST /api/files/{id}/confirm` → taille réelle + sniff (CSV : `nrows=5`, image : `PIL.verify`,
  autres : signature + taille) → `ready` + `public_url` + aperçu. Mismatch → `415` + `expired`.
- `GET /api/files`, `GET /api/files/{id}/preview`, `DELETE /api/files/{id}` (ligne + objet).
- Génération inchangée (URL publique en param) + `try/except` FR dans les 3 loaders `donnees`.
- Le `confirm` ne lit que l'en-tête (premiers Ko), jamais le fichier entier.

## 7. Tests (exigés par le plan)

Backend : refus quota (`413`), mismatch mime (`415`), confirm/taille, cleanup TTL,
e2e request→confirm (bucket mocké). Frontend : `accept` venu du catalogue, états dropzone.
Charge : aucun test ne fait transiter d'octets par l'API.

## 8. Hors scope

Import/export JSON pipeline (inchangé), création de SuperBlocks custom, poids modèles
côté entraînement distribué, migration des URL existantes, RLS fine autre que
lecture publique / écriture service-role.
