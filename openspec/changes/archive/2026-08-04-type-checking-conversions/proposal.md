# Proposal: type-checking-conversions

## Why

Les blocs ML ont déjà des types (annotations Python : `torch.Tensor`, `pd.DataFrame`…), mais le frontend les jette (catalogue réduit à `cat` + segments), le validator dtype backend est du code mort (`PipelineDef.validate_dtype_compatibility` jamais instancié, et il crasherait : `inputs` jamais dérivés), et le mode linéaire n'envoie aucune arête. Résultat : les utilisateurs connectent des blocs incompatibles sans aucun retour, l'erreur n'apparaît qu'au build, en console. En parallèle, 5 blocs de la bibliothèque sont cassés (NameError garanti) et les sorties composites (`dict`, `tuple`) sont incon sommables.

## What Changes

- **Système de types backend** : dériver les ports d'entrée depuis les signatures (`in_*` + premier param non-`file` + params de type data), parser `tuple[A, B]` en sorties multiples (`out_1`/`out_2`), classifieur de compatibilité à 4 sorties (identité / sous-type / convertible / incompatible), validation dtype réanimée sur `/api/validate` et au build.
- **Éclatement des ports** : `Pipeline.run` résout les valeurs **par port** (`source_port` devient réel), `BlockMeta.execute` normalise les tuples en sorties nommées. `train_test_split` → `out_1: train`, `out_2: test` ; `random_split` → idem. Les dicts hétérogènes (`pca`, `standard_scaler`, `train_model`) restent mono-sortie en v1.
- **Convertisseurs** : nouveau bloc `df_to_tensor` (`pd.DataFrame → torch.Tensor`) ; `to_tensor` resserré de `object` à `numpy.ndarray`/`PIL.Image` (fini le wildcard menteur).
- **Réparations** : `linear_regression`, `logistic_regression`, `random_forest` (`train_target` → `train_data[target_column]`), `evaluate` (réécriture : X sans cible, `method` mse/accuracy réel), `train_test_split` (réécriture complète).
- **UI feu tricolore** : catalogue enrichi (inputs/outputs propagés), nœuds multi-handles avec dtype au survol, arêtes vertes (compatible) / bouton « Convertir » orange (conversion disponible → matérialise le bloc convertisseur) / rouge (incompatible → connexion bloquée + toast). Mode simple : connecteurs implicites colorés + bouton Convertir inter-blocs. Système de toast léger (n'existe pas).

## Capabilities

### New Capabilities
- `block-type-system`: dérivation des ports, multi-sorties, familles de types, classifieur de compatibilité, validation dtype côté serveur.
- `type-conversion`: blocs convertisseurs (`df_to_tensor`, `to_tensor` honnête) et graphe de conversion dérivé du catalogue.
- `block-library-fixes`: réparation des 5 blocs cassés et éclatement des sorties de `train_test_split`/`random_split`.
- `ui-type-feedback`: feu tricolore (vert/orange/rouge), toast, bouton Convertir, nœuds multi-handles, catalogue enrichi.

### Modified Capabilities
<!-- Aucune spec existante — toutes les capabilities sont nouvelles. -->
