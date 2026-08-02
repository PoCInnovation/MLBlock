## Why

Le frontend a 3 vrais bugs TypeScript qui passent en prod (Vite ne type-check pas) + pas de validation runtime. On ajoute `tsc --noEmit` au build pour attraper les bugs, on corrige les 2 bugs de payload, et on ajoute Zod pour la validation runtime des forms et réponses API.

## What Changes

- **`tsc --noEmit` ajouté au build** : le typecheck devient partie du pipeline, les erreurs TS bloquent le build
- **Fix payload edges** (`useBlockRunner.ts`) : `sourcePort`/`targetPort` → `source_port`/`target_port` (le backend attend du snake_case, les edges du mode avancé étaient perdus silencieusement)
- **Fix `flowToLinear`** (`flowConversion.ts`) : mapping correct des segments, suppression de l'accès aux propriétés inexistantes
- Ajout de `zod` comme dépendance frontend
- Schémas Zod pour les forms login/register avec messages français
- Schémas Zod pour les réponses API (`catalog`, `validate`) — parse au runtime au lieu de `as Type`
- Types dérivés : `z.infer<typeof schema>`

## Capabilities

### New Capabilities
- `zod-validation`: schémas Zod pour forms et réponses API, types dérivés

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `zod` (+~15KB), `tsc --noEmit` dans le build, `useBlockRunner.ts`, `flowConversion.ts`, `client.ts`, forms, `types/catalog.ts`
- **Aucun changement backend**
- **Build**: `npm run build` devient plus lent (typecheck) mais bloque les régressions
