## Context

See proposal.md — Why. Current state (verified in audit): tokens in `theme.ts` + `index.css` `@theme`; accent `#D97757` (white text 3.12:1), auth `#6366F1` (4.47:1), `text-dim` `#8a8178` (4.40:1 on `surface2` at 11px). Small text: 10–11.5px in BlockSegments, card footer, dropdown, ProjectsPage meta. Inline `rgba()` literals duplicate tokens in FlowPalette/FlowCanvas/EditorHeader/BlockSegments. Validation errors are `title`-tooltip only. Column rename input uses `outline-none!`. No skip link. Landing hero/card/footer spacing issues (visual audit).

## Goals / Non-Goals

**Goals:**
- All white-on-accent/auth buttons ≥4.5:1; `text-dim` ≥4.5:1 on `surface2`
- ≥44px hit areas on compact icon controls, no layout shift on press
- ≥12px UI text floor
- Visible inline param validation errors; focus ring on the rename input
- Skip-to-content link; landing layout balance

**Non-Goals:**
- Re-theming the app (palette stays brand orange/purple)
- Full responsive mobile pass on the editor canvas (desktop-first tool; only landing/auth get layout fixes)
- Replacing lucide icons or adding an icon system
- GSAP/animation work (reduced-motion already handled)

## Decisions

**Token-level contrast fixes in `theme.ts`** — single source, all callers follow. Add a distinct token for text-on-accent (or darken `accent` only where white text sits): darken accent to `#B8552E` (white 4.80:1), auth to `#5E64E8` (white 4.70:1; note `#6E7BF5` would be *lighter* and drop contrast), lighten `text-dim` to `#948A81` (4.98:1 on surface2). Keep `accent-light` for borders/glows unchanged so the brand feel survives. Verified ratios: `#C96A47` only reaches 3.73:1 — rejected.

**Hit-area expansion via padding, not size changes** — compact header buttons (`ghostBtn` 8px padding + 16px icon ≈34px) get symmetric padding to ≥44px; palette items and console tabs get min-height/min-width. Press feedback stays color/opacity (no transform that shifts layout).

**12px floor enforced at the token/usage level** — bump 10/11px values to 12px in the listed components; decorative-only 10px (file remove button) either grows to 12 or gets a larger hit target while glyph stays small (large-glyph 3:1 rule covers icon contrast).

**Inline errors in BlockSegments** — reuse the existing `validBorder` state to also render a small French error `<span>` under the field; keep the HoverCard description (info) separate from error (validation).

**Skip link** — one component in `SiteLayout`/app root: visually-hidden link shown on `:focus` (`Aller au contenu`), targeting `#main` (add `id="main"` to page wrappers).

**Landing fixes** — CSS-only: align hero grid items (center), footer padding, card radius/icon alignment, section spacing — no layout restructure.

## Risks / Trade-offs

- Darkening accent/auth shifts brand feel slightly; mitigated by keeping `accent-light` for decorative surfaces and verifying the new ratios against the audit's computed values.
- Larger hit areas on the editor header consume horizontal space; acceptable (header has room), verified visually.
- Token swap of inline `rgba` literals is mechanical but touches several files — risk of subtle surface tint changes; mitigated by mapping literals to the closest existing token (audit listed exact locations).
- `text-dim` lightening reduces hierarchy gap to `text-muted`; acceptable trade for 4.5:1.
