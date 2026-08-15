## Why

The UI/UX audit (ui-ux-pro-max priority table, P1–P10) found WCAG contrast failures, sub-44px touch targets, sub-12px text, tooltip-only validation errors, a missing skip link, and landing-page spacing/alignment issues. Contrast values are computed from the actual tokens: white on accent `#D97757` is 3.12:1 (needs 4.5:1 for normal text), white on `#6366F1` is 4.47:1, and `text-dim` on `surface2` is 4.40:1 at 11px.

## What Changes

- **P1 Contrast** (`theme.ts` + callers): darken the accent used for text-on-accent buttons (`Lancer`, `Mes projets`, sample `useBtn`) to ≥4.5:1 with white text; adjust `auth` (login/register/« Ouvrir ») toward ≥4.5:1; lighten `text-dim` so 11px metadata ≥4.5:1 on `surface2`.
- **P2 Touch targets**: header/palette/console icon buttons reach ≥44px hit area (padding, not layout shift).
- **P4/P6 Typography**: enforce a 12px floor for UI text; replace remaining inline `rgba(...)` styles in FlowPalette/FlowCanvas/EditorHeader/BlockSegments with theme tokens where they duplicate tokens.
- **P5 Landing layout**: fix hero button/illustration vertical centering, footer copyright padding, card icon optical centering, radius consistency, section spacing rhythm.
- **P8 Form feedback**: param validation errors move from `title` tooltip to visible inline messages (touch-accessible); restore focus ring on the column rename input (`outline-none!`).
- **P9 Navigation**: add a skip-to-content link for keyboard users.

## Capabilities

### New Capabilities

- `frontend-ui-polish`: visual-quality contract — 12px UI text floor, token-only styling (no ad-hoc hex/rgba duplicates), balanced landing layout, and visible inline form-validation errors that work without hover.

### Modified Capabilities

- `ui-a11y`: extends the existing contrast requirement (accent/auth buttons ≥4.5:1, `text-dim` ≥4.5:1 on dark surfaces), adds ≥44px touch targets, a skip-to-content link, and preserves a visible focus ring on every interactive control.
