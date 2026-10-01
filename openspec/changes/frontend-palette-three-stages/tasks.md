# Tasks: Frontend Three-Stage Palette, Engine SuperBlocks & Gradient Transitions

## 1. Tokens Visuels & Typage Frontend

- [ ] 1.1 Définir les variables CSS par moteur (`--color-engine-pytorch`, `--color-engine-sklearn`, `--color-engine-gym`, `--color-engine-mlflow`, `--color-engine-viz`) dans `frontend/src/index.css`
- [ ] 1.2 Mettre à jour `stages.ts`, `typeSystem.ts` et `types/catalog.ts` pour gérer les 3 macro-étapes, les frameworks et `is_transition`

## 2. Refonte de la Palette de Blocs

- [ ] 2.1 Structurer `FlowPalette.tsx` avec les 3 sections d'étapes labellisées (Données, Modèle & Entraînement, Résultats)
- [ ] 2.2 Ajouter la barre de filtres par framework (Tous, PyTorch, Scikit-Learn & XGBoost, Gymnasium RL, MLflow & Viz)
- [ ] 2.3 Intégrer le switch "Mode Avancé" pour afficher conditionnellement tous les blocs unitaires
- [ ] 2.4 Afficher les cartes de SuperBlocks en tête de chaque section d'étape

## 3. SuperBlocks Personnalisés & Rendu en Dégradé

- [ ] 3.1 Implémenter l'action de création de SuperBlock sur mesure depuis une sélection de nœuds sur le canvas
- [ ] 3.2 Ajouter la validation UI bloquant l'inclusion de blocs de frameworks incompatibles sans adaptateur
- [ ] 3.3 Styliser les nœuds de transition dans `BlockNode.tsx` avec le dégradé bicolore
- [ ] 3.4 Ajouter le support des arêtes SVG en `linearGradient` bicolore dans `FlowLink.tsx`
- [ ] 3.5 Vérifier le rendu sombre/clair et exécuter `pnpm test && pnpm run build`
