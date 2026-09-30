# Tasks: Astryx to Shadcn UI Migration

## 1. Install & Configure Shadcn UI Primitives

- [x] 1.1 Add core Shadcn components via CLI (`card`, `badge`, `separator`, `input`, `checkbox`, `select`, `toggle-group`, `hover-card`, `dialog`, `drawer`, `sonner`)
- [x] 1.2 Define complete WCAG 2.1 AA compliant Light & Dark CSS tokens in `src/index.css` with primary accent `#D97757` and Fredoka font
- [x] 1.3 Configure Sonner toaster provider in root layout
- [x] 1.4 Build accessible `ThemeToggle` component in `src/components/ui/theme-toggle.tsx` with Lucide `Sun` / `Moon` icons and localStorage persistence

## 2. Migrate Marketing, Auth & Static Pages

- [x] 2.1 Migrate `SiteLayout.tsx`, `HomeNav.tsx`, and `HomeFooter.tsx` (replace Astryx Stack and Button; integrate `ThemeToggle` into navigation)
- [x] 2.2 Migrate `HeroSection.tsx`, `HeroBlockStack.tsx`, and `FeaturesSection.tsx` (replace Astryx Button, Text, Heading)
- [x] 2.3 Migrate `LoginPage.tsx` and `RegisterPage.tsx` (replace Astryx Card, TextInput, Button)
- [x] 2.4 Migrate `AboutPage.tsx`, `HowItWorksPage.tsx`, `ProjectsPage.tsx`, `cours.tsx`, and `cours.$slug.tsx`

## 3. Migrate Modals, Dialogs & Overlays

- [x] 3.1 Migrate `dialog.tsx` and `ExportModal.tsx` to Shadcn Dialog primitive
- [x] 3.2 Migrate `TemplateModal.tsx` and `SampleDataModal.tsx` (replace Astryx Card, Button, Badge, ToggleGroup)
- [x] 3.3 Migrate `ConverterDialog.tsx`, `UnsavedChangesDialog.tsx`, and `EditorUnavailableModal.tsx`
- [x] 3.4 Replace Astryx `useToast` with Shadcn `sonner` (`toast.success`, `toast.error`) in `Toast.tsx` and stores

## 4. Migrate Editor Header, Canvas, Palette & Blocks

- [x] 4.1 Migrate `EditorHeader.tsx` (replace Astryx HStack, IconButton, Button, TextInput with Shadcn equivalents; integrate `ThemeToggle`)
- [x] 4.2 Migrate `FlowPalette.tsx` (replace Astryx ClickableCard, Badge, Switch, ToggleGroup, TextInput)
- [x] 4.3 Migrate `BlockSegments.tsx` (replace Astryx TextInput, NumberInput, CheckboxInput, Selector, FileInput, HoverCard)
- [x] 4.4 Migrate `BlockNode.tsx` and `SuperBlockNode.tsx` (replace Astryx Card, Badge, Divider, Text, Heading)
- [x] 4.5 Migrate `SuperBlockBodies.tsx`, `JournalPanel.tsx`, and `ResultsPanel.tsx`
- [x] 4.6 Migrate `FlowCanvas.tsx` (replace Astryx BottomSheet with Shadcn Drawer)
- [x] 4.7 Refactor all remaining components to eliminate hardcoded hex/rgb colors, enforcing centralized theme variables (`bg-background`, `text-foreground`, `border-border`, `bg-accent`, `text-primary`)

## 5. Remove Astryx & StyleX Dependencies, Verify Full Suite

- [x] 5.1 Uninstall `@astryxdesign/core`, `@astryxdesign/theme-neutral`, and `@stylexjs/stylex` from `frontend/package.json`
- [x] 5.2 Remove `@stylex;` and Astryx layers from `src/index.css`
- [x] 5.3 Audit whole codebase for any remaining `@astryxdesign` imports
- [x] 5.4 Run frontend tests (`pnpm test`), lint (`pnpm exec eslint . --max-warnings 0`), and production build (`pnpm run build`)
- [x] 5.5 Run automated and visual WCAG 2.1 AA contrast checks across light and dark modes (canvas, nodes, palettes, and landing pages)
