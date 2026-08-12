## Context

Le champ `file` d'un bloc (BlockSegments) upload vers le bucket `user-uploads` et stocke l'**URL publique** (`getPublicUrl`) dans `fields[k]`. Le backend lit ces URLs partout : `fetchFileColumns` (routes.py `get_file_columns`, regex `SUPABASE_STORAGE_URL` accepte `/storage/v1/object/public/…`) et le code généré (`pd.read_csv(url)` — lisible par le GPU si le bucket est public). Un sample préfait = une URL publique injectée dans le champ : le flux entier (colonnes, exécution, retrait ×) fonctionne sans modification.

Blocs avec champ `file` : `load_csv` (tabulaire), `load_image` (image — mais le frontend n'accepte que `.csv` !). `tokenize` prend un `str` (pas de fichier). `sequence_dataset` prend un DataFrame en entrée (branche sur load_csv).

## Goals / Non-Goals

**Goals:**
- Bibliothèque de samples 100 % français, pré-générés par script, dans un bucket public.
- Modal « Nos données / Vos données » sur les champs fichier, catégorisé par bloc.
- Couvrir tabulaire, séries, texte (nouveau bloc `load_text`), image (accept dynamique).

**Non-Goals:**
- Import de fichiers volumineux ou streaming (les samples sont petits, ~Ko).
- Génération à la demande (les samples sont pré-générés et versionnés).
- Samples RL (environnements simulés, pas de data externe).

## Decisions

### D1 — Bucket `sample-data` public + manifest.json
Les samples vivent dans un bucket public (comme `user-uploads`) : `sample-data/{tabular,series,text,image}/…`. Le manifest (id, nom, description FR, category, url, columns, rows) est uploadé avec les fichiers — le backend le sert via `GET /api/samples`.
*Alternative* : manifest dans le repo backend — dupliqué avec le bucket ; le manifest DANS le bucket est la source unique.

### D2 — Un sample = une URL publique injectée
Le clic sur un sample → `onUpdate(blockId, k, url_public)` — identique à un upload. `fetchFileColumns` et le code généré fonctionnent tels quels. Zéro changement du moteur.

### D3 — `GET /api/samples?category=…`
Le backend lit le manifest depuis le bucket (API storage avec le secret), filtre par catégorie. La catégorie d'un champ est une table frontend bloc→catégorie (`load_csv`→tabular, `sequence_dataset`→series, `load_image`→image, `load_text`→text) — pas de changement du format docstring.

### D4 — Modal à deux volets
Le bouton du champ fichier ouvre `SampleDataModal` : « Utiliser nos données » (cartes : nom, description, colonnes, taille, bouton Utiliser) + « Apporter vos données » (input file existant). Le modal reçoit la catégorie du bloc. Fermeture × / clic Utiliser / upload.

### D5 — `accept` dynamique
Le type de segment `file` est enrichi côté frontend d'un attribut d'extension selon le bloc : csv pour tabulaire/séries/texte, png/jpg pour image (table bloc→extensions, comme D3).

### D6 — Bloc `load_text`
Nouveau bloc `load_text(path: "file", text_column: "str" = "texte", label_column: "str" = "")` → retourne `pd.DataFrame` (texte + label optionnel). Branchable sur `tokenize`/`train_test_split`/classification. Le segment file accepte `.csv` — identique à load_csv côté UI.

### D7 — Script de génération
`backend/scripts/generate_samples.py` : génère les données synthétiques FR (pandas : immo, ventes, étudiants, météo, trafic, avis clients…) avec colonnes et valeurs françaises, écrit CSV/PNG + manifest.json, uploade tout dans le bucket (API supabase, clé service). Exécutable à la demande (idempotent — upsert).

## Risks / Trade-offs

- **Bucket public** : les samples sont publics (lecture) — voulu (l'exécution GPU les lit sans auth) ; écriture protégée par la clé service.
- **Données synthétiques** : les samples sont générés (pas des datasets réels) — suffisant pour l'apprentissage, décrits comme tels dans le manifest.
- **Manifest non à jour après ajout manuel** : la génération est le seul chemin d'ajout (script) — pas de drift.
- **`GET /api/samples` lit le bucket à chaque appel** : léger (petit manifest) ; cache possible plus tard si besoin.
