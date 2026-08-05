## Why

La politique de mot de passe au register est trop faible (min 6 chars seulement) et aucune validation n'est montrée en temps réel. On ajoute une complexité minimale (6 chars + majuscule + minuscule + chiffre) avec une checklist pédagogique en temps réel côté register, sans bloquer les anciens comptes au login.

## What Changes

- `passwordSchema` dans `schemas/auth.ts` : min 6 + regex majuscule + minuscule + chiffre
- `registerSchema` utilise `passwordSchema` ; `loginSchema` garde `min(6)` (ne bloque pas les vieux comptes)
- `RegisterPage.tsx` : checklist pédagogique temps réel sous le champ mot de passe (4 cases ✓/○), `mode: "onChange"` sur useForm
- Confirmation toujours vérifiée via refine

## Capabilities

### New Capabilities
- `password-strength`: complexité mdp register + checklist temps réel

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `schemas/auth.ts`, `RegisterPage.tsx`
- **Aucun changement backend** (Supabase garde sa propre politique minimum)
