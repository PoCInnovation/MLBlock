## ADDED Requirements

### Requirement: Session restaurée au refresh
The app MUST wait for the initial session resolution (`getSession`) before rendering routes (auth-ready gate with a brief splash). Refreshing a protected page MUST restore the session without redirecting through /login.

#### Scenario: Refresh sur /editor
- **WHEN** un utilisateur authentifié recharge `/editor`
- **THEN** la session est restaurée et l'éditeur s'affiche (pas de passage par /login)

#### Scenario: Non authentifié
- **WHEN** un visiteur sans session charge `/editor`
- **THEN** il est redirigé vers /login après la résolution (comportement actuel, pas de flash)

### Requirement: Enregistrement des identifiants par le navigateur
The login and register inputs MUST carry the correct `autoComplete` attributes so the browser's password manager offers to save credentials: login (`email`, `current-password`), register (`email`, `new-password` ×2). The app MUST NOT store passwords itself.

#### Scenario: Login
- **WHEN** l'utilisateur soumet le formulaire de connexion
- **THEN** le navigateur propose d'enregistrer email + mot de passe (`autoComplete="email"` / `"current-password"`)

#### Scenario: Register
- **WHEN** l'utilisateur soumet le formulaire d'inscription
- **THEN** le navigateur propose d'enregistrer le nouveau mot de passe (`autoComplete="new-password"`)
