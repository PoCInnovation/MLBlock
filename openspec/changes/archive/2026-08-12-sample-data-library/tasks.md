## 1. Bucket + génération des samples

- [x] 1.1 Créer le bucket `sample-data` (public) via Supabase
- [x] 1.2 `backend/scripts/generate_samples.py` : génération des datasets FR (tabular : immo, ventes, étudiants, churn ; séries : météo, trafic ; texte : avis clients + label ; image : quelques PNG d'exemple) + manifest.json
- [x] 1.3 Upload des fichiers + manifest vers `sample-data` (idempotent, upsert) + exécuter une fois

## 2. Backend

- [x] 2.1 `GET /api/samples?category=…` : lit le manifest depuis le bucket (secret), filtre par catégorie
- [x] 2.2 Bloc `load_text` (catégorie texte) : `load_text(path: "file", text_column: "str" = "texte", label_column: "str" = "")` → DataFrame

## 3. Frontend

- [x] 3.1 Table bloc→catégorie de samples + extensions d'accept (csv / image) — utilisée par le champ fichier
- [x] 3.2 `accept` dynamique du champ fichier selon le bloc
- [x] 3.3 Modal `SampleDataModal` : deux volets (Nos données / Vos données), cartes sample (nom, description, colonnes, taille), clic → injection URL
- [x] 3.4 Brancher le modal sur les champs fichier (BlockSegments) + fetch `/api/samples`
- [x] 3.5 Build frontend : `npm run build` OK

## 4. Validation

- [x] 4.1 Test backend : `GET /api/samples` retourne le manifest filtré ; `load_text` se charge via le registry
- [x] 4.2 Suite pytest : 96 + nouveaux, 7 pré-existants `/api/blocks*`
- [x] 4.3 Smoke navigateur : ouvrir le champ d'un bloc load_csv → modal → sélectionner un sample → le champ se remplit + colonnes détectées
- [x] 4.4 Commit + push dev/chedli + fast-forward main