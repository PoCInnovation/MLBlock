## Why

L'éditeur a deux modes (linéaire + avancé React Flow) maintenus en parallèle : double état dans le store (`script` ET `flowNodes`/`flowEdges`), double palette (`BlockPalette` + `FlowPalette`), conversions bidirectionnelles (`linearToFlow`/`flowToLinear`), et un rendu conditionnel. Le mode linéaire est un sous-ensemble limité (pas de connexions réelles — `edges: []` au run) qui double la surface de maintenance et les risques de régression. L'utilisateur veut **mode avancé uniquement**.

## What Changes

- **Suppression du mode linéaire** : le canvas React Flow devient l'unique représentation. `editorMode`, le toggle Avancé/Linéaire, `script`, les actions linéaires (`addBlock`, `deleteBlock`, `moveBlock`, `updateField`), la persistance `mlblock-editor-mode` et les conversions `flowToLinear` sont supprimés.
- **Store simplifié** : `flowNodes`/`flowEdges` = seule source de vérité du canvas. `loadPipeline` construit les nodes directement depuis le JSON serveur (avec positions), sans passer par `script`.
- **Composants linéaires supprimés** : `EditorLayout`, `Canvas`, `HatBlock`, `ScriptBlock`, `ChainConnector`, `BlockPalette`, `CategoryBar`, `CategoryIcon`, `PaletteBlock`, et la partie script de `useDragDrop`/`snapLogic`. La palette avancée (`FlowPalette` avec recherche + chips) devient la palette unique.
- **Run/save simplifiés** : `toServerPayload` ne garde que la branche flow ; la garde « aucun bloc » se base sur `flowNodes`.
- **Fingerprint du garde non-sauvegardé** : `{flowNodes, flowEdges, projectName}` (sans `script`).

## Capabilities

### New Capabilities
<!-- Aucune — suppression de fonctionnalité. -->

### Modified Capabilities
<!-- Aucune spec existante modifiée : le mode avancé était déjà la cible des
     specs (canvas, conversions) ; la suppression du linéaire n'enlève aucun
     requirement existant. -->

## User Impact

- L'éditeur s'ouvre directement en mode avancé (canvas React Flow).
- Les pipelines existants s'ouvrent à l'identique (positions conservées).
- Surface de code réduite (~8 fichiers supprimés) et moins de chemins de régression.
