# TODO

## Prochaines tâches frontend

### Édition des nœuds Contrôle (nesting)

Le modèle de graphe actuel est plat (`script: Block[]`, aucun champ `children`).
L'API accepte déjà `children: PipelineNode[]` sur chaque nœud — on envoie `[]` partout pour l'instant.

Ce qu'il faut faire :
- Ajouter `children: Block[]` sur le type `Block` dans `blockHelpers.ts`
- Gérer l'imbrication dans le store (`addBlock` dans un parent, `deleteBlock` récursif, etc.)
- Rendre les blocs Contrôle avec une zone enfant dans le canvas
- Envoyer les vrais enfants dans le payload API
- Vérifier `BlockDetail.children_allowed` pour conditionner l'UI

### Adapter params → segments

`BlockDetail.params` est un objet libre (`additionalProperties: true` dans le spec).
L'adaptateur dans `src/api/client.ts` (`adaptParam`) fait des hypothèses sur la forme de chaque valeur (`{ default, options? }`).

À valider dès qu'un vrai catalogue backend est disponible — ajuster si la structure diffère.

### Bouton "Générer le code"

`generatePipelineCode(id)` est câblé dans `src/api/client.ts` (`POST /api/pipelines/{id}/generate`).
Pas encore exposé dans l'UI. Ajouter un bouton dans `EditorHeader` qui affiche le code généré.

### Retry dans la modal "Éditeur non disponible"

La modal affiche un message d'erreur précis (réseau vs. réponse inattendue) mais propose seulement "Retour".
Ajouter un bouton "Réessayer" qui relance `fetchCatalog()` sans repasser par la home.

### Nom du pipeline

Le nom est fixé à `'mon-premier-modèle'` dans `useBlockRunner.ts`.
À terme : champ éditable dans `EditorHeader` (lié à `useAppStore`), envoyé dans `PipelineCreate.name`.

### Auth — Configuration Supabase

- [ ] **SITE_URL** : dans le dashboard Supabase > Authentication > URL Configuration, mettre `SITE_URL` à `https://mlblock-frontend.onrender.com`
- [ ] **Redirect URLs** : ajouter `https://mlblock-frontend.onrender.com/**` dans les redirect URLs autorisées
- [ ] **Google OAuth** : dans Supabase > Authentication > Providers > Google, activer et configurer :
  - Récupérer les credentials depuis Google Cloud Console (OAuth consent screen + OAuth 2.0 Client ID)
  - `Client ID` et `Client Secret` dans Supabase
  - `Authorized redirect URIs` dans Google Cloud : `https://hrvbsbkcbtgephuntgqd.supabase.co/auth/v1/callback`
- [ ] **Env vars Render** : ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans le service frontend sur Render
