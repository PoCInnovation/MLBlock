# Proposal: block-hover-description

## Why

Les blocs n'ont aucune description visible : l'utilisateur voit le label (« Convolution 2D ») mais pas ce que le bloc fait. Pourtant le modèle Pydantic `Block.description` contient déjà la docstring complète — la route `/api/catalog` ne l'expose simplement pas.

## What Changes

- **Backend** : la route catalogue envoie une description courte FR par bloc (`description`), extraite de la docstring ; les docstrings reçoivent une phrase FR « ce que fait le bloc » après le label.
- **Frontend** : tooltip au survol — items de la palette et label des nodes — avec la description.

## Capabilities

### New Capabilities
- `block-hover-description`: description FR par bloc exposée via `/api/catalog` (Pydantic `Block.description`) et affichée au survol (palette + nodes).
