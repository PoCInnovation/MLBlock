# Taxonomie des blocks — option D (design)

Décisions prises en session le 2026-10-18. Remplace les 4 axes concurrents (catégorie, `Stage`, `MacroStage`, overrides) par **une seule hiérarchie portée par les dossiers**.

## Décisions

1. **Hiérarchie** : `macro → catégorie → block`. Le dossier décide de tout.
   ```
   backend/mlblock/blocks/
     1-donnees/    donnees/ chargement/ pretraitement/ texte/ environnement/
     2-modele/     couches/ activation/ normalisation/ regroupement/ modeles/ entrainement/ agents/
     3-resultats/  evaluation/ visualisation/
     conversions/  (blocks plats, pas de sous-dossier)
   ```
   Le préfixe numérique donne l'id de la macro (1, 2, 3). `conversions/` = `MacroStage.TRANSITION` (99).
2. **`Stage` (S0–SX) est supprimé** partout (backend, API, frontend, tests).
3. **Couleurs** : la macro porte la teinte (`MACRO_STAGE_METADATA`, seule source) ; chaque catégorie reçoit une nuance calculée de cette teinte. Plus de HEX dans les noms de dossiers.
4. **Conversions** : un block est converteur ⇔ il vit dans `conversions/` ⇔ `is_transition=True`. Le graphe de conversion (backend + frontend) se construit depuis `is_transition`, plus depuis le nom `transformations`. `env_to_tensor` et `module_to_policy` y entrent (bug corrigé).
5. **Validation** conservée, réécrite :
   - ordre : rang macro cible < rang macro source → erreur, sauf Modèle→Données (ex-boucle TRAIN→PREPARE) ; les conversions sont exemptées.
   - isolation RL : arête entre un block d'engine `gym` et un block d'un autre engine → erreur, sauf si l'un des deux est une conversion.
6. **Engine** = badge, visible uniquement sur les superblocks. Plus de couleur d'engine sur les cartes ; les dégradés de liens des conversions restent.
7. **Superblocks** : `SUPERBLOCK_DEFS` reste centralisé ; on retire `stage`/`stage_name`, on garde `macro_stage`. Leur couleur = teinte de leur macro.
8. **Alias legacy** supprimés (fait, non commité au moment du design).
9. **Blocks à poids éphémères** (couche recréée à chaque appel) : règle « paramétrique ⇒ `nn.Module` composable ».
   - supprimés : `embedding`, `rnn`, `lstm` (doublons de `embedding_layer`, `rnn_layer`, `lstm_layer`) ; `modeles/tsne.py` (masqué par `visualisation/tsne.py`, même clé).
   - `rnn_layer` reprend les paramètres de `rnn` (`num_layers`, `nonlinearity`, `bias`, `dropout`, `bidirectional`).
   - convertis en Module sans changer de nom : `gru`, `multihead_attention`, `prelu`, `instancenorm2d` (avec poids) et `selu`, `silu`, `avgpool2d`, `adaptive_avgpool2d`, `adaptive_maxpool2d`, `upsample` (sans poids, restes de la migration incomplète du commit `0466e98`).
   - supprimé : `identity` (ne fait rien).
   - invariant : après migration, aucun block de `2-modele/couches|activation|normalisation|regroupement` n'a de port `torch.Tensor` ; entrée `in_1: torch.nn.Module` optionnelle, sortie `torch.nn.Module`. Raison : `classify` rend `Tensor ↔ Module` incompatible, ces blocks ne pouvaient pas entrer dans une chaîne de modèle ; dans un conteneur, `CodeGenerator` bascule alors en appels enchaînés et émettrait `avgpool2d(in_1=<Module>)` (plantage à l'exécution, bloqué aujourd'hui seulement par `validate_container_children`).
   - `input_layer` garde son nom : c'est le point d'entrée Tensor → Module de la chaîne de modèle (exception à l'invariant ci-dessus, comme le block virtuel `input`).
   - `sequences/` disparaît (les récurrents vont dans `couches/`).
10. Les pipelines existants ne sont pas à préserver.

## Hors périmètre

- Déclaration de l'engine dans le block lui-même (les overrides d'engine restent dans `stages.py`).
- `CodeGenerator` : aucun changement (branche `nn.Sequential` si tous les enfants sortent `torch.nn.Module`, sinon chaînage — toujours nécessaire pour les superblocks de données).
