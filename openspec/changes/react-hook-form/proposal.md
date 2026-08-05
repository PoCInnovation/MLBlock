## Why

Les formulaires login/register ne respectent pas les patterns React Hook Form + Zod :
- Pas de `<form>` → le submit par Entrée ne fonctionne pas
- Une seule erreur globale en haut au lieu d'erreurs près de chaque champ
- Pas de `aria-invalid` / labels liés (`htmlFor`) → accessibilité incomplète
- Pas de `useForm`/`zodResolver` → état de formulaire géré manuellement avec useState

## What Changes

- Ajouter `react-hook-form` et `@hookform/resolvers` comme dépendances
- Refactorer `LoginPage.tsx` et `RegisterPage.tsx` avec `useForm` + `zodResolver`
- `<form onSubmit={form.handleSubmit(onSubmit)}>` → submit natif (Entrée)
- Erreurs affichées **près de chaque champ** avec `aria-invalid` sur les inputs
- Labels liés aux inputs (`htmlFor` / `id`)
- Réutiliser les schémas Zod existants (`loginSchema`, `registerSchema`)
- Garder les messages d'erreur français (Zod) et `mapSupabaseError`

## Capabilities

### New Capabilities
- `rhf-forms`: login/register refactorés avec React Hook Form + Zod, submit natif, erreurs par champ, a11y

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `react-hook-form`, `@hookform/resolvers` (+~15KB), `LoginPage.tsx`, `RegisterPage.tsx`
- **Aucun changement backend**
- **Aucun changement des schémas Zod existants** (réutilisés)
