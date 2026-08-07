# Unsaved Changes

## Purpose

L'utilisateur est prévenu avant toute sortie avec des modifications non sauvegardées, et son travail est récupérable après une session expirée ou un refresh grâce à un stash localStorage.

## ADDED Requirements

### Requirement: Détection des modifications non sauvegardées
The system MUST detect when the project (canvas blocks or name) differs from the last saved/loaded state, by comparing a fingerprint of the current state to the saved snapshot. Mode toggles (linéaire/avancé) MUST NOT count as modifications.

#### Scenario: Édition du canvas
- **WHEN** l'utilisateur ajoute, supprime ou modifie un bloc, ou renomme le projet
- **THEN** le système considère le projet comme modifié (dirty)

#### Scenario: Après sauvegarde
- **WHEN** l'utilisateur clique « Sauvegarder » avec succès
- **THEN** le projet redevient non modifié (nouveau snapshot)

### Requirement: Garde de navigation
Leaving the editor with unsaved changes MUST show a confirmation dialog before any navigation (in-app links, browser back/forward). The dialog MUST offer three actions: save and leave, leave without saving, stay.

#### Scenario: Navigation avec modifications
- **WHEN** l'utilisateur modifie son projet puis navigue (logo, « Mes projets », bouton retour)
- **THEN** un dialog « Modifications non sauvegardées » s'affiche avec [Sauvegarder et quitter] [Quitter sans sauvegarder] [Rester]

#### Scenario: Pas de modifications
- **WHEN** l'utilisateur navigue sans avoir modifié le projet
- **THEN** aucune confirmation (sortie directe)

### Requirement: Déconnexion avec modifications
Logging out with unsaved changes MUST show the same confirmation dialog before signing out. Without modifications, logout MUST proceed directly.

#### Scenario: Déconnexion modifiée
- **WHEN** l'utilisateur clique « Déconnexion » avec un projet modifié
- **THEN** le dialog s'affiche ; « Sauvegarder et quitter » enregistre puis déconnecte, « Quitter sans sauvegarder » déconnecte sans enregistrer

### Requirement: Récupération après session expirée ou refresh
When the user leaves with unsaved changes and no active session (session expired) or via refresh/close, the system MUST stash the pipeline (name, nodes, edges, pipelineId) in localStorage under a per-user key. After login or reload, the stash MUST be restored automatically in the editor with a French notification, then consumed.

#### Scenario: Session expirée en cours d'édition
- **WHEN** la session expire alors que le projet est modifié
- **THEN** le pipeline est stocké en localStorage ; après reconnexion, le canvas est restauré avec le toast « Travail récupéré »

#### Scenario: Refresh avec modifications
- **WHEN** l'utilisateur recharge la page avec un projet modifié
- **THEN** le pipeline est stocké avant le rechargement et restauré après, avec notification

#### Scenario: Abandon explicite
- **WHEN** l'utilisateur choisit « Quitter sans sauvegarder »
- **THEN** le stash est supprimé (pas de récupération ultérieure)
