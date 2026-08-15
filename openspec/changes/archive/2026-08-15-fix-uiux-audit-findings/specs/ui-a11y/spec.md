## Purpose

L'interface respecte les préférences de mouvement réduit, maintient un contraste lisible pour le texte secondaire, expose des contrôles sémantiques focusables et explique ses états vides.

## MODIFIED Requirements

### Requirement: Contraste du texte secondaire
The secondary text color MUST meet at least 4.5:1 contrast on the dark surfaces it appears on (upgraded from 3:1/4:1). The `textDim` token MUST be lightened so 11px metadata reaches ≥4.5:1 on `surface2` (currently 4.40:1).

#### Scenario: Checklist et compteurs lisibles
- **WHEN** une case de checklist non cochée ou un compteur de palette est affiché sur `surface2`
- **THEN** le texte est lisible (contraste ≥ 4.5:1) tout en restant hiérarchiquement secondaire

### Requirement: Contraste des boutons d'action
Primary action buttons with white text (accent `Lancer`/`Mes projets`/sample `useBtn`, auth buttons) MUST meet 4.5:1 contrast between text and background. The accent used for white-text buttons must be darkened from `#D97757` (3.12:1) and the auth color from `#6366F1` (4.47:1).

#### Scenario: Bouton Lancer
- **WHEN** le bouton « Lancer » est rendu avec du texte blanc sur fond accent
- **THEN** le ratio de contraste est ≥ 4.5:1

#### Scenario: Bouton de connexion
- **WHEN** le bouton de connexion/inscription est rendu avec du texte blanc sur fond `auth`
- **THEN** le ratio de contraste est ≥ 4.5:1

### Requirement: Cibles tactiles minimales
Every interactive control (icon buttons in the editor header, palette items, console tabs, run/stop) MUST have a hit area of at least 44×44px, via padding or hit expansion, without shifting layout on press.

#### Scenario: Boutons d'icône du header
- **WHEN** l'utilisateur touche un bouton d'icône (undo, redo, vue, menu) dans le header de l'éditeur
- **THEN** la zone interactive fait au moins 44×44px

#### Scenario: Pas de décalage au clic
- **WHEN** un contrôle compact est pressé
- **THEN** sa mise en page ne change pas (le feedback est color/opacity, pas un shift de layout)

### Requirement: Lien d'évitement (skip link)
Keyboard users MUST be able to skip the navigation and jump to main content. The app MUST provide a skip-to-content link that becomes visible on focus.

#### Scenario: Navigation clavier
- **WHEN** un utilisateur clavier presse Tab sur la page d'accueil ou l'éditeur
- **THEN** un lien « Aller au contenu » apparaît en premier et amène le focus au contenu principal

### Requirement: Anneau de focus préservé
No interactive control MAY remove its visible focus indicator. Controls that currently use `outline-none` (e.g. the column rename input) MUST keep an equivalent visible focus style (border or ring).

#### Scenario: Renommage de colonne
- **WHEN** l'utilisateur navigue au clavier jusqu'au champ de renommage d'une colonne
- **THEN** le champ affiche un indicateur de focus visible (bordure ou anneau), pas `outline: none` seul

## ADDED Requirements

### Requirement: Mouvement réduit respecté
The system MUST disable animations and transitions when the user prefers reduced motion (`prefers-reduced-motion: reduce`), covering keyframes (`mlbGlow`, `mlbFloat`, `mlbBlink`, `mlbSpin`) and inline transitions alike.

#### Scenario: Réduction de mouvement activée
- **WHEN** l'utilisateur active `prefers-reduced-motion: reduce`
- **THEN** aucune animation ni transition ne s'exécute (durées neutralisées, itérations forcées à 1)

#### Scenario: Mouvement standard
- **WHEN** aucune préférence de mouvement réduit n'est active
- **THEN** les animations et transitions actuelles (150ms, `mlb*`) restent inchangées

### Requirement: Contrôles d'upload sémantiques
The CSV upload controls (« Réessayer » and the file button) MUST be real buttons (`<button type="button">`), focusable via keyboard and activable with Enter/Space, with unchanged visual style.

#### Scenario: Activation clavier
- **WHEN** l'utilisateur navigue au clavier jusqu'au bouton CSV ou « Réessayer »
- **THEN** le contrôle reçoit le focus et s'active avec Entrée/Espace (ouvre le sélecteur de fichier)

### Requirement: État vide de la recherche palette
When the block palette search/filters match no blocks, the palette MUST show a French message (« Aucun bloc ne correspond ») instead of an empty list.

#### Scenario: Recherche sans résultat
- **WHEN** une recherche ou un filtre de catégorie ne correspond à aucun bloc
- **THEN** un message explicite s'affiche à la place de la liste vide
