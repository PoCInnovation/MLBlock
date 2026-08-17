# Tasks — Single-Port Connections

## 1. Résolution des ports (utilitaire pur)

- [x] 1.1 Créer `frontend/src/utils/portResolution.ts` : `isAmbiguous(ports)` (dtypes dupliqués) et `resolveConnection(srcNode, tgtNode, srcHandle, tgtHandle, graph)` retournant `{ sourcePort, targetPort, verdict }` — candidats figés côté ambigu, scoring exact=3 / wildcard=2 / famille=2 / convertible=1 / incompatible=0, égalité départagée par l'ordre de déclaration
- [x] 1.2 Tester l'utilitaire dans `frontend/src/utils/portResolution.test.ts` : bloc non-ambigu résolu par dtype (DataFrame → `evaluate.in_2`), priorité exact sur wildcard (`plot_predictions`), côté ambigu figé sur le handle cliqué, aucun compatible → null, convertible → verdict convertible

## 2. Rendu des handles (BlockNode)

- [x] 2.1 `BlockNode.tsx` : handles inputs/outputs rendus empilés au centre (`top: 50%`) pour un côté non-ambigu — un seul visible, les autres `opacity: 0` + `pointer-events: none` ; répartition `topFor` conservée pour les côtés ambigus
- [x] 2.2 `BlockNode.tsx` : coloration verte (`theme.color.success`) des étiquettes `in_N · dtype` / `out_N · dtype` et du handle quand le port est fourni (edge entrante pour un input, edge sortante pour un output) — dérivé de `flowEdges`, aucune donnée stockée

## 3. Connexion (FlowCanvas)

- [x] 3.1 `FlowCanvas.tsx` `onConnect` : utiliser `resolveConnection` au lieu des handles cliqués — compatible → edge avec ports résolus ; convertible → toast + `insertConverter` avec ports résolus ; incompatible → toast erreur existant
- [x] 3.2 `FlowCanvas.tsx` : remplacement — avant d'ajouter une edge, supprimer toute edge existante sur `(target, targetHandle résolu)` via `filter` + concat (pattern `insertConverter`) ; un seul `commitUndoPoint` par geste
- [x] 3.3 Adapter `insertConverter` pour câbler `A → conv` et `conv → B` avec les ports résolus (sourcePort de A, targetPort de B) au lieu des handles cliqués

## 4. Vérification

- [x] 4.1 `npm run build` (tsc + vite) sans erreur
- [x] 4.2 `npm test` : les 58 tests existants passent + les nouveaux tests de `portResolution.test.ts`
- [x] 4.3 Smoke browser (mode libre) : point unique sur ELU et `evaluate` ; handles individuels sur `tensor_dataset` ; connexion DataFrame → `evaluate` câblée sur `in_2` ; reconnecter un input remplace l'ancienne edge ; port fourni en vert ; fan-out d'un output vers deux blocs ; vue grille sans régression
