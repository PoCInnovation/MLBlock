# Proposal: advanced-mode-params

## Why

Le mode avancé (ReactFlow) est une coquille visuelle complète pour la construction de graphes, mais les hyperparamètres des blocs y sont **inutilisables** : `BlockNode` les affiche en lecture seule (`{k}: {v.type}`), le run avancé envoie `params: {}` au backend (défauts systématiques), et `linearToFlow` reconstruit les params depuis les défauts du catalogue — les valeurs éditées en mode linéaire sont perdues à la bascule. Résultat : 62 blocs sur 65 ont au moins un paramètre requis (conv2d, linear…) et **plantent au run avancé** ; les autres tournent avec les défauts, jamais avec les réglages de l'utilisateur.

## What Changes

- **Préservation des valeurs** : `linearToFlow` propage `b.fields` (les valeurs éditées en linéaire) dans `data.params` au lieu des seuls défauts du catalogue.
- **Exécution réelle** : `useBlockRunner` envoie `params` depuis `data.params` des nodes (au lieu de `{}`) — le run avancé utilise les réglages.
- **Édition dans le node** : `BlockNode` rend les params éditables (num / select / file, mêmes segments que `BlockSegments`), avec mise à jour du store (`updateFlowParam`).
- **Coût au build** : le run avancé d'un bloc à params requis cesse de planter (in_channels, out_features, ratio… fournis).

## Capabilities

### New Capabilities
- `advanced-mode-params`: hyperparamètres éditables dans les nodes ReactFlow, valeurs propagées à travers les conversions linéaire↔avancé, params envoyés au run.

### Modified Capabilities
<!-- Aucune spec existante — capability nouvelle. -->
