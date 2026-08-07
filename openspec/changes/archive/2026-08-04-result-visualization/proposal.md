## Why

Les résultats des runs sont actuellement gâchés : le générateur sérialise chaque sortie de bloc avec `str(output)[:10000]`, ce qui détruit les structures utiles (`train_model` retourne déjà un `history` de pertes, `evaluate` un score) et rend les images impossibles (`plot_predictions` écrit un PNG sur le GPU qui ne remonte jamais). Il n'y a aucun endpoint pour relire les résultats ni de panel d'affichage — la console ne montre que du texte brut. Aucune visualisation n'est possible aujourd'hui.

## What Changes

- **Contrat de sortie structuré** : le générateur émet un payload JSON typé selon la sortie Python du bloc — `image` (bytes → base64), `curve` (liste de nombres / `history` d'un dict), `metrics` (dict plat), `metric` (scalaire), texte (fallback). Le `str()` destructeur et la troncature à 10000 disparaissent pour les payloads structurés.
- **`plot_predictions` change de contrat** : retourne les octets PNG (`io.BytesIO`) au lieu d'écrire un fichier ; le param `output_path` est retiré. **BREAKING** pour les pipelines qui l'utilisent avec un chemin.
- **Endpoint `GET /jobs/{id}/outputs`** : relire les résultats structurés d'un run (les lignes existent déjà dans `job_outputs`, seule la lecture manque).
- **Exécution locale réelle** : quand `VAST_API_KEY` est en mode mock, le backend exécute le code généré en subprocess local (`BACKEND_URL`, `JOB_ID` locaux) — les callbacks remontent naturellement, rendant la visualisation testable sans GPU.
- **Panel « Résultats »** dans l'éditeur (tab à côté de la console) : affiche métriques (clé/valeur), courbe de perte (SVG sans librairie), image (data URL base64) du dernier run ; persistant via `job_outputs` (visible après refresh).

## Capabilities

### New Capabilities
- `result-visualization`: Contrat de sortie structuré, endpoint de lecture des résultats, panel d'affichage (métriques, courbes, images) et exécution locale de démonstration.

### Modified Capabilities
<!-- Aucune spec existante modifiée — capability purement nouvelle. -->

## User Impact

- L'utilisateur voit enfin les résultats de ses entraînements : courbe de perte, métriques finales, graphique de prédictions.
- Un run sans GPU (mock) exécute réellement le pipeline localement — boucle de démo complète.
- `plot_predictions` ne prend plus `output_path` : les pipelines existants l'utilisant doivent être réédités (rare en PoC).
