# Proposal: ui-param-polish

## Why

L'éditeur affiche les blocs sans leurs noms : les ports de sortie sont des points anonymes (tooltip seul), les hyperparamètres sont des champs nus sans label (`train_test_split` montre `[0.8] [☑] [ ]` sans « ratio », « shuffle », « seed »), l'autocomplétion se limite à 1-2 params, et les labels des blocs sont dérivés du nom anglais (`Load Csv`, `Train Test Split`). L'utilisateur règle à l'aveugle et ne reconnaît pas ses blocs.

## What Changes

- **Noms des sorties visibles** : `BlockNode` affiche une ligne par port de sortie (`out_1 · pd.DataFrame`) sous les params — le handle reste le point de connexion.
- **Noms des params visibles** : `BlockSegments` préfixe chaque champ de son nom (`ratio: [0.8]`, `shuffle: [☑]`) — linéaire + avancé.
- **Autocomplétion étendue** : nouvelle clé docstring `(suggestions: 16|32|64|128)` → datalist sur les champs (bascule `text` + datalist quand présentes, les datalist ne marchent pas sur `type=number`). Appliquée aux compteurs, probabilités et shapes.
- **Traduction FR** : labels des blocs depuis la 1re ligne de docstring FR (« Charger un CSV », « Séparer train/test ») avec fallback `name.title()` ; « Blocks » → « Blocs » ; « Rechercher un block » → « un bloc ».

## Capabilities

### New Capabilities
- `ui-param-polish`: labels de ports et de params visibles, suggestions docstring, labels FR.

### Modified Capabilities
<!-- Aucune spec existante — capability nouvelle. -->
