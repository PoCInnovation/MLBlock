## Why

La bibliothèque de blocs ne couvre pas les exercices de base de l'IA : pas d'images (torchvision absent → 5 blocs transforms plantent au runtime), pas de datasets intégrés (chaque exercice exige un upload CSV), pas de clustering, de NLP, de RL (gymnasium retiré au fix deploy), ni de métriques au-delà de mse/accuracy. Les dossiers de catégories sont en anglais avec des underscores (`neural_conv_6366F1`) — jugés « cheap ». Décisions actées : torchvision **validé**, **gymnasium réintroduit**, **load_dataset inclus**, type image = **PIL.Image**.

## What Changes

- **Dépendances** : `torchvision` + `gymnasium` ajoutés au pyproject (les blocs transforms redeviennent fonctionnels ; les datasets MNIST/CIFAR et les environnements RL deviennent disponibles).
- **Type image** : famille `image` (`PIL.Image.Image`) dans `core/types.py`, graphe de conversion `image → tensor` (via to_tensor), build shape CHW pour les racines image. Bloc `load_image` (fichier → Supabase storage → PIL.Image).
- **Datasets intégrés** : `load_sklearn_dataset` (iris/digits/wine/breast_cancer → DataFrame) et `load_torch_dataset` (MNIST/fashion_mnist/cifar10 → DataLoader) — les exercices classiques sans upload.
- **Nouveaux blocs par exercice** : `polynomial_features` (régression polynomiale), `kmeans` + `silhouette` (clustering), `tsne` (réduction), `sequence_dataset` (fenêtres glissantes RNN/time series), `tokenize` + `build_vocab` + `encode_text` (NLP), `confusion_matrix` + méthodes f1/precision/recall dans `evaluate` (métriques), `isolation_forest` (anomalie), `create_env` + `q_learning` + `evaluate_agent` (RL gymnasium).
- **Dossiers en français sans underscore** : format `{nom}-{hex}` (`donnees-22C55E`, `convolution-6366F1`, …), parsing du registry adapté (regex suffixe hex), nouveaux dossiers `texte` et `renforcement`.

## Capabilities

### New Capabilities
- `block-library-expansion`: bibliothèque de blocs étendue (image, datasets intégrés, clustering, NLP, RL, métriques, time series) + organisation française des catégories.

### Modified Capabilities
<!-- Aucune spec existante modifiée : les capabilities bloc-type-system/type-conversion
     ne changent pas de requirements (la famille image s'y ajoute en pratique). -->

## User Impact

- Les exercices de base de l'IA deviennent réalisables de bout en bout (classification, CNN MNIST, clustering, NLP, RL, time series) — validés au run local.
- Les blocs transforms (normalize, random_crop…) fonctionnent enfin.
- Les catégories s'affichent en français dans la palette (ids de catégories renommés — aucun impact sur les projets stockés, qui référencent les types de blocs, pas les catégories).
