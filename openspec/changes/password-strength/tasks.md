## 1. Schéma

- [x] 1.1 Ajouter `passwordSchema` (min 6 + maj + min + chiffre) dans `schemas/auth.ts`
- [x] 1.2 `registerSchema` utilise `passwordSchema` ; `loginSchema` garde `min(6)`

## 2. RegisterPage

- [x] 2.1 Ajouter `form.watch('password')` et les 4 règles
- [x] 2.2 `mode: "onChange"` sur `useForm`
- [x] 2.3 Rendre la checklist (✓ vert / ○ gris) sous le champ mot de passe

## 3. Vérification

- [x] 3.1 `tsc --noEmit` passe
- [x] 3.2 Build réussi
- [ ] 3.3 Test manuel : taper "Password9" → les 4 cases se cochent en temps réel
