# Matrice de Couverture & Audit des Gaps (coverage.md)

> **Document de référence — UX Blocks Rework (Étape 2/5)**  
> Ce document consolide l'audit exhaustif des **12 exercices canoniques** (§01) contre les **88 blocs du catalogue** actuels.  
> Il documente l'état baseline de validation (`validate`) et de génération de code (`generate_code`), identifie les écarts bloquants (gaps P0) et secondaires (gaps P1), et prépare la réduction de palette de l'étape §02.

---

## 1. Synthèse de Validation Baseline (12 Exercices)

- **Total Exercices :** 12
- **Exercices Validés (Passing) :** 6/12 (`A1, A3, A7, B1, B2, C1`)
- **Exercices avec Gaps Documentés (Failing) :** 6/12 (`A2, A4, A5, A6, B3, C2`)
- **Génération de code :** 12/12 génèrent un script exécutable sans exception.

| ID | Nom | Nœuds | Arêtes | Validation | Codegen | Symptômes / Erreurs |
|---|---|:---:|:---:|:---:|:---:|---|
| **A1** | CIFAR-10 CNN — 60min Blitz | 11 | 11 | ✅ PASS | ✅ OK | Pipeline intègre et vérifié sans erreur de type |
| **A2** | Fashion-MNIST Quickstart | 9 | 9 | ❌ GAP P0/P1 | ✅ OK | • `Stage mismatch: cannot connect Stage 1 (norm) to Stage 0 (loader).`<br>• `Type mismatch: dataset.out_1 (torch.utils.data.DataLoader) -> norm.in_1 (torch.Tensor)`<br>• `Type mismatch: norm.out_1 (torch.Tensor) -> loader.in_1 (torch.utils.data.Dataset)` |
| **A3** | MNIST from scratch — What is torch.nn really? | 5 | 5 | ✅ PASS | ✅ OK | Pipeline intègre et vérifié sans erreur de type |
| **A4** | Tabular Iris — df→tensor | 9 | 10 | ❌ GAP P0/P1 | ✅ OK | • `Type mismatch: converter.out_1 (torch.Tensor) -> fc1.in_1 (torch.nn.Module)`<br>• `Type mismatch: converter.out_1 (torch.Tensor) -> trainer.in_2 (torch.utils.data.DataLoader)` |
| **A5** | CIFAR-10 + augmentation | 14 | 14 | ❌ GAP P0/P1 | ✅ OK | • `Stage mismatch: cannot connect Stage 1 (norm) to Stage 0 (loader).`<br>• `Type mismatch: dataset.out_1 (torch.utils.data.DataLoader) -> crop.in_1 (torch.Tensor)`<br>• `Type mismatch: norm.out_1 (torch.Tensor) -> loader.in_1 (torch.utils.data.Dataset)` |
| **A6** | NLP Text Classification — LSTM | 9 | 11 | ❌ GAP P0/P1 | ✅ OK | • `Type mismatch: encoder.out_1 (numpy.ndarray) -> trainer.in_2 (torch.utils.data.DataLoader)`<br>• `Type mismatch: lstm_cell.out_1 (torch.Tensor) -> fc.in_1 (torch.nn.Module)` |
| **A7** | Time-series Sequence | 7 | 7 | ✅ PASS | ✅ OK | Pipeline intègre et vérifié sans erreur de type |
| **B1** | Iris Classification — LogisticRegression | 4 | 4 | ✅ PASS | ✅ OK | Pipeline intègre et vérifié sans erreur de type |
| **B2** | Iris PCA — 4D→2D | 3 | 3 | ✅ PASS | ✅ OK | Pipeline intègre et vérifié sans erreur de type |
| **B3** | Iris KMeans — Elbow | 4 | 4 | ❌ GAP P0/P1 | ✅ OK | • `Type mismatch: scaler.scaled (numpy.ndarray) -> clustering.in_1 (pd.DataFrame)` |
| **C1** | CartPole-v1 Tabular Q-learning | 3 | 3 | ✅ PASS | ✅ OK | Pipeline intègre et vérifié sans erreur de type |
| **C2** | CartPole DQN (PyTorch) | 8 | 9 | ❌ GAP P0/P1 | ✅ OK | • `Stage mismatch: cannot connect Stage 9 (env) to Stage 2 (fc1).`<br>• `Type mismatch: env.out_1 (Env) -> fc1.in_1 (torch.nn.Module)`<br>• `Type mismatch: trainer.model (torch.nn.Module) -> eval.policy (Policy)` |

---

## 2. Matrice Complète des 83 Blocs du Catalogue

Légende des statuts cibles (§02 Réduction) :
- `keep` : Conservé dans la palette canonique v1 (~45 blocs cœur).
- `merge` : Fusionné avec son pendant `*_layer` (`Module`) pour éliminer l'ambiguïté.
- `delete` : Supprimé (versions Tensor sans persistance de poids, source du bug #14).
- `deprecate` : Déprécié (conservé temporairement avec wrapper et avertissement).
- `hide` : Conservé mais replié par défaut dans la sous-palette avancée.

**Statistiques globales :** 36/83 blocs (43.4%) sont directement utilisés dans les 12 exercices.
- `keep` : 72
- `hide` : 9
- `delete` : 0
- `merge` : 0
- `deprecate` : 2

| Block | Catégorie | Utilisé dans les Exos | Statut Cible |
|---|---|---|:---:|
| `adam` | entrainement | A1, A4, A5, A6, A7, C2 | `keep` |
| `adaptive_avgpool2d` | regroupement | — | `keep` |
| `adaptive_maxpool2d` | regroupement | — | `keep` |
| `avgpool2d` | regroupement | — | `keep` |
| `batchnorm1d` | normalisation | — | `keep` |
| `batchnorm2d` | normalisation | — | `keep` |
| `build_vocab` | texte | A6 | `keep` |
| `confusion_matrix` | entrainement | — | `keep` |
| `conv1d_layer` | layers | — | `keep` |
| `conv2d_layer` | layers | A1, A5 | `keep` |
| `conv3d_layer` | layers | — | `keep` |
| `conv_transpose2d_layer` | layers | — | `keep` |
| `cosine_lr` | entrainement | — | `keep` |
| `create_env` | renforcement | C1, C2 | `keep` |
| `cross_entropy_loss` | entrainement | A1, A2, A3, A4, A5, A6 | `keep` |
| `data_loader` | chargement | A1, A2, A5 | `keep` |
| `decision_tree` | modeles | — | `keep` |
| `df_to_tensor` | transformations | A4 | `keep` |
| `dropout` | layers | — | `deprecate` |
| `early_stopping` | entrainement | — | `keep` |
| `elu` | activation | — | `hide` |
| `embedding` | layers | A6 | `deprecate` |
| `encode_text` | texte | A6 | `keep` |
| `evaluate` | entrainement | B1 | `keep` |
| `evaluate_agent` | renforcement | C1, C2 | `keep` |
| `flatten_layer` | layers | A1, A5 | `keep` |
| `gelu` | activation | — | `hide` |
| `gru` | sequences | — | `keep` |
| `identity` | activation | — | `hide` |
| `input` | layers | — | `keep` |
| `instancenorm2d` | normalisation | — | `keep` |
| `isolation_forest` | modeles | — | `keep` |
| `kmeans` | modeles | B3 | `keep` |
| `knn` | modeles | — | `keep` |
| `layernorm` | normalisation | — | `keep` |
| `leaky_relu` | activation | — | `keep` |
| `linear_layer` | layers | A1, A2, A3, A4, A5, A6, A7, C2 | `keep` |
| `linear_regression` | modeles | — | `keep` |
| `load_csv` | donnees | B3 | `keep` |
| `load_image` | donnees | — | `keep` |
| `load_sklearn_dataset` | donnees | A4, A7, B1, B2 | `keep` |
| `load_text` | donnees | — | `keep` |
| `load_torch_dataset` | donnees | A1, A2, A3, A5 | `keep` |
| `logistic_regression` | modeles | B1 | `keep` |
| `lstm` | sequences | A6 | `keep` |
| `maxpool2d_layer` | layers | A1, A5 | `keep` |
| `model_checkpoint` | entrainement | — | `keep` |
| `mse_loss` | entrainement | A7, C2 | `keep` |
| `multihead_attention` | sequences | — | `keep` |
| `normalize` | transformations | A2, A5 | `keep` |
| `pca` | modeles | B2 | `keep` |
| `plot_predictions` | visualisation | B2 | `keep` |
| `polynomial_features` | transformations | — | `keep` |
| `prelu` | activation | — | `hide` |
| `q_learning` | renforcement | C1 | `keep` |
| `random_crop` | transformations | A5 | `keep` |
| `random_flip` | transformations | A5 | `keep` |
| `random_forest` | modeles | — | `keep` |
| `random_split` | chargement | — | `keep` |
| `reduce_lr_on_plateau` | entrainement | — | `keep` |
| `relu_layer` | layers | A1, A2, A4, A5, C2 | `keep` |
| `resize` | transformations | — | `keep` |
| `rnn` | sequences | — | `keep` |
| `rnn_layer` | layers | A7 | `keep` |
| `selu` | activation | — | `hide` |
| `sequence_dataset` | donnees | A7 | `keep` |
| `sgd` | entrainement | A2, A3 | `keep` |
| `sigmoid` | activation | — | `hide` |
| `silhouette` | entrainement | B3 | `keep` |
| `silu` | activation | — | `hide` |
| `softmax` | activation | — | `hide` |
| `standard_scaler` | modeles | B3 | `keep` |
| `step_lr` | entrainement | — | `keep` |
| `svm` | modeles | — | `keep` |
| `tanh` | activation | — | `hide` |
| `tensor_dataset` | chargement | — | `keep` |
| `to_tensor` | transformations | — | `keep` |
| `tokenize` | texte | A6 | `keep` |
| `train_epoch` | entrainement | — | `keep` |
| `train_model` | entrainement | A1, A2, A3, A4, A5, A6, A7, C2 | `keep` |
| `train_test_split` | donnees | A4, B1 | `keep` |
| `tsne` | modeles | — | `keep` |
| `upsample` | layers | — | `keep` |

---

## 3. Analyse Détaillée des Gaps P0 (Bloquants v1)

Ces écarts de typage et de liaison empêchent la validation stricte des exercices canoniques.
Ils sont résolus dans les étapes §04 (Familles & Stages) et §05 (Typage & Validation).

### Gap P0.1 — Pont tabulaire `df -> tensor` non auto-inséré (Exo A4)
- **Exercice concerné :** `A4 Tabular Iris — df→tensor`
- **Symptôme actuel :**  
  - `Type mismatch: converter.out_1 (torch.Tensor) -> fc1.in_1 (torch.nn.Module)`  
  - `Type mismatch: converter.out_1 (torch.Tensor) -> trainer.in_2 (torch.utils.data.DataLoader)`
- **Cause racine :** Le bloc `df_to_tensor` transforme un `pd.DataFrame` (S0) en `torch.Tensor` (S1). Or, `linear_layer` attend un `torch.nn.Module` (S2A) pour composer le modèle, et `train_model` attend un `torch.utils.data.DataLoader` (S1). Aucun chemin de conversion automatique n'est résolu par le moteur.
- **Action corrective (§04 / §05) :** Définir la transition de stage S0→S1→S2A et activer l'auto-insertion du convertisseur `df_to_tensor` et de l'adaptateur de chargement `TensorDataset / DataLoader` via la bulle d'action Astryx (`converterFor`).

### Gap P0.2 — Désynchronisation front/back sur les types `image` & `ndarray` (Exos A2, A5)
- **Exercices concernés :** `A2 Fashion-MNIST Quickstart`, `A5 CIFAR-10 augmentation`
- **Symptôme actuel :**  
  - `Type mismatch: dataset.out_1 (torch.utils.data.DataLoader) -> norm.in_1 (torch.Tensor)`  
  - `Type mismatch: norm.out_1 (torch.Tensor) -> loader.in_1 (torch.utils.data.Dataset)`
- **Cause racine :** `load_torch_dataset` instancie et renvoie directement un `DataLoader` plutôt qu'un `Dataset`. Les transformations (`random_crop`, `random_flip`, `normalize`) attendent des tenseurs ou images. Côté frontend, `typeCheck.ts` traite `PIL.Image.Image` comme une chaîne brute alors que le backend la classe en famille `image`. Le graphe de conversion `image -> tensor` et les unions de types (`PIL.Image | ndarray`) sont désynchronisés.
- **Action corrective (§04 / §05) :** Aligner `typeCheck.ts` avec `core/types.py` (support de `image/list/env/policy` et fonction `_split_union`), et restructurer la chaîne S1 pour que le `DataLoader` encapsule les transformations du `Dataset`.

### Gap P0.3 — Chaîne de typage NLP & séquences de texte (Exo A6)
- **Exercice concerné :** `A6 NLP Text Classification — LSTM`
- **Symptôme actuel :**  
  - `Type mismatch: encoder.out_1 (numpy.ndarray) -> trainer.in_2 (torch.utils.data.DataLoader)`  
  - `Type mismatch: lstm_cell.out_1 (torch.Tensor) -> fc.in_1 (torch.nn.Module)`
- **Cause racine :** La chaîne NLP traverse `str -> list[str] -> ndarray -> Tensor -> Module`. Côté front, `list[str]` n'est pas mappé à la famille `list`. De plus, `encode_text` produit un `ndarray` qui ne peut pas alimenter directement `train_model` sans passerelle DataLoader, et le bloc `lstm` retourne un `torch.Tensor` incompatible avec `linear_layer` (qui attend un `Module`).
- **Action corrective (§04 / §05) :** Harmoniser les familles `list` et `text`, clarifier l'assemblage séquentiel du modèle LSTM, et fournir l'adaptateur de batching adéquat.

### Gap P0.4 — Doublon et incompatibilité de types `standard_scaler` vs `normalize` (Exo B3)
- **Exercice concerné :** `B3 Iris KMeans — Elbow`
- **Symptôme actuel :**  
  - `Type mismatch: scaler.scaled (numpy.ndarray) -> clustering.in_1 (pd.DataFrame)`
- **Cause racine :** `standard_scaler` (`modeles-F59E0B`) renvoie un dictionnaire contenant `scaled: numpy.ndarray`. Le bloc `kmeans` attend un `pd.DataFrame`. Par ailleurs, `standard_scaler` fait doublon avec `normalize` (`transformations-EC4899`) qui opère sur les tenseurs.
- **Action corrective (§02 / §04) :** Unifier sous un unique bloc `normalize` supportant la stratégie selon la famille de données entrante (`DataFrame` vs `Tensor`), ou formaliser la conversion bidirectionnelle `ndarray <-> DataFrame`.

### Gap P0.5 — Duplication historique `conv2d` vs `conv2d_layer` (Exo A1 / Bug #14)
- **Exercice concerné :** `A1 CIFAR-10 CNN — 60min Blitz`
- **Symptôme actuel :** Les blocs `conv2d`, `linear`, `flatten`, `relu`, `maxpool2d` de la catégorie `convolution` appliquent des opérations fonctionnelles éphémères `nn.*()(x)` sur des tenseurs. Leurs sorties `torch.Tensor` sont rejetées par les optimiseurs (`adam`, `sgd`) qui exigent des `torch.nn.Module` persistants.
- **Action corrective (§02) :** `A1` valide déjà avec `conv2d_layer`. L'étape §02 actera la suppression des 5 blocs `Tensor` éphémères (`conv1d`, `conv2d`, `conv3d`, `conv_transpose2d`, `linear`) et mettra en place un adaptateur de compatibilité pour les anciens graphes.

---

## 4. Analyse des Gaps P1 (Secondaires / Post-v1)

### Gap P1.1 — Pont `env <-> tensor / policy` pour CartPole DQN (Exo C2)
- **Exercice concerné :** `C2 CartPole DQN (PyTorch)`
- **Symptôme actuel :**  
  - `Type mismatch: env.out_1 (Env) -> fc1.in_1 (torch.nn.Module)`  
  - `Type mismatch: trainer.model (torch.nn.Module) -> eval.policy (Policy)`
- **Analyse :** Le monde d'apprentissage par renforcement `SX World` (`Env`, `Policy`) est conçu pour être strictement étanche en v1 (validé avec succès dans C1 tabulaire). C2 tente de faire transiter l'état de l'environnement directement vers les couches `Module` et de connecter le réseau de neurones à `evaluate_agent`. Pour ne pas complexifier prématurément le modèle de stages en v1, C2 sera traité en P1 via un adaptateur dédié `Adapter env <-> tensor / policy`.

### Gap P1.2 — Famille dédiée pour les schedulers de taux d'apprentissage et Early Stopping
- **Exercices concernés :** Extensions avancées de `A1`
- **Symptôme actuel :** `step_lr`, `cosine_lr`, `reduce_lr_on_plateau` retournent des types spécifiques (`CosineAnnealingLR`, `StepLR`, etc.) sans famille unifiée reconnue dans `core/types.py`. `early_stopping` consomme un `float` et retourne un `bool`.
- **Analyse :** Ces blocs fonctionnent en exécution locale mais restent isolés dans le typage. Il sera tranché en §04 si la famille `optim` doit absorber les schedulers ou si une famille `scheduler` distincte doit être introduite.

---

## 5. Conclusion & Feuilles de Route Suivantes

1. **§02 Réduction des blocs :** Procéder à la suppression des 5 blocs Tensor éphémères, à la fusion des 3 paires (`relu`, `maxpool2d`, `flatten`), à la dépréciation de `embedding` / `dropout`, et au masquage des 9 activations avancées.
2. **§04 + §05 Typage & Stages :** Implémenter les 5 stages canoniques (`S0..S4, SX`), résoudre les 5 gaps P0 identifiés ci-dessus et aligner le frontend `typeCheck.ts` avec `core/types.py`.
