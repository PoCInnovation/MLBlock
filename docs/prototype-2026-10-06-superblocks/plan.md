# Drawer unifié SuperBlocks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brancher le Drawer unifié sur le catalogue backend (15 SuperBlocks FR, engines, transitions) avec sheets config/compat, sans mock ni code mort.

**Architecture:** Parsing catalogue étendu → store (+2 sheets) → sheets add/config/compat → suppression du legacy → dégradés. Chaque tâche livre un incrément testable.

**Tech Stack:** React 19, shadcn/ui (Card/Badge/Checkbox/Switch/Select/ToggleGroup/Button/Drawer/Dialog), Zustand, @xyflow/react, vitest, `pnpm`.

**Spec:** `docs/prototype-2026-10-06-superblocks/spec.md` (+ `prototype.html` pour le visuel carte BB). Les implémenteurs lisent les deux.

## Global Constraints

- Zéro mock : toutes les données viennent de `GET /api/catalog`.
- 100 % components shadcn existants, rien codé à la main.
- Titres cartes depuis `superblocks[].title` (FR) — jamais `blocks[].label` (anglais).
- Enfants matérialisés `{id: \`${nodeId}.${type}\`, type, params}`.
- Tap-targets ≥ 44px, `prefers-reduced-motion` respecté, sombre/clair via variables.
- Aucune modif backend requise.

## Review Focus

- Payload catalogue réel (98 blocs) avec `engine`/`macro_stage` manquants sur un bloc → fallback `engine_of_block` côté parsing, jamais de crash.
- Enfant par défaut dont le type n'est plus au catalogue → exclu avec toast, pas de nœud fantôme.
- Tap vs drag sur un Handle de sortie → tap ouvre `'compat'`, drag connecte (seuil 8px, cf. `tapGuard`).
- Port déjà connecté + ajout compat → fan-out append-only, arêtes existantes intactes.
- `Select` shadcn en overlay : pas de resize de page, ferme au tap extérieur.

---

### Task 1: Parsing catalogue (schémas + mapping)

**Files:**
- Modify: `frontend/src/schemas/api.ts:19-49`
- Modify: `frontend/src/api/client.ts:61-127`
- Modify: `frontend/src/types/catalog.ts:13-40`

**Interfaces:**
- Consumes: payload `GET /api/catalog` (spec §4).
- Produces: `BlockDef += { engine: string; macro_stage?: number; macro_stage_name?: string; is_transition?: boolean }`, `InternalCatalog += { superblocks: SuperBlockEntry[]; macro_stages?: StageInfo[] }`, `SuperBlockEntry = { id: string; title: string; macro_stage: number; engine: string; children: string[] }`.

- [ ] **Step 1: Write the failing test** in `frontend/src/api/catalog-parse.test.ts`: parse un payload miniature (2 blocs + `superblocks` + `macro_stages`, un bloc sans `engine`) via `catalogSchema` puis mapping ; assert `blocks[x].engine`, `superblocks[0].children == ["load_csv"]`, fallback engine défini.
- [ ] **Step 2: Run it** — `pnpm exec vitest run src/api/catalog-parse.test.ts`. Expected: FAIL (clés droppées).
- [ ] **Step 3: Implement** — étendre `blockSchema` (+`engine`, `macro_stage`, `macro_stage_name`, `is_transition` optionnels), `catalogSchema` (+`superblocks`, `macro_stages`), mapper dans `fetchCatalog`, typer dans `types/catalog.ts`.
- [ ] **Step 4: Re-run test** — Expected: PASS. Puis `pnpm exec tsc --noEmit`.
- [ ] **Step 5: Commit** — `git add frontend/src/schemas/api.ts frontend/src/api/client.ts frontend/src/types/catalog.ts frontend/src/api/catalog-parse.test.ts`.

### Task 2: Store (+2 sheets)

**Files:**
- Modify: `frontend/src/store/useAppStore.ts:58-59`

**Interfaces:**
- Consumes: Task 1 (`SuperBlockEntry`).
- Produces: `activeSheet: 'add' | 'config' | 'compat' | 'inspect' | 'journal' | null`, `configTarget: string | null` (superblock id), `compatSource: { nodeId: string; port: string } | null`, setters.

- [ ] **Step 1: Write the failing test** in `frontend/src/store/sheets.test.ts`: `setActiveSheet('config')`, `setConfigTarget('tabular_data_pipeline')`, `setCompatSource({nodeId:'n1',port:'out_1'})` puis asserts.
- [ ] **Step 2: Run it** — Expected: FAIL (setters inconnus).
- [ ] **Step 3: Implement** — 3 champs + setters Zustand (suivre le pattern `setActiveSheet`).
- [ ] **Step 4: Re-run + tsc** — Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 3: Helpers purs (enfants par défaut + compat)

**Files:**
- Create: `frontend/src/utils/superblocks.ts`
- Test: `frontend/src/utils/superblocks.test.ts`

**Interfaces:**
- Consumes: `InternalCatalog` (Task 1).
- Produces: `defaultChildren(sb: SuperBlockEntry, catalog: InternalCatalog, nodeId: string) -> PipelineNode[]` (résout les defaults depuis `blocks[type].params`, exclut les types absents) ; `compatibleBlocks(catalog, outDtype: string, graph) -> { compatible: string[]; convertible: string[] }` (via `classifyEdge`, exclut le nœud source).

- [ ] **Step 1: Write failing tests** — enfants avec ids `${nodeId}.${type}`, enfant fantôme exclu ; compat classe `pd.DataFrame` → `load_csv`-like en compatible et `torch.Tensor` en convertible.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** — 2 fonctions pures (voir spec §4).
- [ ] **Step 4: Re-run + tsc** — Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 4: Sheet `'add'` branchée catalogue

**Files:**
- Modify: `frontend/src/components/flow/FlowCanvas.tsx:407-446`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: 3 sections macro-étapes, `ToggleGroup` moteur, `Switch` avancé (15 cartes vs 98 blocs), carte BB (titre FR + `Badge outline` moteur + icône catégorie + liseré moteur + chevron), tap → `setConfigTarget` + sheet `'config'`.

- [ ] **Step 1: Implement** — remplacer la grille `SUPER_BLOCK_REGISTRY` par `catalog.superblocks`, grouper par `macro_stage`, filtre moteur `useMemo`, `Switch` → liste `catalog.blocks` non-`advanced`/tous.
- [ ] **Step 2: Verify** — `pnpm exec tsc --noEmit` + `pnpm test` (aucune régression), contrôle visuel vs `prototype.html` (variante A/BB).
- [ ] **Step 3: Commit.**

### Task 5: Sheet `'config'` + `buildNode` enfants

**Files:**
- Create: `frontend/src/components/flow/SuperBlockConfigSheet.tsx`
- Modify: `frontend/src/components/flow/FlowCanvas.tsx:195-219` (`buildNode`), `:390-453` (sheet `'config'`)

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: sheet config (description, `Checkbox` sous-options défauts cochés, params via `BlockSegments`, bouton Ajouter → `addFlowNode` avec `children` + `commitUndoPoint` + bascule `'inspect'`) ; `buildNode` étendu à tout SuperBlock catalogue.

- [ ] **Step 1: Implement `buildNode`** — `children = defaultChildren(...)` pour tout type présent dans `catalog.superblocks`.
- [ ] **Step 2: Implement `SuperBlockConfigSheet`** — shadcn `Checkbox`/`Button`, `BlockSegments` existant, rendu params `sel/sug→Select`, `num→hint`, libre→badge (spec §3).
- [ ] **Step 3: Verify** — tsc + tests + `toServerPayload` contient les `children` (couvert par `pipelineDocument`, vérifier à la main en console).
- [ ] **Step 4: Commit.**

### Task 6: `'inspect'` étendu + sheet `'compat'`

**Files:**
- Modify: `frontend/src/components/flow/FlowCanvas.tsx:472-538` (`NodeInspector`), `:350` (tap port), `:448` (sheet `'compat'`)
- Create: `frontend/src/components/flow/CompatSheet.tsx`

**Interfaces:**
- Consumes: Tasks 2-3.
- Produces: `NodeInspector` += toggles enfants (`updateNodeChildren`) + lien "voir compatibles" ; tap Handle sortie → `'compat'` (tap-vs-drag seuil 8px, cf. `tapGuard`) ; `CompatSheet` liste `compatibleBlocks`, tap → ajoute + arête append-only (`commitUndoPoint`), `ConverterDialog` si convertible.

- [ ] **Step 1: Implement `NodeInspector`** — section sous-options + lien compat.
- [ ] **Step 2: Implement tap-port** — `onConnectStart`/`onConnectEnd` sans drag → `setCompatSource` + sheet ; drag normal inchangé.
- [ ] **Step 3: Implement `CompatSheet`** — ajout append-only, fan-out autorisé, arêtes existantes intactes.
- [ ] **Step 4: Verify** — tsc + tests + essai manuel (port déjà connecté → 2e arête, undo OK).
- [ ] **Step 5: Commit.**

### Task 7: Dégradés transitions + tokens

**Files:**
- Modify: `frontend/src/index.css`, `frontend/src/components/flow/FlowLink.tsx`, `frontend/src/components/flow/BlockNode.tsx`

**Interfaces:**
- Consumes: Task 1 (`is_transition`, `engine`).
- Produces: 5 tokens `--color-engine-*` (valeurs spec §5), nœuds `is_transition` en `linear-gradient(135deg, in→out)`, arêtes inter-moteurs en SVG `linearGradient` (ids `grad-<in>-to-<out>`).

- [ ] **Step 1: Implement** — tokens + classe transition + `linearGradient` dans `FlowLink` (couleurs = engines des ports source/cible).
- [ ] **Step 2: Verify** — tsc + contrôle sombre/clair sur `df_to_tensor` et `module_to_policy`.
- [ ] **Step 3: Commit.**

### Task 8: Suppression du legacy, zéro mort

**Files:**
- Delete: `frontend/src/components/flow/superBlockRegistry.ts`, `frontend/src/components/flow/SuperBlockBodies.tsx`
- Modify: `frontend/src/components/flow/BlockNode.tsx:192-197`, `frontend/src/components/flow/SuperBlockNode.tsx`, `FlowCanvas.tsx` (imports)

**Interfaces:**
- Consumes: Tasks 4-6.
- Produces: rendu unifié piloté catalogue (ports hérités du bloc), `SuperBlockNode` générique ou fusionné dans `BlockNode`.

- [ ] **Step 1: Implement** — remplacer le routage `isSuperBlock` par détection catalogue (`catalog.superblocks` ids), génériciser le nœud, supprimer les 2 fichiers + imports.
- [ ] **Step 2: Verify** — `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm run build`, grep `SUPER_BLOCK_REGISTRY|SuperBlockBodies|superBlockRegistry` → 0 résultat (hors tests).
- [ ] **Step 3: Commit.**

### Task 9: Vérification finale démo

- [ ] **Step 1: Run** `pnpm test` — Expected: tout vert.
- [ ] **Step 2: Run** `pnpm run build` — Expected: succès.
- [ ] **Step 3: Parcours manuel** — étudiant novice : ouvre `'add'`, filtre moteur, tap carte BB → config → toggles → Ajouter → tap sortie → compat → connecte → run. Sombre/clair, mobile 390px (targets ≥ 44px).

## Test E2E (navigateur Orca + Docker)

- Stack : `docker compose up --build` (backend `:8000` + frontend `:3000`, `.env` requis).
- Outil : CLI `orca` + navigateur embarqué (`goto` / `snapshot` / `click` / `fill` / `wait`), boucle snapshot-interact-re-snapshot, guide : `orca skills get orca-cli --reference references/browser.md`.
- Parcours : création de compte → login → éditeur → catalogue (`/api/catalog` : 15 SuperBlocks) → pose d'un SuperBlock → toggles → run → journal.
- Logique d'abord (`pnpm test`, `pytest`), puis E2E vécu : tout le parcours doit passer de bout en bout avant démo.

