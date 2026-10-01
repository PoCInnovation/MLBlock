# Proposal: Frontend Three-Stage Palette, Engine SuperBlocks & Gradient Transitions

## Why

La palette de blocs et le canvas doivent offrir une lisibilité immédiate aux apprenants et aux développeurs en respectant les **3 Macro-Étapes canoniques** :
1. `Étape 1 : Données / Environnement + Préparation`
2. `Étape 2 : Modèle + Entraînement`
3. `Étape 3 : Évaluation + Visualisation`

Elle garantit le **choix libre du développeur** (blocs unitaires ou SuperBlocks sur mesure), un **filtrage par framework**, des **noms de SuperBlocks limpides pour un débutant avec le moteur entre parenthèses**, un **mode avancé** pour préserver tous les blocs unitaires, et un rendu en **dégradé bicolore** pour les blocs et connexions de transition.

## The 3 Canonical Pipeline Sections in UI

- **Section 1 : Données / Environnement & Préparation**
  - Ingestion (CSV, image, texte), instanciation d'environnement Gym, encodage, split train/test, normalisation, augmentation, DataLoaders.
  - SuperBlocks vedettes :
    - `Préparation Tabulaire (Scikit-Learn)`
    - `Chargement d'Images & Lots (PyTorch)`
    - `Monde Virtuel & Simulation (Gymnasium)`
    - `Préparation de Texte (PyTorch)`
- **Section 2 : Modèle & Entraînement**
  - Couches PyTorch, estimateurs Scikit-Learn, modèles XGBoost, agents Gymnasium, optimiseurs et bloc de tracking `MLflow`.
  - SuperBlocks vedettes :
    - `Réseau de Neurones Séquentiel (PyTorch)`
    - `Entraînement de Réseau (PyTorch)`
    - `Modèle Statistique & Arbres (Scikit-Learn)`
    - `Modèle de Boosting Rapide (XGBoost)`
    - `Apprentissage par Renforcement (Gymnasium)`
    - `Suivi & Historique d'Expérience (MLflow)`
- **Section 3 : Évaluation & Visualisation**
  - Métriques d'évaluation, matrices de confusion, graphes interactifs Plotly, figures Seaborn/Matplotlib, export de modèles servables MLflow.
  - SuperBlocks vedettes :
    - `Score & Courbes d'Apprentissage (Plotly / PyTorch)`
    - `Matrice de Confusion & Précision (Seaborn / Scikit-Learn)`
    - `Visualisation de Groupes & Carte 2D (Plotly / Scikit-Learn)`
    - `Score & Démonstration de l'Agent (Gymnasium / Plotly)`
    - `Export de Modèle Prêt à l'Emploi (MLflow)`

---

## What Changes

- **Palette par Macro-Étapes, Catégories Colorées et Filtres Moteurs (`FlowPalette.tsx`)** :
  - 3 onglets / sections d'étapes clairs et labellisés.
  - Conservation des catégories d'origine avec leurs pastilles de couleurs distinctes.
  - Filtre par moteur technologique : `Tous`, `PyTorch` (orange/flamme), `Scikit-Learn & XGBoost` (bleu), `Gymnasium RL` (émeraude), `MLflow & Viz` (violet/ambre).
- **Création Libre de SuperBlocks Sur Mesure** :
  - Outil de composition : l'utilisateur peut sélectionner un groupe de nœuds et cliquer sur "Créer SuperBlock" pour encapsuler son flux dans un conteneur typé par étape et moteur.
  - Contrôle visuel direct : avertissement si un nœud d'un framework incompatible est glissé dans un SuperBlock fermé sans passerelle.
- **Toggle "Mode Avancé"** :
  - Par défaut : affiche les SuperBlocks recommandés et les blocs canoniques majeurs.
  - Mode avancé activé : déplie la totalité des blocs unitaires individuels pour les paramétrages pointus.
- **Rendu en Dégradé Bicolore pour les Blocs et Liens de Transition** :
  - Les blocs de transition (`df_to_tensor`, `to_tensor`, `env_to_tensor`, `module_to_policy`) et leurs arêtes ReactFlow sont stylisés en dégradé bicolore fluide reliant le framework d'entrée au framework de sortie.

## Capabilities

### New Capabilities
- `three-stage-palette`: Navigation fluide par 3 macro-étapes, catégories colorées et filtres par framework.
- `custom-superblock-creation`: Interface de création et d'édition de SuperBlocks personnalisés sur le canvas.
- `gradient-transitions`: Arêtes et cartes de nœuds de transition stylisées en dégradé bicolore.

### Modified Capabilities
- Aucune capacité de spec existante modifiée.
