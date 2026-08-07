## 1. Générateur — contrat de sortie structuré

- [x] 1.1 Helper `_serialize_output(v)` émis dans le script généré : détecte bytes → image(base64), list de nombres → curve, dict `history` → curve, dict plat → metrics, scalaire → metric, sinon str()
- [x] 1.2 `generate_code` : remplace `notify_output('type', out_N)` par l'appel du helper + JSON (`notify_output('type', json.dumps(_serialize_output(out_N)))`) ; retire la troncature
- [x] 1.3 `plot_predictions` : retourne `io.BytesIO` PNG, retire `output_path`

## 2. Backend — lecture & exécution locale

- [x] 2.1 `push_job_output` : lever la troncature 10000 pour les payloads JSON structurés (limite ~1M pour base64)
- [x] 2.2 Endpoint `GET /jobs/{id}/outputs` → `[{block_name, output}]` (scopé user)
- [x] 2.3 `execute_pipeline` (mock) : subprocess local du code généré (env BACKEND_URL/JOB_ID/GPU_API_KEY locaux), Popen non bloquant ; les callbacks alimentent job_outputs/status
- [x] 2.4 Tests backend : payload structuré stocké sans troncature, GET outputs scopé, run local mock produit des outputs

## 3. Frontend — panel Résultats

- [x] 3.1 Client API : `getJobOutputs(id)` + `listPipelineJobs(id)` (dernier job)
- [x] 3.2 Store : garde le dernier job_id ; action de fetch des outputs après run
- [x] 3.3 `ConsolePanel` : tabs [Console | Résultats] ; rendu par type (metric/metrics → clé/valeur, curve → SVG polyline, image → data URL) ; fallback texte dans la console
- [x] 3.4 Rechargement au chargement : si pipelineId ouvert, fetch du dernier job → panel peuplé après refresh

## 4. Vérification

- [x] 4.1 Build frontend (`tsc --noEmit && vite build`) + tests backend (`uv run python -m pytest`)
- [x] 4.2 Smoke navigateur : run local mock (train_model + evaluate + plot_predictions) → panel Résultats affiche courbe + métrique + image ; refresh → résultats persistés
