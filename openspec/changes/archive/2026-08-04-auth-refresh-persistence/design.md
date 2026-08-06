# Design: auth-refresh-persistence

## Context

`App.tsx` : `useEffect` → `getSession().then(setUser)` + abonnement `onAuthStateChange` ; les routes sont rendues immédiatement avec `user` initialement null. Sur un refresh à `/editor`, le guard `user ? <EditorPage/> : <Navigate to="/login"/>` redirige avant la résolution de la session → l'utilisateur authentifié se retrouve sur /login, sans retour (guard à sens unique). La session EST persistée (supabase-js v2 : `persistSession: true` par défaut → localStorage `sb-<ref>-auth-token`).

`LoginPage`/`RegisterPage` (RHF) : les inputs reçoivent `name` via le spread `{...field}` ✓ mais **aucun `autoComplete`** → le gestionnaire de mots de passe ne propose pas l'enregistrement.

## Goals / Non-Goals

**Goals:**
- Refresh sur une page protégée → session restaurée sans détour par /login.
- `autoComplete` correct sur login/register → le navigateur propose l'enregistrement.

**Non-Goals:**
- Stockage de mot de passe par l'app (anti-pattern sécurité — le gestionnaire natif le fait).
- Changement de la config supabase-js (`persistSession` par défaut OK).

## Decisions

### D1 — Gate `authReady` dans App.tsx
`useState(false)` + dans le même `useEffect` existant : après `getSession`, `setAuthReady(true)` (avant ou après `setUser` — l'ordre importe peu, le re-render gère les deux). Rendu : `if (!authReady) return <splash>` (div centré, style thème — comme le chargement du catalogue dans EditorPage) avant `<Routes>`. La résolution de `getSession` est rapide (lecture localStorage + refresh token si besoin) — splash bref, jamais bloquant.
- *Alternative* : redirect /login→/editor quand user devient truthy — rejeté (flash /login + logique dispersée). Le gate est le pattern propre.

### D2 — autoComplete sur les inputs
Les attributs vont sur l'élément `<input>` (s'ajoutent au spread `{...field}` — pas de conflit) :
- `LoginPage` : email → `autoComplete="email"` ; password → `autoComplete="current-password"`
- `RegisterPage` : email → `autoComplete="email"` ; password + confirm → `autoComplete="new-password"`
Les `name` existent déjà (RHF field.name). Le `<form onSubmit>` RHF existe → le navigateur détecte la soumission et propose l'enregistrement.

## Risks / Trade-offs

- **Splash sur chaque refresh** : bref (~50-200 ms, lecture localStorage) — imperceptible, mais ajoute un état de rendu. Accepté.
- **`new-password` sur register** : si l'utilisateur remplit login ensuite, Chrome peut confondre — comportement standard, pas de régression.
- **getSession lent** (refresh token réseau) : le splash attend — mieux qu'un faux redirect. Timeout naturel de supabase-js.
