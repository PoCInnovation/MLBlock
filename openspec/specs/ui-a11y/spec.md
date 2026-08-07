# UI A11y

## Purpose

L'interface respecte les préférences de mouvement réduit, maintient un contraste lisible pour le texte secondaire, expose des contrôles sémantiques focusables et explique ses états vides.

## Requirements

### Requirement: Mouvement réduit respecté
The system MUST disable animations and transitions when the user prefers reduced motion (`prefers-reduced-motion: reduce`), covering keyframes (`mlbGlow`, `mlbFloat`, `mlbBlink`, `mlbSpin`) and inline transitions alike.

#### Scenario: Réduction de mouvement activée
- **WHEN** l'utilisateur active `prefers-reduced-motion: reduce`
- **THEN** aucune animation ni transition ne s'exécute (durées neutralisées, itérations forcées à 1)

#### Scenario: Mouvement standard
- **WHEN** aucune préférence de mouvement réduit n'est active
- **THEN** les animations et transitions actuelles (150ms, `mlb*`) restent inchangées

### Requirement: Contraste du texte secondaire
The secondary text color MUST meet at least 3:1 contrast on the dark surfaces it appears on (ideally 4:1). The `textDim` token MUST be lightened from `#6f665e` (2.99:1 on `surface2`) to at least ≈4:1.

#### Scenario: Checklist et compteurs lisibles
- **WHEN** une case de checklist non cochée ou un compteur de palette est affiché sur `surface2`
- **THEN** le texte est lisible (contraste ≥ 4:1) tout en restant hiérarchiquement secondaire

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
