## Why

Le frontend a **49 hexadécimaux uniques, ~150 objets CSSProperties, 0 design tokens**. Changer la couleur primaire demande de modifier ~12 occurrences en dur. Les styles sont dupliqués (notch ×4, login/register quasi-identiques, 6 variantes de bouton). Un fichier `theme.ts` avec tokens résout la duplication et permet un theming cohérent.

## What Changes

- Créer `src/theme.ts` avec tokens couleurs, espacements, bordures, ombres, typographie
- Migrer les 5 composants les plus impactés (BlockSegments, LoginPage, RegisterPage, HomeNav, EditorHeader) vers les tokens
- Extraire le pattern "notch" en composant partagé `<Notch />`
- Rationaliser les gris textes (8→3 niveaux)

## Capabilities

### New Capabilities
- `design-tokens`: système de tokens + composant Notch partagé

### Modified Capabilities
<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `src/theme.ts` (nouveau), `src/components/ui/Notch.tsx` (nouveau), migration progressive de 5 composants
- **Aucun changement backend**

## Risk

- Changement cosmétique uniquement — 0 impact fonctionnel
- Risque d'oublier de remplacer un hex → mitigation : l'audit a listé toutes les occurrences
