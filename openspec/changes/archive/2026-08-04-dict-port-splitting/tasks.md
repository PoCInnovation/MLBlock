## 1. Backend

- [x] 1.1 `_parse_return_annotation` : branche `dict[...]` (split top-level + `name: type` par entrée, dédup)
- [x] 1.2 Annoter `pca` (`dict[model: Model, transformed: numpy.ndarray]`)
- [x] 1.3 Annoter `standard_scaler` (`dict[scaler: object, scaled: numpy.ndarray]`)
- [x] 1.4 Annoter `train_model` (`dict[model: torch.nn.Module, history: list]`)
- [x] 1.5 Test : parsing dict structuré, backward compat `dict` nu, résolution par port (Pipeline.run)

## 2. Vérification

- [x] 2.1 pytest backend
- [x] 2.2 Smoke API : `/api/catalog` expose les 3 blocs avec 2 outputs nommés/typés
- [x] 2.3 Smoke core : `pca.transformed` → `to_tensor` résolu par port (Pipeline.run)
