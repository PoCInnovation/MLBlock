# Result Visualization

## Purpose

Les sorties des blocs d'un run sont sérialisées en un contrat structuré (image, courbe, métriques, métrique, texte) transporté via les callbacks existants, relisables par endpoint et affichées dans un panel dédié de l'éditeur. En mode mock, le pipeline s'exécute réellement en local pour rendre la visualisation testable sans GPU.

## Requirements

### Requirement: Contrat de sortie structuré
The generated script MUST serialize each block output as a typed JSON payload: bytes → `image` (base64), numeric list / dict `history` → `curve`, flat scalar dict → `metrics`, scalar number → `metric`, anything else → plain text. Plain-text outputs MUST remain backward compatible with the current console display.

#### Scenario: Sortie image
- **WHEN** un bloc retourne des octets (ex. `plot_predictions`)
- **THEN** la sortie est émise comme `{"type":"image","mime":"image/png","data":"<base64>"}`

#### Scenario: Historique d'entraînement
- **WHEN** `train_model` retourne `{"model": ..., "history": [floats]}`
- **THEN** la sortie est émise comme une courbe `{"type":"curve","points":[...]}` (le champ non sérialisable `model` est ignoré)

#### Scenario: Ancienne sortie texte
- **WHEN** une sortie n'est ni image, ni liste numérique, ni dict exploitable, ni scalaire
- **THEN** elle est émise comme texte et reste affichée dans la console

### Requirement: plot_predictions retourne une image
The `plot_predictions` block MUST return the rendered PNG bytes instead of writing a file. Its `output_path` parameter MUST be removed.

#### Scenario: Génération d'image
- **WHEN** le bloc `plot_predictions` s'exécute
- **THEN** il retourne les octets PNG (prêts à être émis comme image) et n'écrit plus de fichier sur disque

### Requirement: Lecture des résultats d'un run
The system MUST expose `GET /jobs/{id}/outputs` returning the structured outputs of a job, scoped to the job owner.

#### Scenario: Relire les résultats
- **WHEN** l'utilisateur ouvre un projet dont un job a produit des sorties
- **THEN** le frontend peut relire les sorties structurées de ce job via l'endpoint

### Requirement: Panel de visualisation
The editor MUST display a « Résultats » panel (tab next to « Console ») rendering the last run's outputs: metrics (key/value), curve (SVG, no library), and image (data URL). The panel MUST reload the last job's outputs when the editor is opened on a saved project.

#### Scenario: Métriques
- **WHEN** un run produit des sorties `metric`/`metrics`
- **THEN** le panel les affiche en clé/valeur

#### Scenario: Courbe
- **WHEN** un run produit une sortie `curve`
- **THEN** le panel la trace en SVG (polyline normalisée)

#### Scenario: Image
- **WHEN** un run produit une sortie `image`
- **THEN** le panel l'affiche via une data URL base64

### Requirement: Exécution locale en mode mock
When the Vast.ai key is in mock mode, the backend MUST execute the generated code as a local subprocess (with local `BACKEND_URL`/`JOB_ID`/`GPU_API_KEY`), so the status and output callbacks populate the job as on a real GPU. The local run MUST NOT block the HTTP request.

#### Scenario: Run local mock
- **WHEN** `VAST_API_KEY` est en mode mock et l'utilisateur lance un pipeline
- **THEN** le code généré s'exécute en local, les callbacks alimentent `job_outputs`, et le run se termine via `notify_status('pipeline','done')` (ou `notify_error`)
