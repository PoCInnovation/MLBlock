## Context

65 blocs, 11 catégories (`{nom}_{hex}`). `_color_from_folder` = regex `^.*_([0-9A-Fa-f]{6})$` ; `cat_name = name.rsplit("_", 1)[0]` — le parsing dépend du underscore. Torchvision absent (5 blocs transforms cassés), gymnasium retiré au fix deploy. Types : df/tensor/model/dataset/optim/module/ndarray/dict/tuple/scalar/str/any — pas d'image, pas de list. Le build exécute le pipeline réel (shape inference), les DataFrames et DataLoaders coexistent (sklearn vs torch). Tests : `test_block.py` référence `neural_conv` (catégorie) — à adapter au renommage.

## Goals / Non-Goals

**Goals:**
- Débloquer les 5 blocs transforms (torchvision) et réintroduire le RL (gymnasium)
- Type image (PIL.Image) avec conversion vers tensor ; datasets intégrés sklearn + torchvision
- Combler les gaps d'exercices : polynomial, kmeans, silhouette, t-SNE, séquences, NLP, métriques, anomalie, RL
- Dossiers français `{nom}-{hex}` sans underscore + parsing registry adapté

**Non-Goals:**
- stable-baselines3 (RL avancé) — gymnasium seul, Q-learning tabulaire
- UMAP (t-SNE suffit) ; ARIMA (le séquentiel torch couvre les séries)
- Types audio/autre (scope images + texte)
- Migration de données (les projets stockent les types de blocs, pas les catégories)

## Decisions

### D1 — Dépendances
`torchvision` + `gymnasium` dans pyproject (gymnasium sans stable-baselines3). `uv sync` puis run local des 5 blocs transforms pour valider. Pillow vient en transitif (torchvision).

### D2 — Type image
- `family_of("PIL.Image.Image") → "image"` dans `core/types.py`.
- Graphe de conversion : `image → tensor` via `to_tensor` (le bloc existe ; son annotation d'entrée devient `PIL.Image.Image`). `df → image` et `image → df` : incompatibles (rouge).
- Build : les racines image reçoivent un tensor CHW factice `randn(3, 224, 224)` — `family_of` sur le dtype `torch.Tensor` reste `tensor`, donc l'injection existante convient (le shape par défaut `[1,1,28,28]` est étendu : si le bloc déclare un input image, shape CHW).
- `load_image(path: file) → PIL.Image.Image` : télécharge l'URL storage (même helper que load_csv), retourne l'image.

### D3 — Datasets intégrés (2 blocs, sorties typables)
- `load_sklearn_dataset(name: str, target: str = "target") → pd.DataFrame` : iris/digits/wine/breast_cancer → DataFrame complet (features + target) — compatible tous les blocs sklearn existants.
- `load_torch_dataset(name: str, batch_size: int = 32, split: str = "train") → torch.utils.data.DataLoader` : MNIST/FashionMNIST/CIFAR10 (torchvision, download auto dans un cache local) — compatible `train_model`/`train_epoch`/`random_split`.

### D4 — Nouveaux blocs (12)
| Bloc | Dossier | Signature | Rôle |
|---|---|---|---|
| `polynomial_features` | transformations | `(df, degree=2) → DataFrame` | colonnes polynomiales |
| `kmeans` | modeles | `(df, n_clusters=3) → Model` | clustering sklearn |
| `silhouette` | entrainement | `(df, labels) → float` | score de clustering |
| `tsne` | modeles | `(df, n_components=2) → ndarray` | réduction t-SNE |
| `sequence_dataset` | donnees | `(df|ndarray, seq_len=10) → DataLoader` | fenêtres glissantes (RNN/séries) |
| `tokenize` | texte | `(text, sep=" ") → list[str]` | split en tokens |
| `build_vocab` | texte | `(tokens: list[str]) → dict` | vocabulaire index→token |
| `encode_text` | texte | `(tokens: list[str], vocab: dict) → ndarray` | indices numériques |
| `confusion_matrix` | entrainement | `(model, test_data, target_column) → ndarray` | matrice de confusion |
| `isolation_forest` | modeles | `(df, contamination=0.1) → Model` | détection d'anomalies |
| `create_env` | renforcement | `(env_id="CartPole-v1") → Env` | environnement gymnasium |
| `q_learning` | renforcement | `(env, episodes=500, lr=0.1, gamma=0.99) → Policy` | Q-table |
| `evaluate_agent` | renforcement | `(env, policy, episodes=10) → float` | récompense moyenne |

- `evaluate` étendu : method `mse\|accuracy\|f1\|precision\|recall` (sklearn.metrics, lazy import).
- Types nouveaux : famille `list` (`list[str]` → `list`), `Env` (gymnasium.Env → famille `env`), `Policy` (famille `policy`, wildcard pour le feu tricolore). Docstrings FR avec suffixes structurés (convention existante).

### D5 — Renommage français `{nom}-{hex}`
- Registry : `_color_from_folder` → regex `^.*[-_]?([0-9A-Fa-f]{6})$` ; `cat_name` → `re.sub(r"[-_][0-9A-Fa-f]{6}$", "", name)` (ou nom entier si pas de suffixe).
- Renommages : `data→donnees`, `data_loader→chargement`, `models→modeles`, `neural_activation→activation`, `neural_conv→convolution`, `neural_norm→normalisation`, `neural_pool→regroupement`, `neural_rnn→sequences`, `training→entrainement`, `transforms→transformations`, `visualization→visualisation`. Nouveaux : `texte`, `renforcement`. (`git mv` pour préserver l'historique.)
- `test_block.py` : références `neural_conv` → nouvelles catégories. Les ids de catégories changent côté catalogue — le frontend les affiche dynamiquement (aucun changement requis).

### D6 — Vérification par exercice
Chaque exercice de la grille est validé par un run local (`MLBLOCK_RUN_MODE=local`) : pipeline construit via l'API → execute → job done + sorties typées. Liste de contrôle dans les tasks (classification, CNN MNIST, clustering, NLP, RL cartpole, séries).

## Risks / Trade-offs

- **Gymnasium** : dépendance réintroduite (avait été retirée pour la taille de déploiement) — poids maîtrisé sans stable-baselines3 ; le déploiement Render doit re-tester le cold start (matplotlib était le problème, pas gymnasium).
- **`sequence_dataset`** : type DataLoader générique — les étiquettes de séquence sont les valeurs suivantes (fenêtre) — documenté dans la docstring.
- **`load_torch_dataset`** : télécharge MNIST/CIFAR au premier run (réseau + cache) — le run local est le seul concerné (le GPU Vast a le réseau).
- **Renommage** : `git mv` + parsing adapté — risque de casse de découverte (les tests test_block couvrent).
- **`encode_text`** : vocab non trié par fréquence (PoC) — tri par fréquence si besoin réel.
