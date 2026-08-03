## 1. Installation

- [x] 1.1 Installer `react-hook-form` et `@hookform/resolvers`

## 2. LoginPage

- [x] 2.1 Refactorer avec `useForm<LoginInput>({ resolver: zodResolver(loginSchema) })`
- [x] 2.2 Remplacer le `<div>` par `<form onSubmit={form.handleSubmit(onSubmit)} noValidate>`
- [x] 2.3 `register('email')` / `register('password')` avec `aria-invalid` et erreurs près des champs
- [x] 2.4 Ajouter `<label htmlFor>` pour chaque champ
- [x] 2.5 Garder `loading`, `mapSupabaseError` et les boutons secondaires (magic link, Google)
- [x] 2.6 Retirer les useState email/password (remplacés par defaultValues)

## 3. RegisterPage

- [x] 3.1 Refactorer avec `useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })`
- [x] 3.2 `<form onSubmit noValidate>`, register email/password/confirm
- [x] 3.3 Erreur de confirmation près du champ confirm (`errors.confirm`)
- [x] 3.4 `<label htmlFor>` pour chaque champ
- [x] 3.5 Garder loading, `mapSupabaseError`, check `data.user`

## 4. Vérification

- [x] 4.1 `tsc --noEmit` passe avec 0 erreur
- [x] 4.2 Build frontend réussi
- [ ] 4.3 Test manuel : Entrée soumet le form, erreurs près des champs, aria-invalid présent
