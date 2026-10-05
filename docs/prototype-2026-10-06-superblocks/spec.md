# Spec — Drawer unifié 3 macro-étapes & cartes SuperBlocks (démo)

Date : 2026-10-06 · Statut : approuvée (sections 1-2) · Prototype : `prototype.html` (même dossier)

## 1. Contexte & but

Public démo : étudiant très débutant qui comprend en 2 minutes et assemble une pipeline complète.
Contraintes : mobile + tablette utilisables, interactions minimales, **tout dans le Drawer unifié**
(`FlowCanvas.tsx:390-453`, `activeSheet`), **zéro mock** (tout vient de `GET /api/catalog`),
sidebar `FlowPalette.tsx` dédiée repoussée à après-démo.

## 2. Décisions enregistrées

1. Drawer branché sur `catalog.superblocks()` + champs `engine` / `macro_stage` / `is_transition` (backend les sert déjà).
2. Enfants par défaut matérialisés au tap : `{id: \`${nodeId}.${type}\`, type, params}` (format exigé par pydantic, cf. tests backend).
3. Sheet `'compat'` : liste les blocs compatibles via `typeCheck.classifyEdge`, tap → ajoute + connecte, `ConverterDialog` si `convertible`. Zéro mock.
4. Création custom de SuperBlocks (spec 3.1/3.2) : **hors scope démo**.
5. Dégradés bicolores + implémentation des 4 blocs de transition : **dans le scope, prioritaire**.
6. Mode avancé : `Switch` en tête de sheet `'add'`.

## 3. Structure du Drawer (section 1 approuvée)

- Sheet `'add'` : `Switch` Avancé, 3 sections macro-étapes (Données / Modèle & Entraînement / Résultats),
  `ToggleGroup` filtre moteur (Tous, PyTorch, Scikit-Learn & XGBoost, Gymnasium RL, MLflow & Viz),
  cartes SuperBlocks (titre FR + `Badge outline` moteur haut-droite + pastille catégorie + chevron).
  Cartes OFF → tap ouvre `'config'`.
- Sheet `'config'` (pré-ajout, nouvelle valeur `activeSheet`) : description, `Checkbox` des sous-options
  (défauts cochés depuis le catalogue), params via `BlockSegments`, bouton Ajouter → `addFlowNode`
  avec `children`, bascule auto sur `'inspect'`.
  Rendu des params piloté par les métadonnées catalogue backend : `sel`/`sug` (choix:) → `Select`
  shadcn en drawer bottom sur mobile ; `num` (entre:) → input + hint bornes ; champ libre → input
  + badge pointillé "libre".
- Sheet `'inspect'` (`NodeInspector` étendu, post-ajout) : mêmes toggles (`updateNodeChildren`,
  undo inclus) + params + section "Blocs suivants compatibles".
- Sheet `'compat'` (nouvelle) : ouverte au tap sur une sortie (canvas ou config), liste compatible/`convertible`.
- `'journal'` inchangé.

## 4. Flux de données (section 2 approuvée)

- `fetchCatalog` (`api/client.ts:97-127`) : mapper `engine`, `macro_stage`, `macro_stage_name`,
  `is_transition` sur `BlockDef` ; stocker `superblocks: [{id, titre, description, macro_stage, engine, children}]`.
- `buildNode` (`FlowCanvas.tsx:195-214`) : `children` par défaut pour tout SuperBlock catalogue
  (aujourd'hui seulement `sequential_container`).
- `toServerPayload` sérialise déjà les `children` (`pipelineDocument.ts:24/75`, testé) — inchangé.
- `'compat'` : scan `catalog.blocks` via `classifyEdge` sur le dtype de sortie, `useMemo`.

## 5. Visuel (détaillé dans `prototype.html`, 3 variantes de cartes)

- Tokens : `--color-engine-pytorch #EA580C`, `sklearn #2563EB`, `gym #059669`, `mlflow #9333EA`, `viz #D97706`.
- Carte : `Card` + `Badge outline` moteur haut-droite + pastille catégorie + chevron ; compacte, 1 tap = 1 action.
- Transitions (`df_to_tensor`, `to_tensor`, `env_to_tensor`, `module_to_policy`) : `linear-gradient(135deg, …)`
  entrée→sortie + arêtes SVG `linearGradient` dans `FlowLink` (aujourd'hui couleur unie + pointillés, `edgeStyleFor`).
- Sombre/clair via variables existantes.

## 6. Suppressions (zéro code mort)

`superBlockRegistry.ts` (4 entrées legacy dont 2 fantômes backend), `SuperBlockBodies.tsx`,
branche `isSuperBlock` de `BlockNode.tsx` → rendu unifié piloté catalogue ;
`FlowPalette.tsx` reste non montée (ressuscitée après démo ou supprimée).

## 7. Fichiers touchés

`api/client.ts`, `types/catalog.ts`, `store/useAppStore.ts` (type `activeSheet` + `SuperBlockCatalog`),
`components/flow/FlowCanvas.tsx` (sheets + `buildNode`), `NodeInspector` (extract),
nouveau `SuperBlockConfigSheet.tsx` + `CompatSheet.tsx`, `components/flow/FlowLink.tsx`,
`index.css` (tokens), `utils/stages.ts` (3 macro-étapes, cf. spec 1 `MacroStage`).

## 8. Tests & done

`pnpm test` (toggles → `updateNodeChildren`, sheets catalogue-driven sans mock),
`pnpm run build`, rendu sombre/clair, tap-targets ≥ 44px sur mobile.

## 9. Hors scope

Création custom, sidebar palette, exécution backend des conteneurs (issue #23).
