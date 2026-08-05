## 1. Flow run feedback

- [x] 1.1 `FlowCanvas.tsx` : ajouter `<ConsolePanel />` dans le layout (sous le ReactFlow)
- [x] 1.2 `useBlockRunner.ts` : envoyer `type: data.type` au lieu de `label` pour les nodes flow

## 2. Auth feedback

- [x] 2.1 Créer `src/schemas/errors.ts` : `mapSupabaseError(err)` → message FR (map + fallback)
- [x] 2.2 `LoginPage.tsx` : état `loading`, bouton désactivé, try/catch, `mapSupabaseError`
- [x] 2.3 `RegisterPage.tsx` : état `loading`, try/catch, `mapSupabaseError`, vérifier `data.user` (faux succès)
- [x] 2.4 `HomeNav.tsx` : try/catch sur `signOut`, feedback minimal

## 3. Feedback trompeur

- [x] 3.1 `useBlockRunner.ts` : ne pas appeler `stopRun` (qui ajoute "■ Arrêté") après une erreur de build — ajouter `failRun` et l'utiliser aux erreurs

## 4. Accessibilité

- [x] 4.1 `index.css` : ajouter `:focus-visible { outline: 2px solid #6366F1; }`
- [x] 4.2 Retirer les `outline: 'none'` qui écrasent le focus (LoginPage, RegisterPage, BlockSegments, FlowPalette)
- [x] 4.3 Convertir `<span onClick>` → `<button>` : chips FlowPalette, liens HomeNav, liens "S'inscrire"/"Se connecter"

## 5. Contraste

- [x] 5.1 Corriger les textes succès auth (`#6b6560` → `theme.color.textMuted`)
- [x] 5.2 Corriger le footer (`#6f665e` → `theme.color.textMuted`)
- [x] 5.3 Corriger l'empty canvas (`#6f665e` → `theme.color.textMuted`)

## 6. Vérification

- [x] 6.1 `tsc --noEmit` passe avec 0 erreur
- [x] 6.2 Build frontend réussi
- [ ] 6.3 Test manuel : run en mode avancé → console visible + graphe valide
- [ ] 6.4 Test manuel : login avec mauvais mot de passe → message FR, register avec email existant → pas de faux succès
