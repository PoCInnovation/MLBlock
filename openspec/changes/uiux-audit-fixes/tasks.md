## 1. Accessibilité & contraste

- [x] 1.1 `index.css` : media query `prefers-reduced-motion: reduce` (neutralise animations + transitions, itération forcée à 1)
- [x] 1.2 `theme.ts` : `textDim` `#6f665e` → `#8a8178` (≈4:1 sur surface2)

## 2. Sémantique & états vides

- [x] 2.1 `BlockSegments` : « Réessayer » → `<button type="button">` (style `errStyle` conservé, reset natif)
- [x] 2.2 `BlockSegments` : bouton CSV → `<button type="button">` (style `fileBtn` conservé)
- [x] 2.3 `FlowPalette` : message « Aucun bloc ne correspond » quand recherche + filtres ne matchent rien

## 3. Vérification

- [x] 3.1 Build frontend (`tsc --noEmit && vite build`)
- [x] 3.2 Smoke navigateur : reduced-motion émule (`emulateMedia`/eval `matchMedia`) → animations stoppées ; contraste textDim calculé ≥4:1 ; Tab+Entrée sur le bouton CSV ouvre le sélecteur ; recherche sans résultat → message
