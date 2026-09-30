# Proposal: Migrate Astryx & StyleX to Shadcn UI & Pure Tailwind v4

## Why

MLBlock's frontend currently maintains a conflicting hybrid styling architecture: Astryx (`@astryxdesign/core`) compiles internal component styles through StyleX, while pages and layouts use Tailwind CSS v4. This duality creates specificity wars across CSS `@layer` boundaries, triggers silent token clashes (such as `--spacing-sm` turning `max-w-sm` into 8 pixels), slows down builds with dual compilers, and introduces maintenance overhead.

Migrating completely from Astryx/StyleX to Shadcn UI and pure Tailwind CSS v4 resolves the dual-engine styling conflict, removes the proprietary Astryx abstraction, and unifies the codebase around a single standard design token system while preserving 100% of the existing visual identity, colors, and layout ergonomics.

## What Changes

- **Component Primitives Replacement**: Replace all 14 Astryx components (`Button`, `IconButton`, `Card`, `ClickableCard`, `Badge`, `Divider`, `TextInput`, `NumberInput`, `CheckboxInput`, `Selector`, `FileInput`, `ToggleButtonGroup`, `HoverCard`, `BottomSheet`, `Dialog`, `Toast`) with Shadcn UI equivalents (`button`, `card`, `badge`, `separator`, `input`, `checkbox`, `select`, `toggle-group`, `hover-card`, `drawer`, `dialog`, `sonner`).
- **Layout Primitives Cleanup**: Replace Astryx layout wrappers (`HStack`, `VStack`, `Stack`, `Grid`) with semantic HTML elements styled with standard Tailwind v4 flex and grid utilities (`flex`, `flex-col`, `gap-*`, `grid`).
- **Typography & Iconography Unification**: Replace Astryx `Heading`, `Text`, and `<Icon icon={...} />` with semantic HTML headings/paragraphs and direct `lucide-react` icon elements.
- **Dependency Removal**: Completely uninstall `@astryxdesign/core`, `@astryxdesign/theme-neutral`, and `@stylexjs/stylex`.
- **Theme & Token Alignment**: Map MLBlock design tokens (backgrounds `#171311`, surfaces `#1f1916`-`#221c19`, accent `#B8552E`, status, and stages S0..S4) cleanly into CSS custom properties referenced by Tailwind v4 `@theme inline` and Shadcn components, with strict `data-theme="dark"` support.
- **Strict Visual Invariance**: Ensure zero visual regression across the Landing page, Course pages, Auth pages, Flow Canvas, Blocks, and Super-Blocks.

## Capabilities

### New Capabilities
- `ui-components`: Unified UI component design system based on Shadcn UI (Radix primitives + Tailwind CSS v4) replacing Astryx and StyleX across the entire frontend.

### Modified Capabilities
*(None: backend capabilities, API endpoints, DAG execution, validation, and pipeline document schemas remain unchanged).*

## Impact

- **Dependencies**: Removes `@astryxdesign/core`, `@astryxdesign/theme-neutral`, and `@stylexjs/stylex`. Adds Radix primitives and Vaul (for drawer) through Shadcn UI components.
- **Build & Tooling**: Eliminates StyleX Babel compilation steps; simplifies `vite.config.ts` to standard React + Tailwind v4 + TanStack Start.
- **Maintainability**: Components are self-contained in `src/components/ui/`, fully editable, and decoupled from any external blackbox UI library.
