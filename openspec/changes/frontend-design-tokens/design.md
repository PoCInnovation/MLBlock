## Context

Frontend 100% inline styles avec 49 hex, pas de tokens, pas de CSS. L'audit a identifié les couleurs réelles du thème et les patterns dupliqués.

## Goals / Non-Goals

**Goals:**
- Créer `theme.ts` avec les tokens basés sur l'usage réel du code
- Migrer 5 composants vers les tokens
- Extraire `<Notch />` comme composant partagé

**Non-Goals:**
- Ne pas migrer les 29 composants d'un coup (scope limité à 5)
- Ne pas ajouter Tailwind/shadcn (changement d'approche trop lourd)
- Ne pas toucher aux pages landing (HeroBlockStack, FeaturesSection, etc.)

## Decisions

1. **Format `theme.ts`** : objet plat `export const theme = { ... }` avec sous-objets sémantiques
   ```ts
   export const theme = {
     color: {
       bg: '#171311',
       surface: '#1f1916',
       accent: '#D97757',
       text: '#f0e9e3',
       textMuted: '#b7ada3',
       textDim: '#6f665e',
       error: '#ef4444',
       success: '#22c55e',
     },
     spacing: {
       xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 48,
     },
     radius: {
       sm: 7, md: 10, lg: 14, xl: 20,
     },
     font: {
       heading: "'Fredoka', sans-serif",
       body: "'Nunito', system-ui, sans-serif",
     },
     shadow: {
       block: '0 2px 0 rgba(0,0,0,.18)',
       btn: '0 3px 0 rgba(0,0,0,.25)',
     },
   }
   ```

2. **Migration progressive** — 5 composants les plus faciles :
   - `BlockSegments.tsx` (déjà 9 constantes nommées → remplacer par theme)
   - `LoginPage.tsx` + `RegisterPage.tsx` (presque identiques, fusion des tokens)
   - `HomeNav.tsx` (1 fonction linkStyle → tokens)
   - `EditorHeader.tsx` (2 constantes → tokens)

3. **Composant `<Notch />`** :
   ```tsx
   // src/components/ui/Notch.tsx
   type NotchProps = { color: string; side: 'top' | 'bottom'; left?: number }
   ```
   Remplacer les 8 occurrences dans ScriptBlock, PaletteBlock, HatBlock, HeroBlockStack

## Risks / Trade-offs

- **[Régressions visuelles]** Les migrations manuelles peuvent décaler de 1px → mitigation : build frontend + vérification visuelle
- **[Scope creep]** "Tant qu'on y est" — on migre 5 composants, pas 29
