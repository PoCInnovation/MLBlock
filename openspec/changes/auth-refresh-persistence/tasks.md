## 1. Auth-ready gate

- [x] 1.1 `App.tsx` : `authReady` state + `setAuthReady(true)` après `getSession` (même useEffect)
- [x] 1.2 Rendu splash (div centré, thème) tant que `!authReady`, avant `<Routes>`

## 2. autoComplete

- [x] 2.1 `LoginPage` : `autoComplete="email"` (email) + `"current-password"` (password)
- [x] 2.2 `RegisterPage` : `autoComplete="email"` + `"new-password"` (password et confirm)

## 3. Vérification

- [x] 3.1 Build frontend (`npm run build`)
- [x] 3.2 Smoke : refresh à /editor avec session seedée → éditeur affiché sans passer par /login (DOM) ; inputs login portent les bons autoComplete
