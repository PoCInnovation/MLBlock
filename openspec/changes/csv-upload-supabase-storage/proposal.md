## Why

Les blocks de chargement de données (`load_csv`) ne prennent qu'un chemin local. Un user ne peut pas uploader un fichier depuis son PC pour l'utiliser dans un pipeline. Avec Supabase Storage, on permet l'upload direct depuis le frontend et l'accès depuis le code généré (GPU Vast.ai).

## What Changes

- Création d'un bucket Supabase Storage `user-uploads` public en lecture
- Nouveau type de param `"file"` dans le registre des blocks
- Upload CSV depuis le frontend directement vers Supabase Storage (via `@supabase/supabase-js`)
- Au moment de l'execution, l'URL publique du fichier est embarquée dans le code généré
- À la fin du job (done/error), le backend supprime le fichier du bucket

## Capabilities

### New Capabilities
- `csv-upload-storage`: bucket Supabase, upload frontend, endpoint cleanup, type de param `file`

### Modified Capabilities
<!-- Aucune spec existante modifiée -->

## Impact

- **Supabase**: création du bucket `user-uploads`, RLS (INSERT=auth, SELECT=public, DELETE=service_role)
- **Backend**: nouveau type `file` dans `ParamInfo`, endpoint DELETE sur Storage à la fin du job, import `supabase-py` ou requête REST
- **Frontend**: `client.ts` nouvelle fonction `uploadFile()`, composant file picker dans le rendu des params
- **Block**: `load_csv` inchangé
