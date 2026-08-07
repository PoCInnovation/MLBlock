## Why

Les pipelines ne sont pas réellement persistés côté utilisateur : le run crée silencieusement un pipeline nommé « mon-premier-modèle » (pipelineId en mémoire seulement), les boutons Importer/Exporter de l'éditeur sont morts, et il n'existe aucune page permettant de retrouver, rouvrir, supprimer ou partager ses projets. Les utilisateurs perdent leur travail au refresh et ne peuvent pas naviguer entre leurs projets.

## What Changes

- **Page « Mes projets »** (`/projets`) : liste des projets sauvegardés de l'utilisateur (nom, date de modification), actions ouvrir / exporter / supprimer, boutons « Nouveau projet » et « Importer ». Le CTA de la page d'accueil « Commencer à construire » pointe vers `/projets` au lieu de `/editor`.
- **Sauvegarde explicite** : bouton « Sauvegarder » dans l'éditeur (avec saisie du nom au premier enregistrement). La sauvegarde écrit le JSON du pipeline (nodes/edges) en base — le main.py n'est **pas** stocké au save, il reste généré à la demande.
- **Modèle draft** : un run sans projet ouvert crée un brouillon invisible (`is_draft=true`, 1 seul draft par utilisateur, nettoyé à la création suivante). « Sauvegarder » formalise le projet (nom + `is_draft=false`). La liste « Mes projets » n'affiche que les projets formalisés.
- **Import/Export** : l'export ouvre un modal de choix [JSON de la pipeline | Code (main.py)] puis télécharge le fichier. L'import accepte un fichier JSON au format MLBlock (validé), crée un projet et l'ouvre dans l'éditeur. Les boutons Importer/Exporter de l'éditeur sont câblés.
- **Format JSON étendu** : `PipelineNode` gagne `position: {x, y} | null` (optionnel, rétro-compatible) pour préserver le layout du canvas avancé ; auto-layout en fallback.
- **Limites & intégrité** : 20 projets max par utilisateur (409 à l'API, comptés hors drafts), cascade de suppression user → pipelines → jobs → job_outputs.
- L'ouverture d'un projet restaure le canvas (linéaire et avancé) depuis le JSON stocké via une action store `loadPipeline`.

## Capabilities

### New Capabilities
- `projets`: Page « Mes projets » — liste, navigation, création, suppression, limites (20/user, cascade), import/export depuis le menu.
- `pipeline-import-export`: Import/export JSON de pipeline + export du code généré (main.py) avec modal de choix et téléchargement.

### Modified Capabilities
<!-- Aucune spec existante modifiée — capability purement nouvelle. -->

## User Impact

- L'accueil mène vers « Mes projets » ; l'éditeur reste accessible via « Nouveau projet » ou « Ouvrir ».
- Les utilisateurs retrouvent leurs pipelines, peuvent les renommer/supprimer et les réexporter.
- Un run sans sauvegarde ne pollue plus la liste (draft invisible).
- Erreurs utilisateur en français (plafond atteint, format de fichier invalide).
