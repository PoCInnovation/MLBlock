## 1. Schema & Discovery

- [x] 1.1 Add `options: list[str] | None = None` to `ParamInfo` in `backend/mlblock/server/schemas.py`
- [x] 1.2 Update `_inspect_function` in `backend/mlblock/blocks/registry.py` to detect `typing.Literal` and populate `options`

## 2. Neural Blocks — Activation & Pooling

- [x] 2.1 `relu.py` — no changes needed (no choice params)
- [x] 2.2 `leaky_relu.py` — no changes needed
- [x] 2.3 `prelu.py` — no changes needed
- [x] 2.4 `elu.py` — no changes needed
- [x] 2.5 `selu.py` — no changes needed
- [x] 2.6 `gelu.py` — no changes needed
- [x] 2.7 `silu.py` — no changes needed
- [x] 2.8 `sigmoid.py` — no changes needed
- [x] 2.9 `tanh.py` — no changes needed
- [x] 2.10 `softmax.py` — no changes needed (dim is int)
- [x] 2.11 `dropout.py` — `p` is float, no Literal needed
- [x] 2.12 `maxpool2d.py` — no padding parameter, no changes needed
- [x] 2.13 `avgpool2d.py` — no padding parameter, no changes needed
- [x] 2.14 `adaptive_avgpool2d.py` — no choice params
- [x] 2.15 `adaptive_maxpool2d.py` — no choice params
- [x] 2.16 `batchnorm1d.py` — no choice params
- [x] 2.17 `batchnorm2d.py` — no choice params
- [x] 2.18 `instancenorm2d.py` — no choice params
- [x] 2.19 `layernorm.py` — no choice params
- [x] 2.20 `upsample.py` — `mode: Literal["nearest", "bilinear", "bicubic", "trilinear"]`

## 3. Neural Blocks — Linear, Conv, RNN

- [x] 3.1 `linear.py` — no choice params (activation applied separately)
- [x] 3.2 `conv1d.py` — no changes needed (padding is int)
- [x] 3.3 `conv2d.py` — no changes needed (padding is int)
- [x] 3.4 `conv3d.py` — no changes needed (padding is int)
- [x] 3.5 `conv_transpose2d.py` — no changes needed (padding is int)
- [x] 3.6 `embedding.py` — no choice params
- [x] 3.7 `flatten.py` — no choice params
- [x] 3.8 `identity.py` — no choice params
- [x] 3.9 `rnn.py` — `nonlinearity: Literal["tanh", "relu"]`
- [x] 3.10 `lstm.py` — no choice params
- [x] 3.11 `gru.py` — no choice params
- [x] 3.12 `multihead_attention.py` — no choice params

## 4. Training Blocks

- [x] 4.1 `adam.py` — no choice params
- [x] 4.2 `sgd.py` — no choice params
- [x] 4.3 `cross_entropy_loss.py` — no choice params
- [x] 4.4 `mse_loss.py` — no choice params
- [x] 4.5 `step_lr.py` — no choice params
- [x] 4.6 `cosine_lr.py` — no choice params
- [x] 4.7 `reduce_lr_on_plateau.py` — `mode: Literal["min", "max"]`
- [x] 4.8 `early_stopping.py` — no choice params
- [x] 4.9 `model_checkpoint.py` — no choice params
- [x] 4.10 `train_epoch.py` — `device: Literal["cpu", "cuda", "mps"]`
- [x] 4.11 `train_model.py` — `device: Literal["cpu", "cuda", "mps"]`

## 5. Data, Models, Transforms, Visualization

- [x] 5.1 `load_csv.py` — no choice params
- [x] 5.2 `train_test_split.py` — no choice params
- [x] 5.3 `linear_regression.py` — no choice params
- [x] 5.4 `logistic_regression.py` — no choice params
- [x] 5.5 `random_forest.py` — no choice params
- [x] 5.6 `decision_tree.py` — `task: Literal["classification", "regression"]`
- [x] 5.7 `knn.py` — `task: Literal["classification", "regression"]`
- [x] 5.8 `svm.py` — `task: Literal["classification", "regression"]`, `kernel: Literal["rbf", "linear", "poly", "sigmoid"]`
- [x] 5.9 `pca.py` — no choice params
- [x] 5.10 `standard_scaler.py` — no choice params
- [x] 5.11 `data_loader.py` — no choice params
- [x] 5.12 `random_split.py` — no choice params
- [x] 5.13 `tensor_dataset.py` — no choice params
- [x] 5.14 `normalize.py` — no choice params (mean/std are lists)
- [x] 5.15 `random_crop.py` — no choice params
- [x] 5.16 `random_flip.py` — no choice params
- [x] 5.17 `resize.py` — no choice params
- [x] 5.18 `to_tensor.py` — no choice params
- [x] 5.19 `plot_predictions.py` — no choice params

## 6. Testing

- [x] 6.1 Add test: `ParamInfo` with options serializes correctly in API response
- [x] 6.2 Add test: `_inspect_function` detects `Literal` and populates options
- [x] 6.3 Add test: non-Literal parameters have `options=null`
- [x] 6.4 Verify all 55 existing tests still pass (58 total, all pass)
