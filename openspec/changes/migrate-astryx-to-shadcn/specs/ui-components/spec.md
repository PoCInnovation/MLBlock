# Spec Delta: UI Components System

## Purpose

The UI components system provides the foundational design primitives, form inputs, dialogs, drawers, feedback notifications, and block cards that power MLBlock's visual programming canvas and user interface, strictly conforming to the project's visual identity with zero StyleX dependencies.

## ADDED Requirements

### Requirement: Visual Invariance and Design Token Preservation

The design system MUST maintain identical visual styling across all views (dark mode `#171311` canvas and body, `#1f1916`-`#221c19` card surfaces, primary accent `#D97757`, stage colors S0..S4, Fredoka headers, and Nunito body text).

#### Scenario: Visual inspection of landing, auth, and editor pages
- **WHEN** any page (home, login, register, courses, editor) is loaded in the browser
- **THEN** background colors, border radii, text colors, and font families match the existing visual theme without layout shifts or crushed container widths.

#### Scenario: Block card appearance on canvas
- **WHEN** a standard block or super-block is rendered on the ReactFlow canvas
- **THEN** it renders with its stage accent badge, category indicator, input/output port sockets, and border/shadow styling visually indistinguishable from the baseline.

### Requirement: Interactive Form Elements Parity

All parameter input controls within blocks and forms MUST provide identical input ergonomics and two-way binding.

#### Scenario: Numeric, text, and select parameter manipulation
- **WHEN** a user modifies a number input, text input, dropdown selection, or boolean toggle on a block node
- **THEN** the value update triggers the store change and commits an undo point identically to previous Astryx behavior.

#### Scenario: File upload and sample dataset binding
- **WHEN** a user selects or drags a CSV/image file or selects a sample dataset
- **THEN** the input accepts the file, shows upload/error/ready state, and updates node parameters without requiring proprietary Astryx FileInput.

### Requirement: Modal, Drawer, and Overlay Interactions

Overlay dialogs, drawers, and context menus MUST provide smooth keyboard, focus-trapped, and backdrop-dismissible interaction.

#### Scenario: Sequential SuperBlock drawer opening
- **WHEN** a user clicks on a Sequential SuperBlock node or sub-pipeline trigger
- **THEN** a bottom drawer opens with smooth transition, displaying the contained blocks and stage indicators, and closes on backdrop click or Escape.

#### Scenario: Template picker and export dialogs
- **WHEN** a user clicks "Templates" or "Export" in the editor header
- **THEN** the corresponding modal opens with proper focus trap, allows template selection or code download, and closes without console errors.

### Requirement: Non-blocking Notification System

User actions triggering notifications (pipeline save, run errors, exports) MUST display non-intrusive toast feedback.

#### Scenario: Save and execution feedback
- **WHEN** a pipeline is saved or a job is triggered
- **THEN** a toast notification appears with status message and duration, automatically dismissing without blocking user interactions on the canvas.

### Requirement: Dual-Theme System & WCAG 2.1 AA Contrast Compliance

The interface MUST support both Light Mode and Dark Mode with standard WCAG 2.1 AA contrast compliance (minimum 4.5:1 ratio for normal body text and 3:1 for large text/interactive borders) using centralized CSS tokens without independent per-component theming or hardcoded color literals.

#### Scenario: Dark mode contrast verification
- **WHEN** dark mode is active (`data-theme="dark"` or `.dark`)
- **THEN** text foreground (`#F0E9E3`), muted text, and interactive elements satisfy a contrast ratio ≥ 4.5:1 against surfaces (`#171311`, `#1F1916`, `#241E1A`) and canvas (`#1B1613`), with accent `#D97757` distinctly highlighted.

#### Scenario: Light mode contrast verification
- **WHEN** light mode is active (`data-theme="light"`)
- **THEN** the warm cream palette (`#FAF7F5` background, `#FFFFFF` cards, `#211B17` text, `#5C524A` muted text) renders with contrast ratios ≥ 4.5:1 for text, and all stage badges, ports, and edges remain clearly legible and distinguished.

#### Scenario: Zero hardcoded colors in component code
- **WHEN** component source code (`src/components/**/*.tsx`) is inspected
- **THEN** zero raw hex/rgb color strings exist in component definitions; all colors are consumed strictly via CSS variables (`var(--...)`) or theme-backed Tailwind utility classes (`bg-background`, `text-foreground`, `border-border`, `bg-accent`, `text-primary`).

### Requirement: Theme Switcher Control

The application MUST provide an accessible theme toggle button allowing users to switch between Light Mode and Dark Mode.

#### Scenario: Toggling theme via navigation button
- **WHEN** the user clicks the theme toggle button in the header or navigation bar
- **THEN** the active mode switches between light and dark, updating document attributes (`data-theme` and `class="dark"`), persisting preference in local storage, and dynamically displaying the Lucide `Sun` icon in dark mode and `Moon` icon in light mode.
