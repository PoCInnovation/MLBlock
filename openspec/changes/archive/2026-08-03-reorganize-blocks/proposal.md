## Why

La catégorie `neural_6366F1` contient 33 blocks mélangés (conv, activations, normes, pools, RNN). Naviguer dedans est pénible. `evaluation` n'a qu'1 block. Réorganiser les catégories pour plus de clarté : découper `neural` en sous-catégories et fusionner les catégories quasi vides.

## What Changes

- Découper `neural_6366F1` (33 blocks) en 5 sous-catégories :
  - `neural_conv` (10) : conv1d/2d/3d, conv_transpose2d, linear, flatten, embedding, dropout, upsample, input
  - `neural_activation` (11) : relu, gelu, selu, silu, sigmoid, tanh, elu, leaky_relu, prelu, identity, softmax
  - `neural_norm` (4) : batchnorm1d/2d, instancenorm2d, layernorm
  - `neural_pool` (4) : maxpool2d, avgpool2d, adaptive_avgpool2d, adaptive_maxpool2d
  - `neural_rnn` (4) : rnn, gru, lstm, multihead_attention
- Fusionner `evaluation_EF4444` (1 block `evaluate`) dans `training_DE497D` → `training` (12)
- Chaque nouveau dossier reçoit une couleur hex

## Capabilities

### New Capabilities
- `block-reorganization`: 11 catégories claires (au lieu de 9), `neural` découpé en 5 sous-catégories

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Backend**: déplacement de fichiers `.py` entre dossiers, renommage des dossiers de catégories
- **Registry**: aucun changement (le parsing `_color_from_folder` + `rsplit("_",1)` gère déjà les noms `neural_*_HEX`)
- **Frontend**: aucun changement (catégories dynamiques depuis le catalogue)
- **Configs**: vérifier les configs existantes qui référencent des blocks par leur chemin de module
