# Pipeline Import / Export

## Purpose

Les pipelines peuvent être exportés au format JSON MLBlock ou en code généré (main.py), et importés depuis un fichier JSON MLBlock, avec symétrie entre les deux formats.

## ADDED Requirements

### Requirement: Export JSON de la pipeline
The system MUST export a saved pipeline as a JSON file in the MLBlock format (`nodes` with `id`, `type`, `params`, optional `position`, and `edges` with `source`, `source_port`, `target`, `target_port`), downloadable by the user. The exported JSON MUST be importable as-is.

#### Scenario: Exporter en JSON
- **WHEN** l'utilisateur choisit « Export JSON » (depuis un projet ou depuis l'éditeur)
- **THEN** un fichier JSON au format MLBlock est téléchargé, contenant le pipeline tel que stocké

### Requirement: Export du code généré
The system MUST generate the standalone Python script (main.py) on demand and offer it for download when the user chooses the code export option.

#### Scenario: Exporter en code
- **WHEN** l'utilisateur choisit « Export Code » dans le modal d'export
- **THEN** le main.py est généré depuis le pipeline courant et téléchargé

### Requirement: Modal de choix d'export
Exporting MUST present a modal letting the user choose between JSON and code before downloading.

#### Scenario: Choix du format
- **WHEN** l'utilisateur clique « Exporter »
- **THEN** un modal propose [JSON | Code] et le téléchargement démarre après le choix

### Requirement: Import JSON au format MLBlock
The system MUST import a project from a JSON file respecting the MLBlock format. Invalid files (malformed JSON, unknown block types, or missing required fields) MUST be rejected with a French error message. A successful import MUST create a saved project and open it in the editor.

#### Scenario: Import valide
- **WHEN** l'utilisateur importe un fichier JSON MLBlock valide
- **THEN** un projet est créé, apparaît dans « Mes projets » et s'ouvre dans l'éditeur

#### Scenario: Import invalide
- **WHEN** l'utilisateur importe un fichier JSON malformé ou avec des types de blocs inconnus
- **THEN** l'import est rejeté avec un message d'erreur en français et aucun projet n'est créé

### Requirement: Symétrie import/export
The format produced by export MUST be exactly the format accepted by import.

#### Scenario: Round-trip
- **WHEN** un utilisateur exporte un projet en JSON puis l'importe
- **THEN** le projet résultant contient les mêmes blocs, paramètres, connexions et positions de canvas
