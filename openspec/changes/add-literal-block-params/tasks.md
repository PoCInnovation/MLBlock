## 1. Schema & Discovery

- [ ] 1.1 Add `options: list[str] | None = None` to `ParamInfo` in `backend/mlblock/server/schemas.py`
- [ ] 1.2 Update `_inspect_function` in `backend/mlblock/blocks/registry.py` to detect `typing.Literal` and populate `options`

## 2. Neural Blocks — Activation & Pooling

- [ ] 2.1 `relu.py` — no changes needed (no choice params)
- [ ] 2.2 `leaky_relu.py` — no changes needed
- [ ] 2.3 `prelu.py` — no changes needed
- [ ] 2.4 `elu.py` — no changes needed
- [ ] 2.5 `selu.py` — no changes needed
- [ ] 2.6 `gelu.py` — no changes needed
- [ ] 2.7 `silu.py` — no changes needed
- [ ] 2.8 `sigmoid.py` — no changes needed
- [ ] 2.9 `tanh.py` — no changes needed
- [ ] 2.10 `softmax.py` — add `dim: Literal["batch", "feature", "none"] = "batch"` or similar if applicable
- [ ] 2.11 `dropout.py` — `p` is float, no Literal needed
- [ ] 2.12 `maxpool2d.py` — `padding: Literal["valid", "same"]` if applicable
- [ ] 2.13 `avgpool2d.py` — same as maxpool
- [ ] 2.14 `adaptive_avgpool2d.py` — no choice params
- [ ] 2.15 `adaptive_maxpool2d.py` — no choice params
- [ ] 2.16 `batchnorm1d.py` — no choice params
- [ ] 2.17 `batchnorm2d.py` — no choice params
- [ ] 2.18 `instancenorm2d.py` — no choice params
- [ ] 2.19 `layernorm.py` — no choice params
- [ ] 2.20 `upsample.py` — `mode: Literal["nearest", "bilinear", "bicubic"]` if applicable

## 3. Neural Blocks — Linear, Conv, RNN

- [ ] 3.1 `linear.py` — no choice params (activation applied separately)
- [ ] 3.2 `conv1d.py` — `padding: Literal["valid", "same"]` if applicable
- [ ] 3.3 `conv2d.py` — `padding: Literal["valid", "same"]` if applicable
- [ ] 3.4 `conv3d.py` — `padding: Literal["valid", "same"]` if applicable
- [ ] 3.5 `conv_transpose2d.py` — `padding: Literal["valid", "same"]` if applicable
- [ ] 3.6 `embedding.py` — no choice params
- [ ] 3.7 `flatten.py` — no choice params
- [ ] 3.8 `identity.py` — no choice params
- [ ] 3.9 `rnn.py` — `nonlinearity: Literal["tanh", "relu"]`
- [ ] 3.10 `lstm.py` — no choice params
- [ ] 3.11 `gru.py` — no choice params
- [ ] 3.12 `multihead_attention.py` — no choice params

## 4. Training Blocks

- [ ] 4.1 `adam.py` — no choice params
- [ ] 4.2 `sgd.py` — no choice params
- [ ] 4.3 `cross_entropy_loss.py` — no choice params
- [ ] 4.4 `mse_loss.py` — no choice params
- [ ] 4.5 `step_lr.py` — no choice params
- [ ] 4.6 `cosine_lr.py` — no choice params
- [ ] 4.7 `reduce_lr_on_plateau.py` — `mode: Literal["min", "max"]`
- [ ] 4.8 `early_stopping.py` — no choice params
- [ ] 4.9 `model_checkpoint.py` — no choice params
- [ ] 4.10 `train_epoch.py` — `device: Literal["cpu", "cuda", "mps"]`
- [ ] 4.11 `train_model.py` — `device: Literal["cpu", "cuda", "mps"]`

## 5. Data, Models, Transforms, Visualization

- [ ] 5.1 `load_csv.py` — no choice params
- [ ] 5.2 `train_test_split.py` — no choice params
- [ ] 5.3 `linear_regression.py` — no choice params
- [ ] 5.4 `logistic_regression.py` — no choice params
- [ ] 5.5 `random_forest.py` — no choice params
- [ ] 5.6 `decision_tree.py` — `task: Literal["classification", "regression"]`
- [ ] 5.7 `knn.py` — `task: Literal["classification", "regression"]`
- [ ] 5.8 `svm.py` — `task: Literal["classification", "regression"]`, `kernel: Literal["rbf", "linear", "poly", "sigmoid"]`
- [ ] 5.9 `pca.py` — no choice params
- [ ] 5.10 `standard_scaler.py` — no choice params
- [ ] 5.11 `data_loader.py` — no choice params
- [ ] 5.12 `random_split.py` — no choice params
- [ ] 5.13 `tensor_dataset.py` — no choice params
- [ ] 5.14 `normalize.py` — no choice params (mean/std are lists)
- [ ] 5.15 `random_crop.py` — no choice params
- [ ] 5.16 `random_flip.py` — no choice params
- [ ] 5.17 `resize.py` — no choice params
- [ ] 5.18 `to_tensor.py` — no choice params
- [ ] 5.19 `plot_predictions.py` — no choice params

## 6. Testing

- [ ] 6.1 Add test: `ParamInfo` with options serializes correctly in API response
- [ ] 6.2 Add test: `_inspect_function` detects `Literal` and populates options
- [ ] 6.3 Add test: non-Literal parameters have `options=null`
- [ ] 6.4 Verify all 55 existing tests still pass
