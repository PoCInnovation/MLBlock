## Context

`load_csv` block prend un `path` local. Supabase Storage existant sur le projet. Frontend a déjà `@supabase/supabase-js`. Backend s'authentifie avec `SUPABASE_SECRET_KEY` pour les opérations admin (DELETE).

## Goals / Non-Goals

**Goals:**
- User upload un CSV depuis son PC via le frontend
- Le fichier est stocké dans Supabase Storage
- Le code généré peut lire le CSV via l'URL publique
- Le fichier est supprimé après l'exécution du job

**Non-Goals:**
- Ne pas créer une UI de gestion de fichiers (pas de liste, pas de rename)
- Ne pas gérer d'autres formats que CSV

## Decisions

1. **Bucket `user-uploads` public en lecture**
   - Le GPU (Vast.ai) n'a pas de JWT, besoin d'accès direct
   - RLS : INSERT = authenticated, SELECT = public, DELETE = service_role (via backend)

2. **Upload direct depuis le frontend** via `@supabase/supabase-js`
   - Pas de proxy backend → pas de surcharge, pas de limite de taille
   - Chemin : `{user_id}/{block_id}_{timestamp}.csv`

3. **Type de param `"file"`**
   - Nouveau dans `ParamInfo.type`, rendu frontend : file picker + upload
   - La valeur stockée est l'URL publique Supabase

4. **Code généré** : `pd.read_csv(url)` — pandas sait lire une URL HTTP
   - Pas de modification du block `load_csv`
   - L'URL est passée en paramètre comme n'importe quelle string

5. **Nettoyage** : dans `update_job_status` et `push_job_error`, après avoir destroy l'instance, supprimer les fichiers du job
   - Requête REST DELETE à Supabase Storage avec `SUPABASE_SECRET_KEY`
   - Les URLs des fichiers sont dans les params des blocks du pipeline

6. **Supabase Storage REST API** plutôt que client `supabase-py`
   - `DELETE https://{project}.supabase.co/storage/v1/object/{bucket}/{path}`
   - Header `apikey: {SUPABASE_SECRET_KEY}` ou `Authorization: Bearer {SUPABASE_SECRET_KEY}`

## Risks / Trade-offs

- **[Bucket public]** N'importe qui avec l'URL peut lire un fichier → Mitigation: les URLs contiennent un UUID peu devinable. Acceptable pour du dev.
- **[Fichier orphelin]** Si le job timeout ou crashe avant le callback cleanup → Mitigation: le dev timeout 60s déclenche aussi le cleanup
- **[Taille fichier]** Supabase Storage gratuit: 1GB, 10MB par fichier max → acceptable pour des CSV