## Context

`registerSchema` utilise `password: z.string().min(6)`. Pas de retour temps réel. La politique demandée : 6 chars + 1 maj + 1 min + 1 chiffre.

## Goals / Non-Goals

**Goals:**
- Checklist pédagogique temps réel (4 règles ✓/○)
- Register exige la complexité ; login garde `min(6)`
- Confirmation inchangée

**Non-Goals:**
- Pas de force-mètre (score zxcvbn) — 4 règles simples suffisent
- Pas de changement au login

## Decisions

1. **`passwordSchema` partagé** dans `schemas/auth.ts` :
```ts
const passwordSchema = z
  .string()
  .min(6, 'Au moins 6 caractères')
  .regex(/[A-Z]/, 'Une majuscule requise')
  .regex(/[a-z]/, 'Une minuscule requise')
  .regex(/[0-9]/, 'Un chiffre requis')
```

2. **`registerSchema`** utilise `passwordSchema` ; `loginSchema` garde `min(6)`.

3. **Checklist temps réel** dans `RegisterPage.tsx` via `form.watch('password')` :
```ts
const password = form.watch('password')
const rules = [
  { label: 'Au moins 6 caractères', ok: password.length >= 6 },
  { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
  { label: 'Une minuscule', ok: /[a-z]/.test(password) },
  { label: 'Un chiffre', ok: /[0-9]/.test(password) },
]
```
Chaque règle affiche `✓` (vert) si ok, `○` (gris) sinon.

4. **`mode: "onChange"`** sur `useForm` du register — le watch et les erreurs se mettent à jour à chaque keystroke.

5. **UI** : checklist sous le champ mot de passe, avant le bouton. Styles inline cohérents (theme.color.success / theme.color.textDim).

## Risks / Trade-offs

- **[watch sur chaque keystroke]** Re-render du composant à chaque frappe — négligeable (1 composant)
- **[regex vs Supabase]** Supabase a sa propre politique min — si Supabase exige plus, erreur serveur mappée ; notre politique frontend est un minimum, pas un maximum
