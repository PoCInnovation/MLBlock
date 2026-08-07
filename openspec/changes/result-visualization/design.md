## Context

Le pipeline s'exécute sur Vast.ai (ou mock) via le code généré par `generate_code`. Chaque bloc émet `notify_output(block, output)` → `POST /jobs/{id}/output` → ligne `job_outputs` (colonne TEXT, tronquée à 10000). Le frontend affiche ces lignes en texte brut dans la console. Les blocs retournent déjà des structures utiles : `train_model` → `{model, history: [floats]}`, `evaluate` → float, `train_epoch` → float. `plot_predictions` écrit `predictions.png` sur le disque du GPU (perdu). Le mock Vast (`VAST_API_KEY` commençant par "mock") ne fait rien à l'exécution → aucun output en dev.

## Goals / Non-Goals

**Goals:**
- Rendre les résultats exploitables : un payload de sortie typé (image / curve / metrics / metric / texte) transporté via les callbacks existants
- Relire les résultats d'un run (endpoint GET outputs) et les afficher dans un panel dédié
- Permettre un run local réel (subprocess) pour tester sans GPU
- Zéro nouvelle dépendance frontend (SVG fait main, data URL)

**Non-Goals:**
- Stockage des images dans Supabase Storage (PoC : base64 en colonne TEXT ; migration Storage si les images grossissent)
- Navigateur de sélection entre les runs d'un projet (v1 : dernier run du pipeline courant)
- Export/téléchargement des images générées
- Streaming temps réel des résultats (on rafraîchit à la fin du run)

## Decisions

### D1 — Contrat de sortie structuré dans le générateur
`generate_code` sérialise chaque sortie selon son type Python, en une seule fonction helper émise dans le script :
- `bytes` → `{"type":"image","mime":"image/png","data":"<base64>"}`
- liste de nombres → `{"type":"curve","points":[...]}`
- dict avec clé `history` (liste) → `{"type":"curve","points":history}` (les autres clés non sérialisables sont ignorées, ex. `model`)
- dict plat de scalaires → `{"type":"metrics","values":{...}}`
- int/float → `{"type":"metric","value":...}`
- sinon → `str()` (texte, comportement actuel)

Le helper sérialise en JSON avant d'appeler `notify_output` (le handler reste un POST JSON inchangé). `str(output)[:10000]` est remplacé par le JSON typé.

### D2 — `plot_predictions` retourne les octets
Le bloc écrit dans un `io.BytesIO` et retourne `buf.getvalue()` (bytes) → détecté comme image par D1. `output_path` retiré de la signature. Le registre auto-découvert met à jour la liste des params.

### D3 — Backend : lever la troncature + endpoint de lecture
- `push_job_output` : ne plus tronquer à 10000 quand le payload est JSON structuré (limite généreuse, ex. 1 000 000 pour les base64 image ; les valeurs du `output` du handler backend sont déjà une string).
- Nouveau `GET /jobs/{id}/outputs` → `[{block_name, output}]` (scopé au user du job).
- Aucun changement de schéma DB (`job_outputs` a déjà `block_name`, `output` TEXT).

### D4 — Exécution locale réelle (mock)
Dans `execute_pipeline`, si `VAST_API_KEY` est mock (ou `vast_instance_id` == mock), exécuter le code généré en subprocess local au lieu de no-op :
- écrire `code` dans un fichier temp, `subprocess.Popen([sys.executable, f], env={...BACKEND_URL: self, JOB_ID, GPU_API_KEY})`
- les callbacks `POST /jobs/{id}/output|status|error` du script pointent vers le backend local → `job_outputs` alimentés réellement
- le run reste async (pas d'attente bloquante côté requête ; le statut se met à jour via les callbacks)
- les jobs se terminent via `notify_status('pipeline','done')` / `notify_error` comme en GPU.

### D5 — Panel « Résultats » (frontend)
Tab « Résultats » à côté de « Console » dans `ConsolePanel` :
- après un run, fetch `GET /jobs/{id}/outputs` (le `pipelineId` + dernier job déjà connus)
- rendu par type : metric → `clé = valeur` ; metrics → grille clé/valeur ; curve → SVG polyline (normalisation min/max, points de taille 1 à 0) ; image → `<img src="data:...">`
- persistant : le panel recharge les outputs du dernier job au chargement si `pipelineId` est déjà ouvert
- les outputs texte continuent d'apparaître dans la console (compat)

### D6 — Scope v1
Dernier run du pipeline courant uniquement. Le sélecteur multi-runs (déjà listable via `GET /pipelines/{id}/jobs`) est reporté.

## Risks / Trade-offs

- **`plot_predictions` cassant** : les pipelines existants avec `output_path` doivent être réédités — acceptable (PoC, un seul bloc image).
- **Base64 en colonne TEXT** : une image ~100-200 Ko → ~130-270 Ko base64 par run ; PostgreSQL gère sans souci à cette échelle. Migration Storage si beaucoup d'images.
- **Exécution locale** : le subprocess importe torch (déjà dans le venv local pour le build) ; les runs longs bloquent la requête HTTP ? Non — lancé en arrière-plan (Popen non bloquant) ; le statut se propage par callbacks.
- **JSON typé côté handler** : les anciens outputs (strings non typées) restent lisibles (fallback texte) — rétro-compatible.
- **Sécurité** : l'exécution locale exécute du code généré utilisateur — déjà le cas en GPU (sandbox Vast) ; en local c'est le poste de dev (acceptable, usage PoC).
