## Why

Les utilisateurs n'ont aucun jeu de données pour s'entraîner : ils doivent apporter leurs propres fichiers (upload CSV) ou utiliser les datasets intégrés limités (`load_sklearn_dataset` : iris, wine…). Pour un produit pédagogique, fournir une bibliothèque de données d'exemple **préfaites et en français** — pour tous les types (tabulaire, séries, texte, image) — réduit la friction d'entrée : clic sur un sample au lieu de chercher un fichier.

## What Changes

- **Bucket Supabase `sample-data` (public)** : jeux de données pré-générés en français (tabulaire, séries, texte, image), un dossier par catégorie, + un `manifest.json` (id, nom, description FR, catégorie, colonnes, taille, URL).
- **Script de pré-génération** (`backend/scripts/generate_samples.py`) : génère les données synthétiques FR (pandas/sklearn), écrit les fichiers + manifest, uploade vers le bucket (clé service).
- **Endpoint `GET /api/samples?category=…`** : sert la liste des samples depuis le manifest (le backend lit le bucket avec le secret).
- **Modal « Données d'entraînement »** : le bouton de champ fichier ouvre un modal à deux volets — « Utiliser nos données » (cartes des samples de la catégorie du bloc, clic → URL injectée comme un upload) et « Apporter vos données » (upload existant).
- **`accept` dynamique** du champ fichier (csv vs image selon le bloc — aujourd'hui `.csv` en dur, les blocs image ne peuvent rien importer).
- **Nouveau bloc `load_text`** (catégorie texte) : lit un CSV de textes (phrases + label optionnel) — permet les samples texte branchés sur tokenize/classification.
- Aucun changement du moteur d'exécution : un sample est une URL publique injectée dans le champ, lue comme un fichier uploadé.

## Capabilities

### New Capabilities
- `sample-data-library`: bibliothèque de données d'entraînement préfaites en français (bucket + manifest + endpoint + modal) et bloc `load_text`.
