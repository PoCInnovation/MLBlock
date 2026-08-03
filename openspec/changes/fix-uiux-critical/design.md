## Context

L'audit a identifié des problèmes critiques. Ce design couvre les 2 capabilities : `flow-run-feedback` et `auth-feedback`, plus les fixes d'accessibilité et de contraste associés.

## Goals / Non-Goals

**Goals:**
- Mode avancé : console visible, types corrects au run
- Auth : loading, try/catch, erreurs FR, faux succès register corrigé
- Focus visible, contrôles accessibles au clavier
- Contraste AA corrigé
- `■ Arrêté` trompeur supprimé

**Non-Goals:**
- Ne pas refaire tout le design system (hover states, émojis→SVG, mobile) — autre change
- Ne pas toucher à la logique métier du backend

## Decisions

### 1. Flow run feedback (`flow-run-feedback`)

**1a. Console en mode avancé** : `FlowCanvas.tsx` doit rendre `<ConsolePanel />` comme le fait `Canvas.tsx`. Le `useBlockRunner` écrit déjà dans `consoleLines` — il suffit d'afficher le panneau.

```tsx
// FlowCanvas.tsx — ajouter dans le layout, sous le ReactFlow
<ConsolePanel />
```

**1b. Type correct au run** : `useBlockRunner.ts:27-28` envoie `type: (n.data as any)?.label` (label français). Il faut envoyer `data.type` :
```ts
type: (n.data as any)?.type ?? n.id
```

### 2. Auth feedback (`auth-feedback`)

**2a. Loading state** : état local `loading` dans LoginPage/RegisterPage/HomeNav, bouton désactivé + label pendant la requête.

**2b. try/catch** : envelopper chaque appel Supabase dans try/catch, mapper les erreurs en français.

**2c. Erreurs FR** : map des erreurs Supabase courantes :
```ts
const FR_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'Email not confirmed': 'Email non confirmé. Vérifie ta boîte mail.',
  'User already registered': 'Un compte existe déjà avec cet email',
  'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères',
}
```
Fallback : `'Une erreur est survenue. Réessaie.'`

**2d. Faux succès register** : `signUp` ne retourne pas d'erreur pour un email existant quand la confirmation est active. Vérifier `data.user` :
```ts
const { data, error } = await signUp(email, password)
if (error) setError(mapError(error.message))
else if (!data.user) setError('Un compte existe déjà avec cet email')
else setDone(true)
```

### 3. Accessibilité

**3a. `outline: 'none'` → `outline: 'none'` + focus visible global** dans `index.css` :
```css
:focus-visible { outline: 2px solid #6366F1; outline-offset: 2px; }
```
Retirer les `outline: 'none'` inline qui écrasent, ou ajouter un fallback.

**3b. `<span onClick>` → `<button>`** pour les contrôles cliquables : chips de catégorie (FlowPalette), liens nav (HomeNav), liens "S'inscrire"/"Se connecter" (Login/Register). Un `<button>` est focusable et activable au clavier nativement.

### 4. Contraste

Corriger les textes en échec AA : succès auth (`#6b6560`→`#b7ada3`), footer (`#6f665e`→`#9a9088`), empty canvas, taglines About.

### 5. `■ Arrêté` trompeur

Dans `useAppStore`, `stopRun` ajoute `■ Arrêté`. Quand `finishRun`/`stopRun` suit une erreur de build, ne pas afficher "Arrêté". Distinguer : ajouter une ligne d'erreur au lieu d'"Arrêté" quand `build.success === false`.

## Risks / Trade-offs

- **[Console en flow]** Le ConsolePanel est prévu pour un layout 100vh vertical — vérifier qu'il s'affiche correctement dans FlowCanvas
- **[Changements de texte]** Les messages d'erreur FR changent le wording — s'assurer qu'ils restent cohérents avec l'existant
