# 01 — Exercices de référence (torch / sklearn / RL)

> **But:** Figer 12 DAGs canoniques qui **couvrent** tout ce que MLBlock veut enseigner. Tout le reste (gaps, réduction, familles, typage) se juge contre cette liste. Sources = docs officielles `pytorch.org` / `scikit-learn.org` / `gymnasium.farama.org` (recherche web 2026-09-11, pas d'exos inventés).

## Méthode

1. **Collecte:** chaque exo = 1 tuto officiel → 1 DAG `Pipeline` MLBlock.
2. **Normalisation:** `id / pattern A/B/C / stages S0..S4 / families / dataset / source / critère`.
3. **Gate:** chaque DAG doit passer `validation.validate` aujourd'hui ou gap P0 documenté en §03.

## Pattern A — Supervisé DL (pytorch.org, 7 exos)

> Squelette: `S0 Ingest → S1 Prepare → S2A Represent (tensor/module) → S3A Train (module+dataset+optim+loss) → S4 Eval`

| # | Exo | DAG MLBlock (→ = edge) | Familles | Source officielle | Critère |
|---|---|---|---|---|---|
| **A1** | **CIFAR-10 CNN — 60min Blitz** | `load_torch_dataset(CIFAR10)` → `data_loader` → `conv2d_layer(3→32,k3)` → `relu_layer` → `maxpool2d_layer(2)` → `conv2d_layer(32→64)` → `flatten_layer` → `linear_layer(64*8*8→10)` → `cross_entropy_loss` → `adam(lr=0.001)` → `train_model(epochs=5)` → `evaluate` | `dataset→tensor→module→optim→dict` | [pytorch.org — Training a Classifier (CIFAR-10)](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html) + [60min Blitz](https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html) — flagship tuto débutant, `torchvision` + `nn.Conv2d` + `SGD(momentum)` + train/test loops | accuracy > 60% en 2 epochs, `validate` vert |
| **A2** | **Fashion-MNIST Quickstart** | `load_torch_dataset(FashionMNIST)` → `normalize(mean,std)` → `data_loader` → `linear_layer(784→128)` → `relu_layer` → `linear_layer(128→10)` → `sgd` → `cross_entropy_loss` → `train_model` | `dataset→tensor→module→dict` | [pytorch.org — Learn the Basics: Quickstart](https://pytorch.org/tutorials/beginner/basics/intro.html) — utilise `Fashion-MNIST` (10 classes vêtements) pour `Dataset/DataLoader`, `torch.nn`, `autograd`, `optim` | accuracy > 80% |
| **A3** | **MNIST from scratch — What is torch.nn really?** | `load_torch_dataset(MNIST)` → `linear_layer` → `train_model` (refactor progressif `Tensor → nn → optim → DataLoader`) | `tensor→module` | [pytorch.org — What is torch.nn really? (MNIST)](https://pytorch.org/tutorials/beginner/nn_tutorial.html) — part de `torch.Tensor` brut puis refactor vers `nn`/`optim`/`Dataset` | pédagogique: montre pourquoi `Module` > `Tensor` (cf issue #14) |
| **A4** | **Tabular Iris — df→tensor** | `load_sklearn_dataset(iris)` → `train_test_split` → `df_to_tensor` → `linear_layer(4→16)` → `relu_layer` → `linear_layer(16→3)` → `adam` → `cross_entropy_loss` → `train_model` | `df→tensor→module→dict` | Pont `sklearn.datasets.load_iris` (150×4, 3 classes) + `df_to_tensor` est la seule arête `df→tensor` du graphe (`core/types.py:70`) — exo manquant aujourd'hui | `incompatible df→tensor` doit devenir `convertible` auto-insert |
| **A5** | **CIFAR-10 + augmentation** | A1 + `random_crop` + `random_flip` + `normalize` en S1 | `image→tensor→module` | Variante A1 — teste `transformations: random_crop/flip/resize` (self-loops `tensor→tensor` aujourd'hui ignorés) | visuel: `S1` auto-insert |
| **A6** | **NLP Text Classification — LSTM** | `load_text` → `tokenize(sep)` → `build_vocab` → `encode_text` → `embedding(vocab,dim)` → `lstm(input,hidden)` → `linear_layer` → `cross_entropy_loss` → `train_model` | `str→list→ndarray→tensor→module→dict` | [pytorch.org — Char RNN Classification](https://pytorch.org/tutorials/intermediate/char_rnn_classification_tutorial.html) + tuto LSTM many-to-one `Embedding→LSTM(batch_first)→Linear` — séquence `tokenize→vocab→encode_text→ndarray` doit finir en `tensor` | accuracy > 70% sur toy sentiment |
| **A7** | **Time-series Sequence** | `sequence_dataset(df|ndarray, seq_len)` → `gru`/`lstm` → `linear_layer` → `mse_loss` | `df|ndarray→dataset→module` | `sequence_dataset` a `dtype: pd.DataFrame \| numpy.ndarray → DataLoader` — union ` | ` mal gérée côté front (`typeCheck.ts` pas de `_split_union`) | `S1` union → `tensor` |

> **Note A1-A3:** `pytorch.org` ne fournit pas d'"exercices à trous" mais des walkthroughs Colab. Les 3 variantes (CIFAR-10 CNN, Fashion-MNIST Quickstart, MNIST from scratch) sont les **3 tutos d'entrée** officiels — ils couvrent exactement les mêmes `blocks` avec des `families` différentes, d'où 3 exos distincts côté MLBlock.

## Pattern B — Non-supervisé / sklearn (scikit-learn.org, 3 exos)

> Squelette: `S0 Ingest (df) → S1 Prepare (optionnel) → S2B Represent (df→model/dict) → S4 Eval` — **pas de S3A** (`optim`/`loss` absents)

| # | Exo | DAG MLBlock | Familles | Source officielle | Critère |
|---|---|---|---|---|---|
| **B1** | **Iris Classification — LogisticRegression** | `load_sklearn_dataset(iris)` → `train_test_split` → `logistic_regression` → `evaluate` | `df→model→dict` | [scikit-learn — Iris LogisticRegression](https://scikit-learn.org/stable/auto_examples/linear_model/plot_iris_logistic.html) + [load_iris](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_iris.html) — `X_train,X_test,y_train,y_test = train_test_split(X,y)` + `LogisticRegression(max_iter=200).fit` + `accuracy_score` | accuracy > 90% |
| **B2** | **Iris PCA — 4D→2D** | `load_sklearn_dataset(iris)` → `pca(n_components=2)` → `plot_predictions` | `df→dict→bytes` | [scikit-learn — First three PCA directions (Iris)](https://scikit-learn.org/stable/auto_examples/decomposition/plot_pca_iris.html) — `PCA(n_components=3).fit_transform(X)` + scatter 3D, `explained_variance_ratio_` | `dict[model: Model, transformed: ndarray]` → `bytes` PNG |
| **B3** | **Iris KMeans — Elbow** | `load_csv(iris.csv)` → `standard_scaler` → `kmeans(n_clusters=3)` → `silhouette` | `df→model→float` | [scikit-learn — Unsupervised learning tutorial](https://scikit-learn.org/stable/tutorial/statistical_inference/unsupervised_learning.html) — `KMeans(n_clusters=3,n_init=10).fit(X)` + `inertia_` elbow 1..6 | `silhouette` doit recevoir `model` depuis `kmeans` |

> **Synthèse sklearn:** Iris (150×4, 3 classes) est le *hello world* commun aux 3 tutos — 1 dataset, 3 `Pattern B` (classification supervisée `B1` avec `Model`, réduction `B2`, clustering `B3`). Couvre `modeles-F59E0B` (10 blocks) + `standard_scaler`/`pca`/`kmeans` qui sont `df→dict` et n'ont jamais de `optim`.

## Pattern C — RL (gymnasium.farama.org + pytorch.org, 2 exos)

> Squelette: `SX World (env/policy) → S3 Train RL → S4 Eval` — **familles isolées** `env`/`policy` qui ne touchent jamais `tensor`

| # | Exo | DAG MLBlock | Familles | Source officielle | Critère |
|---|---|---|---|---|---|
| **C1** | **CartPole-v1 Tabular Q-learning** | `create_env(CartPole-v1)` → `q_learning(episodes=5000, bins=(1,1,6,6))` → `evaluate_agent` | `env→policy→float` | [gymnasium.farama.org — CartPole](https://gymnasium.farama.org/environments/classic_control/cart_pole/) + binning 4 obs continues `(pos, vel, angle, ang_vel) → tuple bins` + Q-table `1×1×6×6×2` (tabular, pas DQN) — discretisation manuelle car `observation_space` continu | score > 100 en 5000 épisodes |
| **C2** | **CartPole DQN (PyTorch)** | `create_env(CartPole-v1)` → `lstm`/`linear_layer` (Q-network `4→128→2`) → `adam` → `train_model` (Experience Replay + Target Network) → `evaluate_agent` | `env→tensor→module→policy` | [pytorch.org — Reinforcement Learning (DQN) Tutorial](https://pytorch.org/tutorials/intermediate/reinforcement_q_learning.html) — `MLP(4→128→2)`, `ReplayMemory`, `Target Network` — pont `tensor↔env` qui **cassee** la séparation `SX` isolé, d'où variante `C2` vs `C1` | score > 300, montre pourquoi `C` a 2 sous-patterns |

> **Pourquoi 2 exos RL:** `pytorch.org` recommande **DQN** (réseau) pour CartPole car binning tabular est imprécis et ne scale pas. MLBlock a `q_learning` tabular (bins) → `C1` est P0, `C2` est P1 qui exige `tensor`/`module` dans `SX` — cas limite pour le typage par stage (§04).

## Matrice exo × stage (pour §04)

| Exo | S0 Ingest | S1 Prepare | S2A DL | S2B ML | S3A Train DL | S4 Eval | SX World |
|---|---|---|---|---|---|---|---|
| A1-3,A5 | ✓ | ✓ | ✓ |  | ✓ | ✓ |  |
| A4 | ✓(df) | ✓(df→tensor) | ✓ |  | ✓ | ✓ |  |
| A6 | ✓(str) | ✓(tokenize) | ✓(embedding/lstm) |  | ✓ | ✓ |  |
| A7 | ✓ | ✓ | ✓(gru) |  | ✓ | ✓ |  |
| B1-B3 | ✓ |  |  | ✓ |  | ✓ |  |
| C1 |  |  |  |  |  | ✓ | ✓ |
| C2 |  |  | ✓ |  | ✓ | ✓ | ✓ |

## Critères d'acceptation

* [ ] 12 DAGs en `configs/exos/*.json` + 1 `EXOS.md` qui les liste avec `source` + `families` + `stages`
* [ ] Chaque DAG passe `validation.validate` aujourd'hui **ou** gap P0 listé en [03-evaluation-gaps](./03-evaluation-gaps.md)
* [ ] Datasets < 50MB, sans auth (`torchvision.datasets.CIFAR10/MNIST/FashionMNIST`, `sklearn.datasets.load_iris`, `gymnasium CartPole-v1`)

## Risques

* **Torch vs sklearn `Model`:** `Model` (sklearn, `family=model`) ≠ `torch.nn.Module` (`family=module`) — ne pas les mélanger avant §04 (bug #14).
* **Union ` | `:** `sequence_dataset: pd.DataFrame | numpy.ndarray → DataLoader` — front `typeCheck.ts` sans `_split_union` = `incompatible` faux.

## Sources (recherche web 2026-09-11)

* [PyTorch — Training a Classifier (CIFAR-10)](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html) + [60min Blitz](https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html)
* [PyTorch — Learn the Basics / Fashion-MNIST](https://pytorch.org/tutorials/beginner/basics/intro.html)
* [PyTorch — What is torch.nn really? (MNIST)](https://pytorch.org/tutorials/beginner/nn_tutorial.html)
* [PyTorch — Char RNN Classification](https://pytorch.org/tutorials/intermediate/char_rnn_classification_tutorial.html) + [Reinforcement Q-learning (DQN)](https://pytorch.org/tutorials/intermediate/reinforcement_q_learning.html)
* [scikit-learn — load_iris](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_iris.html) + [Iris LogisticRegression](https://scikit-learn.org/stable/auto_examples/linear_model/plot_iris_logistic.html) + [PCA Iris](https://scikit-learn.org/stable/auto_examples/decomposition/plot_pca_iris.html) + [Unsupervised](https://scikit-learn.org/stable/tutorial/statistical_inference/unsupervised_learning.html)
* [gymnasium — CartPole-v1](https://gymnasium.farama.org/environments/classic_control/cart_pole/) + discretisation Q-table (`1×1×6×6×2`)
