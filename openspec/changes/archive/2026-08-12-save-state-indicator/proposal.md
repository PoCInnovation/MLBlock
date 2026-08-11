## Why

Le bouton « Sauvegarder » de l'éditeur est toujours actif, même quand rien n'a changé : l'utilisateur ne sait pas si son travail est synchronisé avec la remote. Un clic sur Save sans modification déclenche une sauvegarde inutile.

## What Changes

- Le bouton « Sauvegarder » (header de l'éditeur) est **désactivé quand le canvas n'est pas modifié** (`!isDirty()`), avec un style grisé et un retour visuel « Sauvegardé » quand le projet est propre.
- Aucun changement de logique de sauvegarde, de stash ou de restauration (mécanismes existants inchangés).

## Capabilities

### New Capabilities
- `save-state-indicator`: indicateur d'état de sauvegarde du pipeline dans l'éditeur (bouton désactivé quand rien à sauvegarder).
