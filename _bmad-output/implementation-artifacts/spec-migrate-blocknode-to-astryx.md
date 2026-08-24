---
title: 'Migrate BlockNode cards to 100% Astryx'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 1
baseline_commit: '675e6cfcc5c14c869e256e9fc46b01c8d020d945'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** BlockNode cards on the ReactFlow canvas use a local wrapper `ui/card.tsx` (Astryx Card proxied) + custom `div` subcomponents (`CardHeader` grid, `CardTitle`/`CardDescription` divs, `CardAction`, `CardContent` flex) and Radix `Separator`, not pure Astryx primitives. This leaves canvas chrome inconsistent with the 100% Astryx non-canvas UI and forces duplicate styling via `theme.ts`/`index.css` vars.

**Approach:** Make BlockNode 100% Astryx without breaking ReactFlow: replace `ui/card` wrapper usage in `BlockNode.tsx` with direct `Card` from `@astryxdesign/core` (variant/padding/elevation via `categoryColor`), replace custom header/content divs with Astryx `Stack`/`HStack`/`VStack`/`Text`/`Heading` and `Divider`, keep `Handle` (`@xyflow/react`) and `BlockSegments` grid logic untouched. Preserve visual parity (borderTop 3px categoryColor, handles, dragHandle).

## Boundaries & Constraints

**Always:** Keep `@xyflow/react@12` canvas (`FlowCanvas`/`ReactFlowProvider`/`useReactFlow`, `nodeTypes={block:BlockNode}`, `edgeTypes={flow:FlowLink}`); keep `Handle` `Position.Left/Right` with `topFor(i,n)` distribution and `isAmbiguous` stacking logic; keep `dragHandle: '.block-drag-handle'` and `.block-drag-handle` SVG; keep `BlockSegments` param grid (`1fr_auto_1fr`, `Separator` spanning) and `segsToFields`/`resolveColumnsForPath`; keep `theme.ts` `categoryColor` for `borderTop`/`dotStyle` and `handleClassName` `!important`; keep Zustand store (`flowNodes`/`flowEdges`, `commitUndoPoint`, `updateFlowParam`/`removeFlowNode`); keep French labels.

**Ask First:** Changing handle size (`w-[14px]!` → Astryx size), changing `categoryColor`/`theme.color` tokens, replacing `BlockSegments` inputs with Astryx `TextInput`/`Select`/`Field`, ejecting via `swizzle`.

**Never:** Replace `Handle`/`getSmoothStepPath`/`EdgeLabelRenderer` with Astryx; change `FlowCanvas` controls/dagre `arrangeGraph`; introduce new package manager; modify backend; add animation to BlockNode (instant per previous request).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| BlockNode render | `data` with `label`, `categoryColor`, `segs`, `inputs/outputs` | `Card` rendered with `borderTop: 3px solid categoryColor`, header `Heading`+`Text` description, `HStack` drag handle, `VStack` body, Astryx `Divider` horizontal/vertical, `Handle` at `topFor` positions, `BlockSegments` grid intact | Missing `label` → fallback to `type`; missing `categoryColor` → `theme.color.accent`; `Handle` missing port → hide handle |
| Port distribution | `inputs.length=3` ambiguous vs single | Ambiguous: 3 handles distributed via `topFor`; single: one handle at 50% | `isAmbiguous` false → single handle visible, others `opacity 0 pointerEvents none` |
| Card interaction | Click param field | `onUpdate` via `commitUndoPoint` → `updateFlowParam`, no canvas drag | `!onUpdate` → readonly `fieldPill` |
| Build | `npm run build` | `tsc --noEmit && vite build` succeeds, no Tailwind/Astryx layer clash | Layer conflict → Tailwind wins via `@layer` order, log warning |
| Canvas | `/editor` drag block | `FlowCanvas` still renders `@xyflow/react` 12, handles ≥22px, dragHandle works, no regression | Handle miss → toast `classifyEdge` error |

</frozen-after-approval>

## Code Map

- `frontend/src/components/flow/BlockNode.tsx:38` -- `memo(BlockNode)` `NodeProps<Node<BlockNodeData>>` `BlockNodeData{type,label,category,categoryColor,segs,fields,inputs:Port[],outputs:Port[]}` -- JSX: `Card` > `CardHeader` (grid 1fr_auto) `[CardTitle+CardDescription + CardAction drag svg]` > `CardContent` flex > `div.grid grid-cols-[1fr_auto_1fr] gap-x-3` (col1 inputs, col3 outputs, col2 vertical `Separator` `gridRow 1/totalRows+1`, horizontal `Separator` `gridColumn 1/-1`, `BlockSegments` spans, delete btn `col-span-3`). Handles OUTSIDE grid INSIDE Card: `<Handle Position.Left/Right id=p.name className w-[14px]! h-[14px]! rounded-full! bg-accent!/bg-success! border-2! border-surface2! style top/opacity/pointerEvents title>`. Helpers `topFor(i,n)`, `handleClassName/handleFedClassName` `!important`, `inputsClassName/outputsClassName` `text-[11px] font-bold`. State `inputFed/outputFed` via `flowEdges` filter, `columnOptions` via `resolveFlowSourcePath`+`resolveColumnsForPath` for `target_column`.
- `frontend/src/components/ui/card.tsx:1` -- Wrapper shim `Card({size}) -> <AstryxCard padding={size==='sm'?3:4}>` + `ClickableCard` passthrough + subcomponents `CardHeader` `grid 1fr auto gap6 paddingBlock10`, `CardTitle` `fw800 13.5px var(--color-text-light)`, `CardDescription 12px var(--color-text-muted)`, `CardAction justifySelf end`, `CardContent flex 1 1 auto minH0`, `CardFooter borderTop` -- all `div` not Astryx Layout, to be replaced.
- `frontend/src/components/ui/separator.tsx:1` -- Radix `@radix-ui/react-separator` `orientation horizontal|vertical` `bg-border shrink-0` -- used in BlockNode 2 instances (horizontal `gridColumn 1/-1 gridRow sepRow margin 8px 0`, vertical `gridColumn2 gridRow 1/totalRows+1`).
- `frontend/src/theme.ts:1` + `frontend/src/index.css:1` -- Tokens `color.*` (`categoryColor`, `accent`, `success`, `surface2`, `border`, `text*`), `spacing`, `radius`, `font`, `shadow` → `--color-*` vars + Tailwind `bg-*/text-*` utilities; `handleClassName` uses `bg-accent/bg-success` utilities, `!important` to beat xyflow CSS; animations `mlbGlow` etc.
- `frontend/node_modules/@astryxdesign/core/dist/Card/Card.d.ts:31` -- Astryx `Card` `CardProps{variant,padding:SpacingStep, elevation, xstyle, width/height/maxWidth/minHeight}` `CardVariant 'default'|'transparent'|'muted'|'blue'|'cyan'|...` -- direct replacement for wrapper Card, `padding 3|4` maps to 12/16px.
- `frontend/node_modules/@astryxdesign/core/dist/Divider/Divider.d.ts` + `Stack/Stack.d.ts` + `Text/Text.d.ts` + `Heading/Heading.d.ts` -- Astryx primitives for migration: `Divider orientation horizontal|vertical`, `Stack/HStack/VStack` `gap:SpacingStep`, `Text`/`Heading` `variant/size`, available to replace custom header/content divs. Verification via `xds_search`/`xds_get`.
- `frontend/src/components/blocks/BlockSegments.tsx:1` -- Param renderer `grid` `labelCell gridColumn1 justifySelf end` / `fieldCell gridColumn3` `row startRow+i`, `paramSegs filter s.t!=='text'`, branching `sug→datalist`, `sel→select`, `bool→checkbox`, `num→validateSeg isNumeric/text+validBorder`, `list→JSON`, `file→uploadState supabase` -- keep untouched, only chrome around it changes.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/ui/card.tsx` -- delete wrapper indirection: re-export pure Astryx `Card` or remove file and update imports -- keep `size→padding` mapping only if `BlockNode` still uses `size`; otherwise use `padding` directly.
- [x] `frontend/src/components/flow/BlockNode.tsx:75` -- replace `<Card size="sm">` + `<CardHeader>/<CardTitle>/<CardDescription>/<CardAction>/<CardContent>` custom divs with direct `import { Card, Stack, HStack, VStack, Text, Heading, Divider } from '@astryxdesign/core'` -- `Card padding={3} variant="default" elevation={1} style={{borderTop: '3px solid ' + data.categoryColor}}` + `HStack gap={2} justify="space-between"` for header + `Heading`/`Text` for title/description + `VStack` for body; replace 2x `Separator` with `Divider orientation="horizontal|vertical"` preserving `gridColumn`/`gridRow`/`margin` via `xstyle`/`style`; keep `Handle`/`BlockSegments` grid and `topFor` exactly; keep `handleClassName` `!important` utilities.
- [x] `frontend/src/components/flow/BlockNode.tsx` -- verify `CardAction` drag handle `svg.block-drag-handle` stays `cursor-grab` `dragHandle: '.block-drag-handle'` and `onUpdate`/`columnOptions` wiring unchanged.
- [x] `frontend/src/theme.ts` + `frontend/src/index.css` -- ensure no duplicate `Card` token overrides; keep `@layer astryx, tailwind, base` order for `handleClassName` `!important` to still beat xyflow CSS.

**Acceptance Criteria:**
- Given `npm run build`, when building, then `tsc --noEmit && vite build` succeeds and BlockNode renders without Tailwind/Astryx `@layer` clash.
- Given `/editor` with a block, when inspecting `BlockNode` DOM, then root is Astryx `Card` (not wrapper div) with `borderTop` categoryColor, header uses Astryx `Heading`/`Text`/`HStack`, dividers are Astryx `Divider`, handles are still `@xyflow/react` `Handle` at `topFor` positions.
- Given drag, when dragging via `.block-drag-handle`, then node moves and `flowNodes` updates, no regression vs previous wrapper.
- Given `npm test`, when running, then `53` vitest tests still pass (update snapshots if Card snapshots changed).
- Given canvas `/editor` with 2+ blocks, when connecting ports, then `classifyEdge`/`resolveConnection` still works and `Disposer` (dagre) still arranges.

## Spec Change Log

## Design Notes

Astryx graduated customization: `use as-is` → `theme tokens (CSS vars)` → `className` (Tailwind) → `own CSS` → `swizzle` eject. For BlockNode, keep `theme.color.categoryColor` for `borderTop` via inline `style`, keep `handleClassName` `!important` utilities to beat `@xyflow/react/dist/style.css` (not layer). `Divider` `gridColumn`/`gridRow` needs `style` not `xstyle` if spanning custom grid. `Card` `padding={3}` = 12px matches previous `size="sm"`; `elevation={1}` matches `shadow block`.

## Verification

**Commands:**
- `npm --prefix frontend run build` -- expected: `tsc --noEmit` passes, Vite builds `dist`, no CSS layer errors
- `npm --prefix frontend test -- --run` -- expected: 53 passed (update snapshots if Card DOM changed)
- `uv run ruff check .` -- expected: pass (backend untouched)
- `uv run pytest mlblock/tests -q` -- expected: 105 passed

**Manual checks (if no CLI):**
- Open `/editor`, verify BlockNode cards show Astryx Card styling (rounded-xl, shadow, padding) with categoryColor top border, header `Heading`/`Text` readable, `Divider` lines correct, handles at correct `top` %, drag via handle works
- Check `BlockSegments` params still render in `grid` and `columnOptions` for `target_column` sug still shows datalist
- Check `FlowLink` edges still render with `EdgeLabelRenderer` and `Controls`/`MiniMap` untouched

## Suggested Review Order

**Entry — BlockNode 100% Astryx intent**
- Root is Astryx Card with categoryColor borderTop and Heading/Text header
  [`BlockNode.tsx:71`](../../frontend/src/components/flow/BlockNode.tsx#L71)

**Card migration — wrapper removal**
- Pure re-export replaces size→padding shim
  [`card.tsx:1`](../../frontend/src/components/ui/card.tsx#L1)
- Direct Card API padding={3} variant/elevation replaces size="sm"
  [`BlockNode.tsx:72`](../../frontend/src/components/flow/BlockNode.tsx#L72)

**Layout — Astryx primitives**
- HStack/VStack/Heading/Text replace custom CardHeader/Title/Content divs
  [`BlockNode.tsx:78`](../../frontend/src/components/flow/BlockNode.tsx#L78)
- Divider replaces Radix Separator preserving gridColumn/gridRow
  [`BlockNode.tsx:130`](../../frontend/src/components/flow/BlockNode.tsx#L130)

**Canvas invariant — handles & drag**
- Handle Position.Left/Right with topFor/isAmbiguous and !important utilities untouched
  [`BlockNode.tsx:147`](../../frontend/src/components/flow/BlockNode.tsx#L147)
- dragHandle .block-drag-handle and BlockSegments grid wiring retained
  [`BlockNode.tsx:89`](../../frontend/src/components/flow/BlockNode.tsx#L89)

**Tokens & layers**
- categoryColor borderTop and handle bg-accent/bg-success via theme vars
  [`BlockNode.tsx:75`](../../frontend/src/components/flow/BlockNode.tsx#L75)
- Tailwind @layer order preserved for xyflow CSS beat
  [`index.css:1`](../../frontend/src/index.css#L1)

**Peripherals**
- Build and test verification still green
  [`BlockNode.tsx:1`](../../frontend/src/components/flow/BlockNode.tsx#L1)
