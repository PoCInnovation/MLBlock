## 1. Supabase — Bucket & RLS

- [x] 1.1 Créer le bucket `user-uploads` (public)
- [x] 1.2 Ajouter RLS policy INSERT pour authenticated users
- [x] 1.3 Ajouter RLS policy SELECT for public (anonyme)
- [x] 1.4 Ajouter RLS policy DELETE pour service_role (backend)

## 2. Backend — Nettoyage des fichiers

- [x] 2.1 Créer une fonction utilitaire `delete_storage_file(path)` utilisant l'API REST Supabase avec `SUPABASE_SECRET_KEY`
- [x] 2.2 Dans `update_job_status` (done/error), extraire les URLs de fichiers des params du pipeline et les supprimer
- [x] 2.3 Dans `push_job_error`, idem
- [x] 2.4 Dans le dev timeout 60s, idem

## 3. Frontend — Upload & file param

- [x] 3.1 Ajouter une fonction `uploadFile(file, bucket, path)` dans `services/supabase.ts`
- [x] 3.2 Ajouter le rendu du type `"file"` dans `adaptParam` (file picker + upload + URL stockée)
- [x] 3.3 Si le type `"file"` n'est pas géré par `adaptParam`, ajuster la logique de `toSegments` dans `client.ts` pour le supporter

## 4. Déploiement

- [ ] 4.1 Commit et push
