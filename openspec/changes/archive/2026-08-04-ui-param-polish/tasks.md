## 1. Backend — suggestions + labels FR

- [x] 1.1 Grammaire docstring : parser `(suggestions: a|b|c)` → `ParamInfo.suggestions`
- [x] 1.2 `routes.py` : label = 1re ligne de docstring FR (fallback `name.title()`)
- [x] 1.3 Enrichir les docstrings cibles : 1re ligne FR pour celles encore « Parameter. » + `(suggestions: …)` sur compteurs/probabilités/kernel_size/shape
- [x] 1.4 Test backend : parsing suggestions + label docstring/fallback

## 2. Frontend — catalogue + segments

- [x] 2.1 `catalog.ts` + `schemas/api.ts` : champ `suggestions` ; `toSegments` → segment avec `opts`
- [x] 2.2 `BlockSegments` : label `s.k` avant chaque champ
- [x] 2.3 `BlockSegments` : rendu datalist quand `suggestions` (text input, libre, pas de validation rouge)
- [x] 2.4 `BlockNode` : ligne par sortie (`out_N · dtype`) sous les params

## 3. Traduction FR

- [x] 3.1 FlowPalette : « Blocks » → « Blocs », « Rechercher un block… » → « Rechercher un bloc… »
- [x] 3.2 Vérifier les autres strings anglaises du frontend (grep) et les traduire

## 4. Vérification

- [x] 4.1 Build frontend (`npm run build`) + pytest backend
- [x] 4.2 Smoke : `train_test_split` montre `ratio:`/`shuffle:`/`seed:` et les sorties `out_1`/`out_2`
- [x] 4.3 Smoke : suggestions affichées en datalist (compteur), saisie libre OK
- [x] 4.4 Smoke : palette « Blocs », labels FR (« Charger un CSV »)
