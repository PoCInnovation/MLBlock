## 1. Créer les dossiers de sous-catégories neural

- [x] 1.1 Créer `neural_conv_6366F1/` avec `__init__.py`
- [x] 1.2 Créer `neural_activation_EF4444/` avec `__init__.py`
- [x] 1.3 Créer `neural_norm_10B981/` avec `__init__.py`
- [x] 1.4 Créer `neural_pool_F59E0B/` avec `__init__.py`
- [x] 1.5 Créer `neural_rnn_8B5CF6/` avec `__init__.py`

## 2. Déplacer les blocks neural (git mv)

- [x] 2.1 Déplacer vers `neural_conv` : conv1d, conv2d, conv3d, conv_transpose2d, linear, flatten, embedding, dropout, upsample, input
- [x] 2.2 Déplacer vers `neural_activation` : relu, leaky_relu, prelu, gelu, selu, silu, sigmoid, tanh, elu, identity, softmax
- [x] 2.3 Déplacer vers `neural_norm` : batchnorm1d, batchnorm2d, instancenorm2d, layernorm
- [x] 2.4 Déplacer vers `neural_pool` : maxpool2d, avgpool2d, adaptive_avgpool2d, adaptive_maxpool2d
- [x] 2.5 Déplacer vers `neural_rnn` : rnn, gru, lstm, multihead_attention
- [x] 2.6 Supprimer le dossier `neural_6366F1` restant

## 3. Fusionner evaluation → training

- [x] 3.1 Déplacer `evaluate.py` de `evaluation_EF4444` vers `training_DE497D` (git mv)
- [x] 3.2 Supprimer le dossier `evaluation_EF4444`

## 4. Vérification

- [x] 4.1 Générer le catalogue et vérifier les 11 catégories + répartition des blocks
- [x] 4.2 Vérifier qu'aucun block n'a perdu son type/params
- [x] 4.3 Lancer les tests backend (test_block.py mis à jour pour `neural_conv`)
