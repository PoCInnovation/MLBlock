## 1. Métadonnées backend

- [x] 1.1 Étendre la grammaire `_extract_param_desc` : parser le suffixe `(entre: X-Y, pas: P)` → min/max/step
- [x] 1.2 Parser `(impair)`, `(choix: a|b)`, `(format: ...)`, `(longueur: N)` → odd/choices/format/len
- [x] 1.3 `ParamInfo` : nouveaux champs optionnels (min, max, step, odd, choices, format, len) — suffixe absent/malformé jamais bloquant
- [x] 1.4 Enrichir les docstrings des blocs cibles (dropout, random_flip, rnn/gru/lstm, sgd, step_lr, reduce_lr, train_test_split, random_split, conv*, linear, batchnorm*, pools, embedding, softmax, early_stopping, cosine_lr, adam, multihead_attention, upsample, input, normalize, evaluate.method, knn, svm, decision_tree, random_forest, pca, logistic_regression)
- [x] 1.5 Test backend : parsing des 5 clés + tolérance suffixe absent/malformé

## 2. Endpoint colonnes

- [x] 2.1 `GET /api/files/{path}/columns` : lit la 1re ligne du CSV stocké (Supabase) → `{columns: [...]}`
- [x] 2.2 Test backend : colonnes lues, fichier absent → 404

## 3. Catalogue frontend

- [x] 3.1 Étendre les types `NumSeg`/`SelSeg` (min/max/step/odd/choices/format/len/description) + `catalogSchema`
- [x] 3.2 `toSegments` propage les métadonnées + description

## 4. UI des segments

- [x] 4.1 `BlockSegments` : input `type=number` borné (min/max/step) + placeholder « entre X et Y »
- [x] 4.2 `choices` → `<input list>` + `<datalist>` ; `odd` → validation parité
- [x] 4.3 `list` + `format` → placeholder + validation JSON live ; `len` → compteur d'éléments
- [x] 4.4 Description → tooltip au survol
- [x] 4.5 Validation live (feu tricolore : bordure vert/rouge + message), jamais bloquante

## 5. Autocomplétion target_column

- [x] 5.1 `client.ts` : `fetchFileColumns(path)` (cache par URL)
- [x] 5.2 Avancé : remontée récursive des edges → node `load_csv` → colonnes
- [x] 5.3 Linéaire : bloc précédent `load_csv` → colonnes
- [x] 5.4 Datalist sur les champs `target_column` ; fallback champ libre

## 6. Vérification

- [x] 6.1 Build frontend (`npm run build`) + pytest backend
- [x] 6.2 Smoke : `dropout.p` hors fourchette → rouge à la frappe ; dans la fourchette → vert
- [x] 6.3 Smoke : `evaluate.method` propose mse/accuracy en autocomplétion
- [x] 6.4 Smoke : `input.shape` placeholder `[C,H,W]` + JSON invalide → rouge
- [x] 6.5 Smoke : `target_column` de `knn` propose les colonnes du CSV chargé en amont
