## Why

L'audit UI/UX (skill ui-ux-pro-max, priorités 1-10) a relevé 4 manques concrets : aucune prise en compte de `prefers-reduced-motion` (accessibilité), une paire de couleurs sous le seuil de contraste WCAG (`textDim` sur surface2 = 2.99:1), 2 éléments cliquables non-sémantiques (`span onClick` non focusables au clavier), et une recherche de palette sans état vide (liste silencieusement vide). Le reste de l'audit est vert (icônes, focus, feedback, scrims, contrastes principaux).

## What Changes

- **`prefers-reduced-motion` respecté** : media query globale qui neutralise animations et transitions (`mlbGlow`, `mlbFloat`, `mlbBlink`, `mlbSpin` + transitions inline) quand l'utilisateur demande moins de mouvement.
- **Contraste `textDim` corrigé** : éclaircissement du token (`#6f665e` → ≈`#8a8178`, ratio ≈4:1 sur surface2) — les usages (checklist register non cochée, compteur de la palette) restent discrets mais lisibles.
- **Sémantique des uploads CSV** : « Réessayer » et le bouton CSV passent de `<span onClick>` à `<button type="button">` (focusable clavier, styles identiques).
- **État vide de la recherche palette** : message « Aucun bloc ne correspond » quand la recherche + filtres ne renvoient rien.

## Capabilities

### New Capabilities
- `ui-a11y`: accessibilité — motion réduit respecté (`prefers-reduced-motion`), contraste du texte secondaire, contrôles sémantiques focusables, états vides explicites.

### Modified Capabilities
<!-- Aucune spec existante modifiée — capability purement nouvelle. -->

## User Impact

- Les utilisateurs avec `prefers-reduced-motion` ne voient plus d'animations (aucun changement visuel pour les autres).
- Le texte secondaire (cases de checklist, compteurs) devient lisible sans être criard.
- Le clavier peut activer « Réessayer » et le bouton CSV (Tab + Entrée).
- Une recherche sans résultat dans la palette explique ce qui se passe.
