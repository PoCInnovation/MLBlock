## 1. Coercion backend

- [x] 1.1 `BlockMeta.execute` : coercer les params selon `spec["params"][k]["type"]` (int/float/bool/list/str/file, vide → None pour optionnel) avant `_build_fn(**params)`
- [x] 1.2 Erreur de coercion claire (nom du bloc + param) — TypeError levé par le helper
- [x] 1.3 Test backend : strings → types (int, float, bool, list), vide → None, coercion impossible → erreur

## 2. Données des nodes

- [x] 2.1 Node data : ajouter `segs: Segment[]` + `fields: Record<string, string>` ; retirer `params` (`segsToParams`)
- [x] 2.2 `linearToFlow` : propager `b.fields` → `data.fields` + `segs` du catalogue
- [x] 2.3 `flowToLinear` : lire `data.fields` (au lieu de `data.params[].default`)
- [x] 2.4 Store : action `updateFlowParam(nodeId, k, v)` (met à jour `data.fields`)

## 3. UI avancée

- [x] 3.1 `BlockNode` : rendre `<BlockSegments segs fields blockId onUpdate>` (num/sel/file éditables), supprimer l'affichage texte `{k}: {v.type}`
- [x] 3.2 `onDrop` + `insertConverter` : créer les nodes avec `segs` + `fields` (défauts du catalogue)

## 4. Run avancé

- [x] 4.1 `useBlockRunner` (branche advanced) : `params: node.data.fields ?? {}` au lieu de `{}`

## 5. Vérification

- [x] 5.1 Build frontend (`npm run build`) + pytest backend
- [x] 5.2 Smoke : éditer `ratio` dans un node avancé → run → le backend reçoit la valeur
- [x] 5.3 Smoke : bascule linéaire→avancé→linéaire conserve les valeurs éditées
- [x] 5.4 Smoke : run avancé d'un bloc à params requis (conv2d avec in_channels) → build OK
