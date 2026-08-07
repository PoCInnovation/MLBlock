## Purpose

Les sorties dict structurées des blocs (`dict[model: Model, transformed: numpy.ndarray]`) sont exposées comme ports nommés et typés, résolubles par le pipeline.

## Requirements

### Requirement: Parser dict structuré
The registry MUST parse `-> "dict[name: type, name: type]"` return annotations into named, typed output ports (`out_1` → first key, etc.), using the same mechanism as `tuple[A, B]`. A bare `-> "dict"` MUST stay a single `dict` output.

#### Scenario: Ports nommés
- **WHEN** un bloc déclare `-> "dict[model: Model, transformed: numpy.ndarray]"`
- **THEN** ses outputs sont `model: Model` et `transformed: numpy.ndarray`

#### Scenario: Backward compat
- **WHEN** un bloc déclare `-> "dict"` sans structure
- **THEN** il garde un seul `out_1: dict`

### Requirement: Blocs dict éclatés
`pca`, `standard_scaler` et `train_model` MUST expose their dict keys as typed ports, resolvable by `Pipeline.run` (the block returns the dict; each port resolves to its key).

#### Scenario: pca → to_tensor
- **WHEN** `pca.transformed` est connecté à `to_tensor.in_1` (numpy.ndarray)
- **THEN** la connexion est compatible (vert) et le pipeline résout la valeur `transformed`

#### Scenario: train_model → sgd
- **WHEN** `train_model.model` est connecté à `sgd.in_1` (torch.nn.Module)
- **THEN** la connexion est compatible
