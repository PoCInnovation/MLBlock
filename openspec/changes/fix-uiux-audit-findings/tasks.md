## 1. Contrast tokens (P1)

- [x] 1.1 `frontend/src/theme.ts`: darken accent to `#B8552E` (white text 4.80:1, ≥4.5:1); keep `accentLight` unchanged for decorative use
- [x] 1.2 `frontend/src/theme.ts`: adjust auth color to `#5E64E8` (white text 4.70:1; NOT `#6E7BF5` — that is lighter and fails)
- [x] 1.3 `frontend/src/theme.ts`: lighten `text-dim` to `#948A81` (4.98:1 on `surface2`, ≥4.5:1)
- [x] 1.4 `frontend/src/index.css`: sync `@theme` tokens (accent/auth/text-dim) with `theme.ts`

## 2. Touch targets (P2)

- [x] 2.1 `EditorHeader.tsx`: bump `ghostBtn`/`actionBtn`/icon-button padding so hit area ≥44px, press feedback stays color/opacity
- [x] 2.2 `FlowPalette.tsx`: palette items get min-height 44px (or larger padding) without layout shift
- [x] 2.3 `ConsolePanel.tsx`: console/result tabs get ≥44px height

## 3. Typography floor (P4/P6)

- [x] 3.1 `BlockSegments.tsx`: bump 10/11px styles (labelStyle, fileMeta, removeBtn, errStyle, HoverCard meta) to ≥12px
- [x] 3.2 `card.tsx`, `dropdown-menu.tsx`: card footer and dropdown labels/shortcuts from 11px to ≥12px
- [x] 3.3 `ProjectsPage.tsx`: card meta/buttons from 12.5px to 13px if still below floor (12px floor satisfied)
- [x] 3.4 Replace inline `rgba(255,255,255,.06)`/border literals in FlowPalette/FlowCanvas/EditorHeader/BlockSegments with matching theme tokens

## 4. Form feedback (P8)

- [x] 4.1 `BlockSegments.tsx`: render visible inline French error text under invalid fields (alongside existing border/tooltip)
- [x] 4.2 `ColumnNode.tsx`: remove `outline-none!`, keep visible focus style (border or ring) on the rename input

## 5. Navigation (P9)

- [x] 5.1 Add a skip-to-content link component (visually hidden, shown on focus, `Aller au contenu` → `#main`)
- [x] 5.2 Add `id="main"` to main content wrappers (landing `SiteLayout`, editor, projects, auth pages)

## 6. Landing layout (P5)

- [x] 6.1 `HeroSection.tsx`: vertically center text column vs code-block illustration
- [x] 6.2 `HomeFooter.tsx`: footer copyright padding/spacing
- [x] 6.3 `FeaturesSection.tsx`: consistent card radius, icon optical centering, section spacing rhythm
- [x] 6.4 Visual pass at 1440px + 375px (landing/auth only)

## 7. Verify

- [x] 7.1 Compute contrast ratios for new accent/auth/text-dim pairs (≥4.5:1) and record values
- [x] 7.2 `npm run build` passes
- [x] 7.3 `npm test` passes (58 tests)
- [x] 7.4 Browser smoke: landing (hero alignment, footer), editor header (44px targets), param field invalid value shows inline error, Tab shows skip link + focus ring on rename input
