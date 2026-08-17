# Single-Port Connections

## Purpose

Simplifie la connexion entre blocs : un point d'entrée et un point de sortie par bloc quand la résolution des ports est déterministe, avec coloration verte des ports effectivement fournis.

## ADDED Requirements

### Requirement: Point unique pour blocs non-ambigus
Every block whose inputs have pairwise distinct dtypes and whose outputs have pairwise distinct dtypes MUST render a single target handle (left) and a single source handle (right), regardless of how many ports it declares. Blocks with two or more ports sharing the same dtype on either side MUST keep one visible handle per port.

#### Scenario: Bloc mono-entrée mono-sortie
- **WHEN** `elu` (un seul input `in_1`, un seul output `out_1`) est affiché
- **THEN** un seul point d'entrée est rendu à gauche et un seul point de sortie à droite

#### Scenario: Bloc multi-entrées de types distincts
- **WHEN** `evaluate` (inputs `Model` et `pd.DataFrame`, dtypes distincts) est affiché
- **THEN** un seul point d'entrée est rendu, pas un handle par port

#### Scenario: Bloc ambigu
- **WHEN** `tensor_dataset` (inputs `torch.Tensor` et `torch.Tensor`) est affiché
- **THEN** deux handles d'entrée distincts sont rendus (un par port), l'ambiguïté reste visible

### Requirement: Résolution automatique des ports
When the user connects block A's source point to block B's target point, the system MUST resolve the most compatible pair (output port of A, input port of B) using the existing compatibility classifier: exact dtype match first, then same type family, then convertible, otherwise reject the connection with the existing error feedback. The created edge MUST reference the resolved real port names.

#### Scenario: Résolution par dtype exact
- **WHEN** un bloc produisant `pd.DataFrame` est connecté à `evaluate` (inputs `Model`, `pd.DataFrame`)
- **THEN** l'edge est créée vers le port d'entrée `pd.DataFrame` de `evaluate`

#### Scenario: Résolution par famille
- **WHEN** un bloc produisant `torch.Tensor` est connecté à un bloc dont l'input est `torch.Tensor` d'une variante différente
- **THEN** l'edge est créée vers ce port (même famille de type)

#### Scenario: Aucun port compatible
- **WHEN** un bloc produisant `torch.Tensor` est connecté à un bloc dont tous les inputs sont `pd.DataFrame` sans chemin de conversion
- **THEN** la connexion est rejetée avec le message d'erreur existant et aucune edge n'est créée

#### Scenario: Conversion requise
- **WHEN** le seul couple compatible nécessite un convertisseur
- **THEN** la connexion est classée convertible et le flux existant de proposition de conversion est déclenché

### Requirement: Coloration des ports fournis
An input port MUST be rendered green when at least one edge targets that block and port; an output port MUST be rendered green when at least one edge originates from that block and port. The green state MUST be derived from the current edges, never stored.

#### Scenario: Input fourni
- **WHEN** une edge cible le port `in_1` du bloc B
- **THEN** le port `in_1` de B est affiché en vert

#### Scenario: Output non fourni
- **WHEN** aucune edge ne part du port `out_1` du bloc A
- **THEN** le port `out_1` de A conserve sa couleur normale

#### Scenario: Vert recalculé après suppression
- **WHEN** l'unique edge ciblant le port `in_1` de B est supprimée
- **THEN** le port `in_1` de B redevient de couleur normale

### Requirement: Remplacement sur input déjà fourni
Connecting a source to a target block whose target port is already fed MUST remove the existing edge on that target port before creating the new one. A target port MUST never receive more than one edge.

#### Scenario: Reconnecter un input
- **WHEN** l'utilisateur connecte un nouveau bloc source vers un input déjà connecté
- **THEN** l'ancienne edge sur cet input est supprimée et la nouvelle est créée

#### Scenario: Input alimenté par une seule source
- **WHEN** deux connexions distinctes ciblent le même port d'entrée
- **THEN** une seule subsiste après la dernière connexion, jamais deux simultanément
