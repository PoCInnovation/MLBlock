# Tasks: Fix Backend Runtime & Codegen Syntax Errors

## 1. Codegen Syntax Fixes

- [x] 1.1 Mettre `from __future__ import annotations` en toute première ligne de code généré dans `backend/mlblock/core/generator.py`
- [x] 1.2 Nettoyer/filtrer les lignes `from __future__ import annotations` dans les extraits de code injectés depuis chaque bloc
- [x] 1.3 Valider la compilation Python (`compile(..., "exec")`) des 12 exercices canoniques

## 2. Correctifs Symboles PyTorch

- [x] 2.1 Corriger `nn.Avgpool2D` en `nn.AvgPool2d` dans `backend/mlblock/blocks/regroupement-F59E0B/avgpool2d.py`
- [x] 2.2 Corriger `nn.AdaptiveAvgpool2D` en `nn.AdaptiveAvgPool2d` dans `backend/mlblock/blocks/regroupement-F59E0B/adaptive_avgpool2d.py`
- [x] 2.3 Corriger `nn.AdaptiveMaxpool2D` en `nn.AdaptiveMaxPool2d` dans `backend/mlblock/blocks/regroupement-F59E0B/adaptive_maxpool2d.py`
- [x] 2.4 Corriger `nn.Lstm` en `nn.LSTM` dans `backend/mlblock/blocks/sequences-8B5CF6/lstm.py`
- [x] 2.5 Corriger `nn.Gru` en `nn.GRU` dans `backend/mlblock/blocks/sequences-8B5CF6/gru.py`
- [x] 2.6 Corriger `nn.Rnn` en `nn.RNN` dans `backend/mlblock/blocks/sequences-8B5CF6/rnn.py`
- [x] 2.7 Adapter `multihead_attention.py` pour transmettre un appel multi-têtes cohérent `(in_1, in_1, in_1)`

## 3. Configuration d'Exécution & Nettoyage

- [x] 3.1 Respecter `os.environ.get("BACKEND_URL", "http://localhost:8000")` dans `LocalBackend.launch` (`backend/mlblock/execution.py`)
- [x] 3.2 Supprimer le dossier orphelin vide `backend/mlblock/blocks/convolution-6366F1`
- [x] 3.3 Exécuter `uv run pytest mlblock/tests -q` et `uv run ruff check .`
