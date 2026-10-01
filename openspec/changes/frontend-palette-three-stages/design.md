# Design: Frontend Three-Stage Palette, Engine SuperBlocks & Gradient Transitions

## Context

Voir `proposal.md` pour le contexte fonctionnel et les rôles précis des 3 étapes.
Ce design documente l'architecture des composants React et du style Tailwind pour les 3 étapes, les frameworks, MLflow et les gradients.

## Goals / Non-Goals

**Goals:**
- Structurer `FlowPalette.tsx` avec les 3 sections d'étapes et la barre de filtres par framework.
- Maintenir les pastilles de couleurs par catégorie d'origine pour une reconnaissance visuelle instantanée.
- Fournir l'action "Créer SuperBlock" sur la sélection de nœuds du canvas.
- Ajouter les définitions SVG de `linearGradient` dans `FlowCanvas.tsx` pour styliser les arêtes de transition.
- Intégrer le switch "Mode Avancé" pour exposer tous les blocs unitaires.

**Non-Goals:**
- Modification des exécutions backend (géré par Spec 1 et Spec 2).

## Decisions

1. **Tokens de Couleurs par Framework** :
   ```css
   --color-engine-pytorch: #EA580C; /* Orange/Flamme PyTorch */
   --color-engine-sklearn: #2563EB; /* Bleu Scikit-Learn / XGBoost */
   --color-engine-gym:     #059669; /* Émeraude Gymnasium */
   --color-engine-mlflow:  #9333EA; /* Violet MLflow / Tracking */
   --color-engine-viz:     #D97706; /* Ambre Visualisation / Plotly */
   ```

2. **Gradients de Transition** :
   - Pour `df_to_tensor` : `background: linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(234,88,12,0.2) 100%)`.
   - Pour les arêtes ReactFlow reliant deux moteurs : arête SVG avec `stroke="url(#grad-sklearn-to-pytorch)"`.

3. **Flux de Création de SuperBlock Sur Mesure** :
   - Bouton contextuel dans la barre d'outils quand 2+ nœuds sont sélectionnés.
   - Dialogue ou drawer demandant le nom du SuperBlock et son moteur cible.
   - Mise à jour du store Zustand via `addSuperBlockFromSelection`.

## Risks / Trade-offs

- Performance de rendu : les filtres d'étapes et de moteurs sont mémorisés (`useMemo`) pour garantir un filtrage instantané même sur les grands catalogues.
