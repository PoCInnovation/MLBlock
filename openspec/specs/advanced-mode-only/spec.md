# Advanced Mode Only

## Purpose

L'éditeur fonctionne exclusivement en mode avancé (canvas React Flow). Le mode linéaire, son état, ses actions et ses composants sont supprimés ; le canvas flow devient l'unique représentation du pipeline.

## Requirements

### Requirement: Éditeur en mode avancé uniquement
The editor MUST render the React Flow canvas unconditionally. The linear/advanced mode toggle MUST NOT exist.

#### Scenario: Ouverture de l'éditeur
- **WHEN** l'utilisateur ouvre l'éditeur
- **THEN** le canvas React Flow s'affiche directement, sans bascule de mode

#### Scenario: Projet existant
- **WHEN** l'utilisateur ouvre un projet sauvegardé
- **THEN** les blocs et leurs positions sont restaurés à l'identique

### Requirement: Source de vérité unique
The canvas state MUST be held solely in `flowNodes`/`flowEdges`. No parallel linear representation (`script`) MUST exist, and no mode persistence (`mlblock-editor-mode`) MUST be read or written.

#### Scenario: Ajout d'un bloc
- **WHEN** l'utilisateur glisse un bloc depuis la palette
- **THEN** le bloc est ajouté aux `flowNodes` (seule représentation du canvas)

#### Scenario: Run et sauvegarde
- **WHEN** l'utilisateur lance ou sauvegarde le pipeline
- **THEN** le payload envoyé provient exclusivement de `flowNodes`/`flowEdges`

### Requirement: Détection des modifications non sauvegardées
The unsaved-changes fingerprint MUST compare `flowNodes`, `flowEdges` and `projectName` (no `script`).

#### Scenario: Modification du canvas
- **WHEN** l'utilisateur ajoute, déplace, connecte ou paramètre un bloc
- **THEN** le projet est considéré comme modifié (garde à la sortie inchangée)
