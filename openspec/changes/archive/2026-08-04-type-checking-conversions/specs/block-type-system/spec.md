## ADDED Requirements

### Requirement: Dérivation des ports d'entrée
Chaque bloc expose ses ports d'entrée (`name`, `dtype`) dérivés de sa signature : paramètres préfixés `in_`, premier paramètre non-`file`, et paramètres typés data (`pd.DataFrame`, `torch.*`, `Model`, `object`, `tuple[...]`). Les hyperparamètres (int/float/bool/str/list/Literal/file) ne sont jamais des ports.

#### Scenario: Bloc linéaire
- **WHEN** le bloc `linear(in_1: "torch.Tensor", in_features: "int", ...)` est découvert
- **THEN** ses inputs sont `[{name: "in_1", dtype: "torch.Tensor"}]` et `in_features` reste un paramètre

#### Scenario: Bloc multi-entrées
- **WHEN** le bloc `train_epoch(in_1, in_2, in_3, in_4, ...)` est découvert
- **THEN** ses inputs contiennent `in_1` à `in_4` avec leurs dtypes respectifs

#### Scenario: Bloc sans entrée de données
- **WHEN** `load_csv(path: "file")` est découvert
- **THEN** ses inputs sont vides (aucun port), `path` reste un paramètre fichier

### Requirement: Multi-sorties par annotation tuple
Une annotation de retour `tuple[A, B]` déclare les sorties `out_1: A` et `out_2: B`. L'exécution normalise un résultat tuple en sorties nommées ; la résolution des arêtes se fait par port (`source_port` réel).

#### Scenario: Éclatement train/test
- **WHEN** `train_test_split` retourne `(train, test)` avec l'annotation `tuple[pd.DataFrame, pd.DataFrame]`
- **THEN** ses outputs sont `out_1: pd.DataFrame` (train) et `out_2: pd.DataFrame` (test)

#### Scenario: Résolution par port
- **WHEN** un edge relie `train_test_split.out_2` vers le `in_1` d'un bloc consommateur
- **THEN** le consommateur reçoit la valeur `test`, pas le tuple ni `train`

#### Scenario: Dict mono-sortie préservé
- **WHEN** `pca` retourne un dict `{model, transformed}` avec une sortie déclarée `dict`
- **THEN** la sortie reste la valeur dict entière, inchangée

### Requirement: Classifieur de compatibilité
Toute connexion `A.out → B.in` est classée : identité ou sous-type → compatible ; chemin de conversion dans le graphe dérivé du catalogue → convertible ; sinon → incompatible. Le graphe de conversion est construit depuis le catalogue (un bloc dont la famille d'entrée diffère de la famille de sortie est un convertisseur), sans table codée en dur.

#### Scenario: Même famille
- **WHEN** `relu.out_1 (torch.Tensor)` est connecté à `conv2d.in_1 (torch.Tensor)`
- **THEN** la connexion est compatible

#### Scenario: Sous-type
- **WHEN** une sortie quelconque est connectée à une entrée typée `object` ou `Any`
- **THEN** la connexion est compatible

#### Scenario: Chemin de conversion
- **WHEN** `load_csv.out_1 (pd.DataFrame)` est connecté à `conv2d.in_1 (torch.Tensor)` et `df_to_tensor` existe dans le catalogue
- **THEN** la connexion est classée convertible

#### Scenario: Aucun chemin
- **WHEN** `input.out_1 (torch.Tensor)` est connecté à `knn.in_1 (pd.DataFrame)` sans convertisseur tensor→df
- **THEN** la connexion est classée incompatible

### Requirement: Validation serveur
`/api/validate` et le build rejettent les connexions incompatibles avec un message listant les ports et dtypes en conflit. Les connexions convertibles sans convertisseur matérialisé échouent au build.

#### Scenario: Graphe invalide
- **WHEN** un pipeline contient une arête incompatible (rouge) et est validé
- **THEN** la réponse de validation contient une erreur `Type mismatch: <source>.<port> (<dtype>) -> <target>.<port> (<dtype>)`

#### Scenario: Graphe valide
- **WHEN** un pipeline ne contient que des arêtes compatibles ou convertibles avec convertisseurs matérialisés
- **THEN** la validation passe et le build s'exécute
