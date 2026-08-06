# Proposal: block-param-intelligence

## Why

Les 107 params numériques, 17 strings et 3 listes de la bibliothèque sont saisis en texte libre sans aucune aide : les probabilités (`dropout.p` ∈ [0,1]) acceptent n'importe quelle valeur jusqu'au crash au run, les listes (`input.shape` → `"[1, 3, 32, 32]"`) exigent une syntaxe JSON exacte sans indication de format, et `evaluate.method` est un string libre alors que seules 2 valeurs sont valides. Les descriptions existent déjà dans les docstrings et le catalogue (`paramSchema.description`) mais le frontend les jette. L'utilisateur découvre ses erreurs au run, jamais à la saisie.

## What Changes

- **Métadonnées de param** : convention docstring française avec suffixe structuré — `(entre: 0-1)`, `(impair)`, `(choix: mse|accuracy)`, `(format: [C,H,W])`, `(longueur: 3)` — parsée par le registry dans `ParamInfo` (nouveaux champs `min`, `max`, `step`, `odd`, `choices`, `format`, `len`), exposée dans le catalogue.
- **UI des segments** : placeholder discret (fourchette/format), validation live à l'édition (feu tricolore vert/rouge cohérent avec le type-checking), input `number` avec min/max/step, datalist pour les `choices` implicites, vérification JSON + longueur pour les listes.
- **Autocomplétion dataflow-aware** : `target_column` propose les colonnes du DataFrame source — nouvel endpoint backend `GET /files/{path}/columns` (en-tête du CSV stocké), remontée des edges dans le graphe pour trouver le `load_csv` amont, saisie libre en fallback.

## Capabilities

### New Capabilities
- `block-param-metadata`: parsing des métadonnées docstring (entre/impair/choix/format/longueur) → `ParamInfo`, exposées dans le catalogue.
- `param-input-assist`: UI des segments enrichie — placeholder discret, validation live, input number, datalist, vérification JSON/longueur.
- `column-autocomplete`: autocomplétion dataflow-aware de `target_column` via endpoint colonnes + remontée de graphe.

### Modified Capabilities
<!-- Aucune spec existante — capabilities nouvelles. -->
