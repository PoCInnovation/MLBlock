# Exercices de Référence MLBlock (EXOS.md)

> **Document de référence — UX Blocks Rework (Étape 1/5)**  
> Ce document synthétise les **12 exercices canoniques** couvrant le périmètre fonctionnel cible de MLBlock (Deep Learning, Machine Learning classique scikit-learn et Reinforcement Learning).  
> Tous les exercices reposent sur des tutoriels et documentations officielles vérifiées (`pytorch.org`, `scikit-learn.org`, `gymnasium.farama.org`).  
> Leurs définitions exécutables sont stockées au format JSON dans `backend/mlblock/configs/exos/`.

---

## 1. Tableau Récapitulatif des 12 Exercices

| ID | Nom | Structure DAG | Stages IA | Familles | Source Officielle | Critères d'Acceptation & Statut |
|---|---|---|---|---|---|---|
| **A1** | **CIFAR-10 CNN — 60min Blitz** | `load_torch_dataset(cifar10)` → `data_loader` → `conv2d_layer(3→32,k3)` → `relu_layer` → `maxpool2d_layer(2)` → `conv2d_layer(32→64)` → `flatten_layer` → `linear_layer(4096→10)` → `adam(lr=0.001)` + `cross_entropy_loss` → `train_model(epochs=5)` | `S0 → S1 → S2A → S3A` | `dataset → module → optim → dict` | [PyTorch — Training a Classifier (CIFAR-10)](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html) / [60min Blitz](https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html) | Accuracy > 60% en 2 époques. `validate` valide ✅ (Baseline DL). |
| **A2** | **Fashion-MNIST Quickstart** | `load_torch_dataset(fashion_mnist)` → `normalize(mean,std)` → `data_loader` → `linear_layer(784→128)` → `relu_layer` → `linear_layer(128→10)` → `sgd` + `cross_entropy_loss` → `train_model` | `S0 → S1 → S2A → S3A` | `dataset → tensor → module → optim → dict` | [PyTorch — Learn the Basics: Quickstart](https://pytorch.org/tutorials/beginner/basics/intro.html) | Accuracy > 80%. Démontre la chaîne Dataset/DataLoader, SGD et classification d'images 10 classes. *Gap S1 `dataset → tensor` documenté §03.* |
| **A3** | **MNIST from scratch — What is torch.nn really?** | `load_torch_dataset(mnist)` → `linear_layer(784→10)` → `sgd` + `cross_entropy_loss` → `train_model` | `S0 → S2A → S3A` | `dataset → module → optim → dict` | [PyTorch — What is torch.nn really? (MNIST)](https://pytorch.org/tutorials/beginner/nn_tutorial.html) | Modèle linéaire minimaliste d'entrée. `validate` valide ✅. Pédagogie : montre pourquoi `Module` > `Tensor` (justifie ADR 0001 & résolution bug #14). |
| **A4** | **Tabular Iris — df→tensor** | `load_sklearn_dataset(iris)` → `train_test_split` → `df_to_tensor` → `linear_layer(4→16)` → `relu_layer` → `linear_layer(16→3)` → `adam` + `cross_entropy_loss` → `train_model` | `S0 → S1 → S2A → S3A` | `df → tensor → module → optim → dict` | [scikit-learn — load_iris](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_iris.html) + pont PyTorch | Test de la seule arête `df → tensor` (`core/types.py`). *Gap `df_to_tensor` auto-insert via bulle Astryx documenté §03/§05.* |
| **A5** | **CIFAR-10 + augmentation** | `load_torch_dataset(cifar10)` → `random_crop(32)` → `random_flip(0.5)` → `normalize(mean,std)` → `data_loader` → CNN (A1) → `train_model` | `S0 → S1 → S2A → S3A` | `image → tensor → module` | [torchvision — Transforms](https://pytorch.org/vision/stable/transforms.html) + CIFAR-10 | Chaîne de transformations image en S1 (`random_crop`, `random_flip`, `normalize`). *Gap auto-insert transformations documenté §03.* |
| **A6** | **NLP Text Classification — LSTM** | `tokenize` → `build_vocab` + `encode_text` → `embedding` → `lstm` → `linear_layer` → `adam` + `cross_entropy_loss` → `train_model` | `S0 → S1 → S2A → S3A` | `str → list → ndarray → tensor → module → dict` | [PyTorch — Char RNN Classification](https://pytorch.org/tutorials/intermediate/char_rnn_classification_tutorial.html) + LSTM many-to-one | Classification de sentiments / phrases toy. Accuracy > 70%. *Gap désynchronisation `list[str]`/`ndarray` documenté §03.* |
| **A7** | **Time-series Sequence** | `load_sklearn_dataset(iris)` → `sequence_dataset(seq_len=8)` → `rnn_layer(4→8)` → `linear_layer(8→1)` → `adam` + `mse_loss` → `train_model` | `S0 → S1 → S2A → S3A` | `df \| ndarray → dataset → module → optim → dict` | [PyTorch — Time Series with RNN/LSTM](https://pytorch.org/tutorials/) | Régression par fenêtres glissantes séquentielles. `validate` valide ✅. Teste l'union de types `DataFrame \| ndarray`. |
| **B1** | **Iris Classification — LogisticRegression** | `load_sklearn_dataset(iris)` → `train_test_split(0.7)` → `logistic_regression(max_iter=200)` → `evaluate(accuracy)` | `S0 → S2B → S4` | `df → model → dict/float` | [scikit-learn — Iris LogisticRegression](https://scikit-learn.org/stable/auto_examples/linear_model/plot_iris_logistic.html) | Accuracy > 90%. `validate` valide ✅. Pipeline ML classique sans étape S3A (`optim`/`loss` absents). |
| **B2** | **Iris PCA — 4D→2D** | `load_sklearn_dataset(iris)` → `pca(n_components=2)` → `plot_predictions` | `S0 → S2B → S4` | `df → model/ndarray → bytes` | [scikit-learn — First three PCA directions (Iris)](https://scikit-learn.org/stable/auto_examples/decomposition/plot_pca_iris.html) | Réduction 4D → 2D, export visuel PNG. `validate` valide ✅. |
| **B3** | **Iris KMeans — Elbow** | `load_csv(iris.csv)` → `standard_scaler` → `kmeans(n_clusters=3)` → `silhouette` | `S0 → S1 → S2B → S4` | `df → ndarray/model → float` | [scikit-learn — Unsupervised learning tutorial](https://scikit-learn.org/stable/tutorial/statistical_inference/unsupervised_learning.html) | Clustering k-moyennes non supervisé avec score de silhouette. *Gap doublon `standard_scaler` / `normalize` documenté §02/§03.* |
| **C1** | **CartPole-v1 Tabular Q-learning** | `create_env(CartPole-v1)` → `q_learning(episodes=5000)` → `evaluate_agent` | `SX → S3 (RL) → S4` | `env → policy → float` | [gymnasium.farama.org — CartPole](https://gymnasium.farama.org/environments/classic_control/cart_pole/) | Score moyen > 100 en 5000 épisodes. `validate` valide ✅ (Baseline RL monde isolé `SX`). |
| **C2** | **CartPole DQN (PyTorch)** | `create_env(CartPole-v1)` → `linear_layer(4→128)` → `relu_layer` → `linear_layer(128→2)` → `adam` + `mse_loss` → `train_model` → `evaluate_agent` | `SX + S2A → S3A → S4` | `env → tensor → module → policy` | [PyTorch — Reinforcement Learning (DQN) Tutorial](https://pytorch.org/tutorials/intermediate/reinforcement_q_learning.html) | Score > 300. Démontre la rupture d'isolement SX et justifie l'adapter `env ↔ tensor` classé P1 post-v1. |

---

## 2. Détail par Modèle & Pattern Architectural

### Pattern A — Deep Learning Supervisé (PyTorch)
- **Squelette :** `S0 Ingest → S1 Prepare → S2A Represent DL → S3A Train DL → S4 Eval`
- **Caractéristiques :** 
  - Présence indispensable d'une architecture modulaire `torch.nn.Module` (`*_layer`).
  - Entraînement itératif multi-époques combinant `model`, `DataLoader`, `Optimizer` (`adam`, `sgd`) et fonction de perte (`cross_entropy_loss`, `mse_loss`).
  - Fichiers configs : `a1_cifar10_cnn.json` à `a7_timeseries_sequence.json`.

### Pattern B — Machine Learning Tabulaire & Non-Supervisé (scikit-learn)
- **Squelette :** `S0 Ingest → (S1 Prepare) → S2B Represent ML → S4 Eval`
- **Caractéristiques :**
  - Pas d'étape `S3A` (pas de boucle d'optimisation ni de perte explicite ; fit direct dans le bloc modèle).
  - Évaluation directe via des métriques dédiées (`evaluate`, `silhouette`) ou restitution graphique (`plot_predictions`).
  - Fichiers configs : `b1_iris_logistic_regression.json`, `b2_iris_pca.json`, `b3_iris_kmeans_elbow.json`.

### Pattern C — Apprentissage par Renforcement (Gymnasium & PyTorch)
- **Squelette :** `SX World (Env) → S3 Train RL (Policy) → S4 Eval Agent`
- **Caractéristiques :**
  - `C1 (P0 Tabulaire)` : Monde complètement étanche où les familles `env` et `policy` n'interagissent pas avec les tenseurs.
  - `C2 (P1 Réseau DQN)` : Pont complexe entre l'environnement Gymnasium et un réseau de neurones profond (Q-network), constituant un cas limite traité par adaptateur.
  - Fichiers configs : `c1_cartpole_tabular_qlearning.json`, `c2_cartpole_dqn.json`.

---

## 3. Matrice de Couverture Exo × Stage IA

| Exercice | S0 Ingest | S1 Prepare | S2A DL | S2B ML | S3A Train DL | S4 Eval | SX World |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **A1** (CIFAR-10 CNN) | ✓ | ✓ | ✓ | | ✓ | | |
| **A2** (Fashion-MNIST) | ✓ | ✓ | ✓ | | ✓ | | |
| **A3** (MNIST scratch) | ✓ | | ✓ | | ✓ | | |
| **A4** (Iris df→tensor) | ✓ (df) | ✓ (df→tensor) | ✓ | | ✓ | | |
| **A5** (CIFAR-10 augm) | ✓ | ✓ (augm) | ✓ | | ✓ | | |
| **A6** (NLP LSTM) | ✓ (str) | ✓ (vocab/enc) | ✓ (lstm) | | ✓ | | |
| **A7** (Séries temporelles) | ✓ | ✓ (seq) | ✓ (rnn) | | ✓ | | |
| **B1** (Iris Logistic Reg) | ✓ | | | ✓ | | ✓ | |
| **B2** (Iris PCA) | ✓ | | | ✓ | | ✓ | |
| **B3** (Iris KMeans) | ✓ | ✓ (scaler) | | ✓ | | ✓ | |
| **C1** (CartPole Tabular) | | | | | | ✓ | ✓ |
| **C2** (CartPole DQN) | | | ✓ | | ✓ | ✓ | ✓ |

---

## 4. Emplacement des Fichiers

Les configurations JSON canoniques sont consultables et exécutables dans :
```
backend/mlblock/configs/exos/
├── a1_cifar10_cnn.json
├── a2_fashion_mnist_quickstart.json
├── a3_mnist_scratch.json
├── a4_tabular_iris_df_to_tensor.json
├── a5_cifar10_augmentation.json
├── a6_nlp_lstm.json
├── a7_timeseries_sequence.json
├── b1_iris_logistic_regression.json
├── b2_iris_pca.json
├── b3_iris_kmeans_elbow.json
├── c1_cartpole_tabular_qlearning.json
└── c2_cartpole_dqn.json
```
