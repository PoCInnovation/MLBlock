## 1. Typecheck & bugs

- [x] 1.1 Ajouter `tsc --noEmit &&` au script `build` dans `package.json`
- [x] 1.2 Fix `useBlockRunner.ts` : `sourcePort` → `source_port`, `targetPort` → `target_port`
- [x] 1.3 Fix `flowConversion.ts` : mapping correct des segments dans `flowToLinear`
- [x] 1.4 Vérifier que `tsc --noEmit` passe avec 0 erreur

## 2. Installation Zod

- [x] 2.1 Installer `zod` dans `frontend/package.json`

## 3. Schémas

- [x] 3.1 Créer `src/schemas/auth.ts` : `loginSchema`, `registerSchema` (avec refine confirmation)
- [x] 3.2 Créer `src/schemas/api.ts` : `catalogSchema`, `validationSchema`
- [x] 3.3 Créer `src/schemas/format.ts` : helper `formatZodError(err)` → premier message lisible

## 4. Intégration forms

- [x] 4.1 `LoginPage.tsx` : valider avec `loginSchema` avant soumission, afficher `formatZodError`
- [x] 4.2 `RegisterPage.tsx` : valider avec `registerSchema`, retirer le if/else manuel de confirmation

## 5. Intégration API

- [x] 5.1 `client.ts` : parser `fetchCatalog` avec `catalogSchema.parse(data)`
- [x] 5.2 `client.ts` : parser `validateGraph` avec `validationSchema.parse(data)`
- [x] 5.3 Dériver les types via `z.infer` pour les données parsées

## 6. Vérification

- [x] 6.1 `tsc --noEmit` passe avec 0 erreur
- [x] 6.2 Build frontend réussi (avec typecheck)
- [ ] 6.3 Test manuel : email invalide → "Email invalide", password ≠ confirm → "Les mots de passe ne correspondent pas"
- [ ] 6.4 Test manuel : mode avancé avec edges → payload snake_case reçu par le backend
