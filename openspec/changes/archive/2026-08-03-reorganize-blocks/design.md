## Context

`neural_6366F1` a 33 blocks, `evaluation_EF4444` en a 1. Le registre dérive le nom de catégorie via `rsplit("_", 1)[0]` et la couleur via `^.*_([0-9A-Fa-f]{6})$` — les deux supportent des noms `neural_*_HEX` sans modification.

## Goals / Non-Goals

**Goals:**
- 11 catégories claires (au lieu de 9)
- `neural` découpé en 5 sous-catégories `neural_*`
- `evaluate` fusionné dans `training`
- Aucun changement registry/frontend

**Non-Goals:**
- Pas de changement de noms de blocks (les fichiers gardent leurs noms)
- Pas de changement de logique des blocks
- Pas de nouvelle couleur de thème

## Decisions

1. **Nouveaux dossiers et couleurs** (arbitraires, hex distincts) :
   | Dossier | Couleur |
   |---|---|
   | `neural_conv_6366F1` | `#6366F1` (garde le bleu neural) |
   | `neural_activation_EF4444` | `#EF4444` (rouge, reprend celle d'evaluation) |
   | `neural_norm_10B981` | `#10B981` (vert émeraude) |
   | `neural_pool_F59E0B` | `#F59E0B` (ambre, reprend celle de models) |
   | `neural_rnn_8B5CF6` | `#8B5CF6` (violet) |
   | `neural_vision_EC4899` | `#EC4899` (rose, reprend celle de visualization) |

   (note : la proposition initiale avait `neural_vision` pour upsample + pools ; la décision finale met les pools dans `neural_pool` et upsample dans `neural_conv`)

2. **Répartition des 33 blocks de `neural_6366F1`** :
   - `neural_conv_6366F1` : conv1d, conv2d, conv3d, conv_transpose2d, linear, flatten, embedding, dropout, upsample, input (10)
   - `neural_activation_EF4444` : relu, leaky_relu, prelu, gelu, selu, silu, sigmoid, tanh, elu, identity, softmax (11)
   - `neural_norm_10B981` : batchnorm1d, batchnorm2d, instancenorm2d, layernorm (4)
   - `neural_pool_F59E0B` : maxpool2d, avgpool2d, adaptive_avgpool2d, adaptive_maxpool2d (4)
   - `neural_rnn_8B5CF6` : rnn, gru, lstm, multihead_attention (4)

3. **Fusion `evaluation_EF4444` → `training_DE497D`** : déplacer `evaluate.py` dans `training_DE497D`, supprimer le dossier `evaluation_EF4444`.

4. **Mécanique** : `git mv` pour préserver l'historique, chaque `neural_*` garde son `__init__.py`.

## Risks / Trade-offs

- **[Configs existantes]** Les configs JSON référencent les blocks par type (`conv2d`, `relu`, ...), pas par chemin de module → aucune config ne casse
- **[Références de module]** Rien n'importe `mlblock.blocks.neural_6366F1.X` directement (le registry importe par dossier découvert) → déplacement sûr
- **[Couleurs]** Les couleurs réutilisées (`EF4444`, `F59E0B`, `EC4899`) peuvent se confondre entre catégories → acceptable, les chips/couleurs restent distinctives par groupe
