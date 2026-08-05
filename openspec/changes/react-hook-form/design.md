## Context

LoginPage/RegisterPage utilisent `useState` + `safeParse` manuel au submit. Les patterns React Hook Form (guide shadcn) montrent : `useForm` + `zodResolver`, `<form onSubmit>`, `Controller`/`field`, erreurs par champ avec `aria-invalid`.

## Goals / Non-Goals

**Goals:**
- `useForm` + `zodResolver` pour les 2 forms
- Submit natif via `<form onSubmit>`
- Erreurs près de chaque champ avec `aria-invalid`
- Labels liés (`htmlFor`/`id`)
- Réutiliser les schémas Zod existants

**Non-Goals:**
- Pas de composants shadcn Field/Controller génériques — on garde le markup inline (styles existants)
- Pas de `useFieldArray` (pas de champs dynamiques ici)
- Pas de `mode: "onChange"` — on garde le défaut `onSubmit`

## Decisions

1. **Dépendances** : `react-hook-form`, `@hookform/resolvers`

2. **Pattern de base** (conforme au guide) :
```tsx
const form = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
})

const onSubmit = async (data: LoginInput) => {
  setLoading(true)
  try {
    const { error } = await signInWithEmail(data.email, data.password)
    if (error) setError(mapSupabaseError(error.message))
    else navigate('/editor')
  } catch {
    setError(mapSupabaseError('Network request failed'))
  } finally {
    setLoading(false)
  }
}

return (
  <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
    <input {...form.register('email')} aria-invalid={!!form.formState.errors.email} />
    {form.formState.errors.email && <span style={s.fieldError}>{form.formState.errors.email.message}</span>}
    ...
    <button type="submit" disabled={loading}>...</button>
  </form>
)
```

3. **`register()` au lieu de `Controller`** : pour des inputs simples, `register` suffit (le guide montre `Controller` pour les cas contrôlés). Les inputs natifs ici sont non-contrôlés — `register` est plus simple et recommandé par RHF pour ce cas.

4. **`noValidate`** : désactive la validation native du navigateur pour laisser Zod gérer (comme le guide le recommande).

5. **Erreur par champ** : `form.formState.errors.<field>?.message` affiché sous chaque input. L'erreur Supabase (serveur) reste globale en haut.

6. **Register** : `registerSchema` a un `refine` sur `confirm` → l'erreur est attachée au path `confirm` (déjà configuré dans le schéma). L'input confirm affiche `errors.confirm?.message`.

7. **Labels** : remplacer les placeholders par des `<label htmlFor>` visibles + garder placeholder comme hint.

## Risks / Trade-offs

- **[register vs Controller]** `register` retourne `ref` — les inputs natifs fonctionnent. Si on passait à des composants custom (shadcn Input), il faudrait `Controller`. Acceptable ici.
- **[refine path]** L'erreur de confirmation est sur `path: ['confirm']` — vérifier que `errors.confirm` l'affiche (le schéma le définit déjà)
- **[Perte de l'état useState]** `defaultValues` dans useForm remplace les useState email/password — vérifier qu'aucune autre lecture ne dépend des state
