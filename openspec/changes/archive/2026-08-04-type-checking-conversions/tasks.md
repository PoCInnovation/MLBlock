## 1. Système de types backend

- [x] 1.1 Dériver les inputs dans `_inspect_function` (règle D1 : `in_*`, premier param non-file, types data) → `Block.inputs`
- [x] 1.2 Parser `tuple[A, B]` dans `_parse_return_annotation` → sorties `out_1`/`out_2` (split top-level, profondeur gérée)
- [x] 1.3 `BlockMeta.execute` : normaliser tuple/list → `{out_N: valeur}` quand multi-sorties
- [x] 1.4 `Pipeline.run` : `_value_for(outputs, node, port)` — résolution par `source_port`
- [x] 1.5 Définir les familles de types (tensor, df, model, dict, dataset, module, optim, scalaire) + mapping dtype → famille
- [x] 1.6 Classifieur 4 sorties (identité / sous-type / convertible / incompatible) + BFS sur le graphe de conversion dérivé du catalogue
- [x] 1.7 Réanimer `validate_dtype_compatibility` (classifieur au lieu d'égalité stricte) sur `/api/validate` + au build
- [x] 1.8 Test backend : inputs dérivés, multi-sorties, classifieur, validation (pytest)

## 2. Convertisseurs

- [x] 2.1 Créer `blocks/transforms_F5A623/df_to_tensor.py` (`pd.DataFrame → torch.Tensor`, float32)
- [x] 2.2 Resserrer `to_tensor` : annotation `object` → `numpy.ndarray`
- [x] 2.3 Vérifier découverte automatique + présence dans `/api/catalog` (inputs/outputs corrects)

## 3. Réparations de blocs

- [x] 3.1 `linear_regression`, `logistic_regression`, `random_forest` : `train_target` → `train_data[target_column]`
- [x] 3.2 `evaluate` : réécriture (X sans cible, y_true, `method` mse/accuracy, retour float)
- [x] 3.3 `train_test_split` : réécriture complète (ratio/shuffle/seed via sklearn, retour tuple, annotation `tuple[pd.DataFrame, pd.DataFrame]`)
- [x] 3.4 `random_split` : retour tuple `(train, test)`, annotation `tuple[Dataset, Dataset]`
- [x] 3.5 Test backend : les 5 blocs s'exécutent sans NameError (smoke)

## 4. Catalogue frontend enrichi

- [x] 4.1 `types/catalog.ts` : `BlockDef` gagne `inputs`/`outputs` (`{name, dtype}[]`)
- [x] 4.2 `fetchCatalog` : propager inputs/outputs (au lieu de les dropper)
- [x] 4.3 Classifieur + graphe de conversion côté frontend (dérivé du catalogue, partagé avec le store)

## 5. UI avancée (ReactFlow)

- [x] 5.1 `BlockNode` multi-handles : targets `in_N`, sources `out_M`, tooltip dtype
- [x] 5.2 `onConnect` intercepté : classifieur → edge vert / toast Convertir / toast erreur (edge non créé)
- [x] 5.3 Toast système : store zustand + composant (erreur / convert + action), auto-dismiss, `role="alert"`
- [x] 5.4 Insertion du convertisseur : noeud au point milieu + recâblage `A→conv→B` + re-classification des edges
- [x] 5.5 Couleurs d'edges + symboles (vert ●, orange ⚡ pointillés `#F59E0B` token `convert`, rouge ✗)

## 6. UI simple (linéaire)

- [x] 6.1 Connecteur implicite `out_1 → in_1` coloré entre blocs consécutifs
- [x] 6.2 Bouton « Insérer convertisseur » inter-blocs (orange) + badge rouge incompatible

## 7. Vérification

- [x] 7.1 Build frontend (`npm run build`) + pytest backend
- [x] 7.2 Smoke : connexion verte, conversion orange (df → tensor), rouge bloquée (tensor → df sans pont)
- [x] 7.3 Smoke : mode simple, badges + insertion convertisseur
- [x] 7.4 Vérifier `train_test_split`/`random_split` éclatés dans le canvas (2 handles sources)
