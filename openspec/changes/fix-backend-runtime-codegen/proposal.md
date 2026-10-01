# Proposal: Fix Backend Runtime & Codegen Syntax Errors

## Why

Lors de la génération autonome de code Python (`generate_code`) et de l'exécution locale ou sur GPU, plusieurs pipelines échouent immédiatement avec des erreurs de syntaxe Python ou des exceptions d'attributs inexistants. Corriger ces erreurs garantit que l'intégralité des 12 exercices de référence compile et s'exécute de bout en bout sans crash système.

## What Changes

- **Codegen (`generator.py`)** : Placer l'instruction obligatoire `from __future__ import annotations` tout en haut du script généré (ligne 1) et filtrer/supprimer cette ligne lors de la concaténation du code source de chaque bloc individuel pour éviter la `SyntaxError: from __future__ imports must occur at the beginning of the file`.
- **Symboles PyTorch invalides dans les blocs** : Remplacer les noms de classes erronés par les symboles officiels `torch.nn` :
  - `nn.Avgpool2D` -> `nn.AvgPool2d` (`avgpool2d.py`)
  - `nn.AdaptiveAvgpool2D` -> `nn.AdaptiveAvgPool2d` (`adaptive_avgpool2d.py`)
  - `nn.AdaptiveMaxpool2D` -> `nn.AdaptiveMaxPool2d` (`adaptive_maxpool2d.py`)
  - `nn.Lstm` -> `nn.LSTM` (`lstm.py`)
  - `nn.Gru` -> `nn.GRU` (`gru.py`)
  - `nn.Rnn` -> `nn.RNN` (`rnn.py`)
- **Appel MultiheadAttention** : Adapter l'appel de `nn.MultiheadAttention` pour lui fournir un tuple cohérent `(in_1, in_1, in_1)` (query, key, value en mode self-attention) au lieu d'un seul argument positionnel.
- **Environnement d'exécution (`execution.py`)** : Dans `LocalBackend.launch`, respecter `os.environ.get("BACKEND_URL", "http://localhost:8000")` au lieu d'écraser inconditionnellement la variable par un littéral figé.
- **Nettoyage de répertoire orphelin** : Supprimer le dossier orphelin vide `backend/mlblock/blocks/convolution-6366F1` rendu obsolète par `layers-6366F1`.

## Capabilities

### New Capabilities
- `runtime-codegen`: Génération de scripts Python autonomes syntaxiquement valides et exécution sans crash de tous les blocs canoniques.

### Modified Capabilities
- Aucune capacité de spec existante modifiée (stabilisation de l'existant).

## Impact

- **Exécution** : 100% des scripts générés compilent en bytecode Python valide.
- **Fiabilité** : Les blocs de pooling et de séquences récurrentes n'émettent plus d'`AttributeError` à l'exécution.
- **Rétrocompatibilité** : Aucun impact négatif sur les pipelines existants.
