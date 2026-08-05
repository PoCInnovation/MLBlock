## Context

Frontend React+Vite+TS+Zustand. Backend FastAPI/Pydantic (valide déjà tout). 3 erreurs TS réelles passent en prod car Vite (esbuild) transpile sans type-check. Le backend attend des edges en snake_case, le frontend envoie du camelCase. Aucune validation runtime frontend.

## Goals / Non-Goals

**Goals:**
- `tsc --noEmit` dans le build (bloque les régressions TS)
- Fixer les 3 erreurs TS
- Fixer le snake_case des edges (payload API correct)
- Validation runtime avec Zod (forms + réponses API clés)

**Non-Goals:**
- Ne pas re-valider ce que Pydantic garantit déjà sur chaque endpoint (Zod couvre les inputs frontend + catalog/validate)
- Ne pas créer un schéma pour chaque endpoint

## Decisions

1. **Typecheck dans le build** :
   ```json
   "build": "tsc --noEmit && vite build"
   ```
   Le typecheck bloque avant le build. `tsconfig.json` existe déjà avec `noEmit: true`.

2. **Fix edges snake_case** (`useBlockRunner.ts`) :
   ```ts
   // Avant (perdu par Pydantic) :
   sourcePort: e.sourceHandle ?? 'out_1',
   // Après (attendu par le backend) :
   source_port: e.sourceHandle ?? 'out_1',
   ```

3. **Fix `flowToLinear`** (`flowConversion.ts`) : le code accède à `seg.type`/`seg.v` sur un `Segment` (TextSeg a `v`, NumSeg a `k`/`def`). Corriger le mapping pour lire `s.t === 'text' ? s.v : ...` correctement typé.

4. **Zod — installation** : `zod` (~15KB, pas de deps natives)

5. **Schémas forms** dans `src/schemas/auth.ts` :
   ```ts
   export const loginSchema = z.object({
     email: z.string().email('Email invalide'),
     password: z.string().min(6, 'Minimum 6 caractères'),
   })
   export const registerSchema = loginSchema.extend({
     confirm: z.string(),
   }).refine(d => d.password === d.confirm, {
     message: 'Les mots de passe ne correspondent pas',
     path: ['confirm'],
   })
   ```

6. **Schémas API** dans `src/schemas/api.ts` :
   - `catalogSchema` : `{ categories: [{ id, name, color, blocks: [...] }] }`
   - `validationSchema` : `{ valid: boolean, errors: string[] }`
   - Parsés dans `client.ts` avec `.parse()` au lieu de `as Type`

7. **Typage dérivé** : `z.infer<typeof catalogSchema>` remplace les interfaces manuelles correspondantes.

8. **Error extraction** : helper `formatZodError(err)` → premier message lisible.

## Risks / Trade-offs

- **[Build plus lent]** `tsc --noEmit` ajoute ~5-15s au build → acceptable, bloque les régressions
- **[Double validation]** Réponses API déjà validées par Pydantic → le parse Zod est un filet de sécurité
- **[Maintenance]** Schémas Zod à garder synchronisés avec le backend → explicite (c'est le but)
