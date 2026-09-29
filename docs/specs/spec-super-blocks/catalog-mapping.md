# Catalog Mapping — Super-Blocks & Containers

This companion document catalogs the absorption of the existing 91 blocks into the 4 Super-Blocks defined in `SPEC-super-blocks`.

---

## 1. Mapping Matrix by Super-Block

| Super-Block | Target Stage | Absorbed Blocks from Catalog (Total: 86) | Output Interface |
|---|:---:|---|---|
| **`SequentialModel`** | Stage 2 (Represent) | `conv1d_layer`, `conv2d_layer`, `conv3d_layer`, `conv_transpose2d_layer`, `linear_layer`, `flatten_layer`, `maxpool2d_layer`, `relu_layer`, `dropout`, `embedding_layer`, `upsample`, `batchnorm1d`, `batchnorm2d`, `layernorm`, `avgpool2d`, `adaptive_avgpool2d`, `relu`, `leaky_relu`, `sigmoid`, `softmax`, `tanh`, `elu`, `gelu`, `silu`, `lstm`, `gru`, `rnn` (37 blocks) | `model: torch.nn.Module` |
| **`DeepTrainer`** | Stage 3 (Train) | `train_model`, `train_epoch`, `evaluate`, `adam`, `sgd`, `cross_entropy_loss`, `mse_loss`, `step_lr`, `reduce_lr_on_plateau`, `cosine_lr`, `early_stopping`, `model_checkpoint`, `confusion_matrix` (14 blocks) | `metrics: dict`, `trained_model: nn.Module` |
| **`DataPipeline`** | Stage 0/1 (Ingest/Prepare) | `load_torch_dataset`, `load_csv`, `load_image`, `sequence_dataset`, `torch_dataset`, `train_test_split`, `resize`, `random_crop`, `random_flip`, `to_tensor`, `normalize`, `tokenize`, `build_vocab`, `encode_text`, `data_loader`, `df_to_loader`, `tensor_dataset`, `random_split` (18 blocks) | `train_loader: DataLoader`, `test_loader: DataLoader` |
| **`MLPipeline`** | Stage 1/2B (Prepare/Represent) | `load_sklearn_dataset`, `standard_scaler`, `polynomial_features`, `pca`, `logistic_regression`, `linear_regression`, `random_forest`, `decision_tree`, `svm`, `knn`, `kmeans`, `isolation_forest`, `silhouette` (12 blocks) | `model: Model`, `predictions: ndarray` |
| **`RLStudio`** | Stage 9/3 (World/Train) | `create_env`, `q_learning`, `evaluate_agent`, `env_to_tensor`, `module_to_policy` (5 blocks) | `score: float`, `artifacts: bytes` |

---

## 2. Autonomous Atomic Blocks Remaining on Canvas

These blocks remain independent nodes on the canvas and connect directly to Super-Block outputs:
- `plot_predictions` (Stage 4 — Eval) : Visualization of loss/accuracy curves or scatter plots.
- `tsne` (Stage 4 — Eval) : Dimensionality reduction projections for high-dimensional representations.
