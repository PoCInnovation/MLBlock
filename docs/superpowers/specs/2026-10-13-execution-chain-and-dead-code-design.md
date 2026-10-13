# Spécification Technique — Chaîne d'Exécution, Unification des Hooks/Utils, Code Couleur Catégories et Nettoyage de Code Mort

Date : 2026-10-13  
Statut : Proposition / Mis à jour  
Périmètre : Frontend (`frontend/`), Backend (`backend/`), Directives (`AGENTS.md`)

---

## 1. Contexte & Intentions

Le projet `mlblock` permet la composition visuelle de pipelines de Machine Learning / Deep Learning, compilés ensuite en scripts Python autonomes.

L'audit approfondi de la codebase a mis en lumière plusieurs incohérences et dettes techniques à corriger :
1. **Couleurs des blocs** : L'affichage dans `BlockCard` met en avant le framework technique (PyTorch, Scikit-Learn...) et sa couleur moteur (`ENGINE_COLORS`), au lieu d'identifier le rôle fonctionnel du bloc (sa catégorie métier issue des dossiers backend `{category}-{HEXCOLOR}`).
2. **Chaîne d'exécution & Annulation** :
   - En mode local, un décalage entre la clé de callback par défaut dans `gpu_auth.py` (`mock-gpu-key-for-testing`) et celle injectée par `execution.py` / `generator.py` (`mock-gpu-key`) provoque un rejet HTTP 403 sur les callbacks de statut et sorties.
   - Le backend n'a pas d'endpoint d'annulation pour tuer le processus local actif (`Popen`) ou détruire l'instance GPU.
   - Côté frontend, le bouton *Arrêter* réinitialise l'état local du client sans ordonner l'arrêt au serveur.
3. **Fragmentation et duplications des Hooks et Utils frontend** :
   - `jobRunner.ts` a été abandonné sous forme de stub vide (`return null as unknown`), tandis que `useBlockRunner.ts` (258 lignes) porte toute la logique et que `JournalPanel.tsx` duplique ses propres requêtes TanStack Query.
   - `toServerPayload()` est dupliqué entre `utils/blockHelpers.ts` et `store/pipelineDocument.ts`. La règle du projet impose d'utiliser `pipelineDocument.toServerPayload()`.
   - `useAppStore.ts` maintient des champs doublons synchronisés en double (`results` et `jobOutputs`).
4. **Code mort et dépendances orphelines** :
   - Fichiers morts : `FlowPalette.tsx`, `ResultsPanel.tsx`, `hover-card.tsx`, `lib/utils.ts`.
   - Dépendance morte : `nitro` dans `package.json`.
   - Les fichiers `connection.ts` et `courseWatcher.ts` sont expressément conservés pour réutilisation/adaptation ultérieure.

---

## 2. Objectifs, Non-Objectifs & Anti-Objectifs

### Objectifs
- **Code couleur par catégorie** : Remplacer l'affichage du moteur/framework sur `BlockCard` par le nom et la couleur hexadécimale de la catégorie (`{category}-{HEXCOLOR}`).
- **Unification du runner dans `useJobRunner.ts`** :
  - Renommer et implémenter `frontend/src/hooks/useJobRunner.ts` comme le hook unique d'exécution, de suivi (polling + Realtime CDC), de gestion des sorties et d'annulation.
  - Consommer `useJobRunner` dans `EditorHeader.tsx` et `JournalPanel.tsx`.
  - Éliminer le stub mort et fusionner `useBlockRunner.ts`.
- **Chaîne d'exécution complète (Backend & Frontend)** :
  - Aligner `GPU_API_KEY = "mock-gpu-key"` dans `gpu_auth.py`.
  - Gérer les processus locaux actifs dans `LocalBackend._active_processes` pour pouvoir les interrompre proprement (`SIGTERM` puis `SIGKILL`).
  - Créer `POST /api/jobs/{job_id}/cancel` côté backend et l'appeler via `cancelJob(id)` depuis `useJobRunner.onStop()`.
  - Assurer la sélection et l'affichage temps réel du job actif dans `JournalPanel.tsx` sans écran vide.
- **Unification des Utils & Store** :
  - Supprimer la copie orpheline `toServerPayload()` dans `utils/blockHelpers.ts` et rediriger tous les imports vers `store/pipelineDocument.ts`.
  - Unifier les sorties du store sur `jobOutputs` et déprécier `results`.
- **Nettoyage ciblé de code mort** : Supprimer les 4 fichiers morts identifiés et la dépendance `nitro`.
- **Gouvernance `AGENTS.md`** : Inscrire une règle pérenne contre le code mort et l'obligation d'audit Knip.

### Non-Objectifs
- Ne pas supprimer `connection.ts` ni `courseWatcher.ts`.
- Ne pas modifier le compilateur `generator.py` au-delà des clés d'auth et callbacks.

### Anti-Objectifs
- Ne pas laisser de processus orphelins tourner en arrière-plan après annulation.
- Ne pas introduire de régression sur les 198 tests backend et 131 tests frontend.

---

## 3. Spécification Détaillée

   - Pour les SuperBlocks : résoudre la catégorie via le premier enfant présent au catalogue (ex: `catalog.blocks[sb.children[0]]?.cat`), et repli sur l'étape macro (`macro_stage`) si absent, évitant le gris générique `#888`.
   - `/api/catalog` expose `categories: [{ id, name, color }]`.
   - Chaque bloc `BlockDef` a `cat: string`.
2. **Affichage dans `BlockCard.tsx`** :
   - Remplacer le badge `ENGINE_LABEL` (PyTorch, Scikit-Learn...) par le nom de la catégorie (ex: *Données*, *Modèles*, *Couches*, *Normalisation*, *Activation*...).
   - Définir le style du badge avec la couleur hexadécimale `cat.color` (fond transparent/subtil, texte et bordure de la couleur de catégorie).
   - Pour les SuperBlocks : résoudre la catégorie via l'étape macro (`macro_stage`) ou le premier enfant au catalogue pour éviter la couleur par défaut `#888`.
3. **Arêtes (`FlowCanvas.tsx` / `FlowLink.tsx`)** :
   - Nettoyer les dégradés inter-moteurs artificiels pour garantir une liaison lisible neutre ou héritée de la catégorie source.

### B. Hook Central `useJobRunner.ts` & Affichage Journal

1. **Création de `frontend/src/hooks/useJobRunner.ts`** :
   - Renommer `jobRunner.ts` en `useJobRunner.ts`.
   - Centraliser la machine d'état d'un job :
     - `onRun()` : validation (`validateGraph`) $\rightarrow$ sauvegarde (`ensureDraft` / `updatePipeline`) $\rightarrow$ simulation (`buildPipeline`) $\rightarrow$ lancement (`executePipeline`).
     - `onStop()` : appel à `cancelJob(jobId)` vers le backend $\rightarrow$ passage à l'état `cancelled`.
     - `onClear()` : réinitialisation canvas + journal.
     - Suivi : polling status 3s, polling outputs 2s, écoute Supabase Realtime CDC sur `job_outputs`.
     - Expose : `{ onRun, onStop, onClear, isRunning, isStopping, isError, jobId, status, job, outputs, consoleLines }`.
   - Remplacer l'usage de `useBlockRunner` dans `EditorHeader.tsx` par `useJobRunner`.
   - Fournir un alias rétrocompatible dans `useBlockRunner.ts` si d'autres composants l'importent, ou supprimer `useBlockRunner.ts` s'il n'a plus d'appelant.
2. **Affichage dans `JournalPanel.tsx`** :
   - Consommer directement `useJobRunner` ou le state du store pour afficher en temps réel les logs (`consoleLines`) et les outputs dès le clic sur *Lancer*.
   - Si un run vient d'être initié (`lastJobId`), le sélectionner automatiquement (`selectedJobId = lastJobId`) pour éviter l'état vide « Aucune exécution ».

### C. Chaîne d'Exécution & Annulation Backend

1. **Authentification GPU / Local (`backend/mlblock/server/gpu_auth.py`)** :
   - Aligner la valeur par défaut : `GPU_API_KEY = os.environ.get("GPU_API_KEY", "mock-gpu-key")`.
2. **Gestionnaire de Processus Locaux (`backend/mlblock/execution.py`)** :
   - Dans `LocalBackend` :
     - Stocker `_processes: dict[UUID, subprocess.Popen]`.
     - `launch(code, job_id)` enregistre `proc = subprocess.Popen(...)`.
     - `cancel(job_id)` : si le process existe et tourne encore, envoyer `SIGTERM`, attendre jusqu'à 2s, puis `SIGKILL` si nécessaire. Nettoyer le fichier temporaire `mlblock_run_*.py`.
3. **Endpoint `POST /api/jobs/{job_id}/cancel` (`backend/mlblock/server/routes.py`)** :
   - Vérifie `user_id == job.user_id`.
   - Si `job.status` est `queued`, `dispatched` ou `running` :
     - Si run local : `LocalBackend().cancel(job_id)`.
     - Si run GPU : `VastBackend().destroy(job.vast_instance_id)`.
     - Mise à jour en base : `job.status = "cancelled"`, `job.completed_at = datetime.now(timezone.utc)`.
     - Nettoyage des fichiers de pipeline via `cleanup_pipeline_files(job.pipeline_id)`.
   - Retourne l'objet `Job` mis à jour.
4. **Client API Frontend (`frontend/src/api/client.ts`)** :
   - Ajouter `export async function cancelJob(id: string): Promise<Job>`.

### D. Unification des Utils et du Store

1. **Suppression de la duplication `toServerPayload`** :
   - Retirer la fonction `toServerPayload()` de `frontend/src/utils/blockHelpers.ts`.
   - Remplacer les imports de `blockHelpers.toServerPayload` par `import { toServerPayload } from '../store/pipelineDocument'` dans :
     - `frontend/src/main.tsx`
     - `frontend/src/routes/__root.tsx`
     - `frontend/src/pages/EditorPage.tsx`
     - `frontend/src/hooks/useJobRunner.ts`
   - Retirer la fonction morte `colorFor()` de `blockHelpers.ts`.
2. **Nettoyage du Store Zustand (`frontend/src/store/useAppStore.ts`)** :
   - Garder `jobOutputs` comme référence unique des sorties et déprécier `results`.
   - Conserver `results` dans l'interface `AppState` comme alias synchronisé de `jobOutputs` avec tag `@deprecated` pour garantir l'absence de régression de type, tout en migrant le code applicatif vers `jobOutputs`.

### E. Nettoyage de Code Mort & Règles `AGENTS.md`

1. **Suppression de Fichiers Morts** :
   - `frontend/src/components/flow/FlowPalette.tsx`
   - `frontend/src/components/ui/ResultsPanel.tsx`
   - `frontend/src/components/ui/hover-card.tsx`
   - `frontend/src/lib/utils.ts`
2. **Conservation Explicite** :
   - `frontend/src/utils/connection.ts`
   - `frontend/src/utils/courseWatcher.ts`
3. **Dépendance** :
   - Retirer `"nitro": "^3.0.260610-beta"` de `frontend/package.json`.
4. **Mise à jour `AGENTS.md`** :
   - Ajouter dans la section frontend de `AGENTS.md` la règle de gouvernance : interdiction des shims ou composants orphelins, obligation d'exécuter `pnpm dlx knip` lors des audits.
