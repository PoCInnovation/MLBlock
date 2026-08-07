## Context

Audit UI/UX terminé (skill ui-ux-pro-max, priorités 1-10) : les règles critiques sont respectées (icônes Lucide, `:focus-visible` global, scrims 55%, feedback submit, contrastes principaux ≥ 4.5:1, z-index ordonnés). 4 écarts relevés avec mesures :
1. `prefers-reduced-motion` : 0 occurrence — animations (`mlbGlow`, `mlbFloat`, `mlbBlink`, `mlbSpin`) et transitions 150ms tournent toujours.
2. Contraste `textDim #6f665e` sur `surface2 #221c19` = **2.99:1** (< 3:1, échoue même le seuil UI large) — usages : checklist register non cochée, compteur FlowPalette.
3. `BlockSegments` : « Réessayer » (l.263) et bouton CSV (l.280) en `<span onClick>` — non focusables, pas de `role`.
4. Recherche palette sans résultat : liste vide silencieuse (aucun message).

## Goals / Non-Goals

**Goals:**
- Neutraliser animations + transitions quand `prefers-reduced-motion: reduce`
- Contraste du texte secondaire ≥ 4:1 sur les surfaces dark (token `textDim`)
- Contrôles d'upload sémantiques (`<button type="button">`), focusables et actionnables au clavier
- Message d'état vide dans la recherche de la palette

**Non-Goals:**
- Responsive mobile de l'éditeur / projets / auth (gap documenté, choix desktop-first — change séparée si cible mobile)
- Tailles d'icônes unifiées (cosmétique, LOW)
- Toucher aux contrastes déjà OK (`textMuted`, `textLight`, statuts)

## Decisions

### D1 — `prefers-reduced-motion` global (CSS pur)
Dans `index.css`, une media query qui neutralise tout :
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
Couvre les keyframes (`mlb*`) ET les transitions inline (150ms sur boutons/cartes). Aucun JS requis — les icônes animées (spinners `mlbSpin`) s'arrêtent aussi (itération forcée à 1).

### D2 — Contraste `textDim`
Token `textDim: '#6f665e'` → `'#8a8178'` (ratio ≈4.1:1 sur `surface2`, ≈4.6:1 sur `bg`). Aucun autre changement : les usages (checklist non cochée, compteur palette, éléments décoratifs) restent hiérarchiquement discrets par rapport à `textMuted #b7ada3` (8.4:1).

### D3 — Contrôles d'upload sémantiques
Dans `BlockSegments` :
- « Réessayer » : `<span onClick>` → `<button type="button" onClick>` — style hérité de `errStyle` (reset border/background/padding pour ne pas changer le rendu) + `cursor: pointer`.
- Bouton CSV : `<span onClick>` → `<button type="button" onClick>` — style `fileBtn` hérité + reset (border/background déjà présents dans `fileBtn`).

### D4 — État vide de la palette
Dans `FlowPalette` (ou `BlockPalette` selon l'implémentation réelle) : quand la liste filtrée est vide et qu'une recherche/filtre est actif → afficher « Aucun bloc ne correspond » (couleur `textMuted`, padding cohérent).

## Risks / Trade-offs

- **`textDim` éclairci** : impact visuel sur les éléments décoratifs qui l'utilisaient — léger changement de rendu assumé (lisibilité > discrétion).
- **reduced-motion global** : neutralise aussi les transitions hover — comportement voulu (accessibilité avant polish).
- **`<button>` au lieu de `<span>`** : le style par défaut des boutons (fond, bordure) doit être reset explicitement dans les styles existants pour un rendu identique — vérifier `errStyle`/`fileBtn` (ils n'ont pas de border/background natif, `fileBtn` en a déjà un custom).
