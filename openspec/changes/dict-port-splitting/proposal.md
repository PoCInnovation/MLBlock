# Proposal: dict-port-splitting

## Why

Trois blocs retournent des dicts (`pca` → `{model, transformed}`, `standard_scaler` → `{scaler, scaled}`, `train_model` → `{model, history}`) exposés comme une seule sortie `dict` — inutilisable en aval (rouge partout). Or les valeurs sont exploitables : `transformed`/`scaled` sont des `numpy.ndarray` qui alimentent `to_tensor` (préprocessing sklearn → réseau de neurones), et `train_model.model` est un `torch.nn.Module` qui alimente `sgd`. La mécanique des multi-sorties (tuples) existe déjà — il manque la grammaire d'annotation pour les dicts.

## What Changes

- **Grammaire d'annotation** : `-> "dict[name: type, name: type]"` parsée par le registry → ports nommés et typés (`out_1`→`model`, `out_2`→`transformed`), même mécanisme que `tuple[A, B]`.
- **3 blocs annotés** : `pca` (`dict[model: Model, transformed: numpy.ndarray]`), `standard_scaler` (`dict[scaler: object, scaled: numpy.ndarray]`), `train_model` (`dict[model: torch.nn.Module, history: list]`).
- **Backward compat** : `-> "dict"` sans structure reste mono-sortie `dict`.

## Capabilities

### New Capabilities
- `dict-port-splitting`: éclatement des sorties dict structurées en ports nommés/typés, ouvrant les pipelines sklearn→torch.

### Modified Capabilities
<!-- Aucune spec existante — capability nouvelle. -->
