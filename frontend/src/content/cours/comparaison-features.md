---
id: comparaison-features
title: Comparaison de features
difficulty: moyen
description: Apprends à inspecter visuellement tes colonnes avant de choisir lesquelles conserver pour l'entraînement.
seo:
  title: Comparaison de features — MLBlock
  description: Cours intermédiaire pour explorer et comparer des features avant d'entraîner un modèle de régression avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: inspecter
      type: inspect_columns
    - id: visualiser-1
      type: visualize_feature
    - id: visualiser-2
      type: visualize_feature
    - id: selectionner
      type: select_columns
    - id: diviser
      type: train_test_split
    - id: modele
      type: linear_regression
    - id: entrainer
      type: train_model
    - id: evaluer
      type: evaluate_regression
  edges:
    - from: charger-csv
      to: inspecter
    - from: charger-csv
      to: visualiser-1
    - from: charger-csv
      to: visualiser-2
    - from: charger-csv
      to: selectionner
    - from: selectionner
      to: diviser
    - from: diviser
      to: entrainer
    - from: modele
      to: entrainer
    - from: entrainer
      to: evaluer
    - from: diviser
      to: evaluer
  hints:
    load_csv: "Glisse le bloc Charger CSV depuis Données."
    inspect_columns: "Ajoute Inspecter Colonnes pour voir les statistiques descriptives."
    visualize_feature: "Ajoute deux blocs Visualiser Feature pour comparer deux colonnes."
    select_columns: "Ajoute Sélectionner Colonnes et garde les features les plus pertinentes."
    train_test_split: "Ajoute Diviser les données pour créer train/test."
    linear_regression: "Choisis Régression Linéaire comme modèle."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate_regression: "Termine avec Évaluer Régression pour mesurer l'impact de ton choix de features."
---

## Étape 1 — Charger CSV

Glisse le bloc **Charger CSV** depuis la catégorie Données sur le canvas. Ce bloc charge l'intégralité du jeu de données, toutes colonnes incluses, pour que tu puisses les explorer avant de faire un choix.

## Étape 2 — Inspecter les colonnes

Ajoute **Inspecter Colonnes** depuis Préparer et relie la sortie de Charger CSV à son entrée. Ce bloc affiche des statistiques descriptives pour chaque colonne et donne une première idée de la distribution de tes variables.

## Étape 3 — Visualiser la première feature

Glisse un bloc **Visualiser Feature** depuis Préparer et connecte-le à la sortie de Charger CSV. Paramètre-le sur la première colonne que tu souhaites comparer.

## Étape 4 — Visualiser la deuxième feature

Ajoute un deuxième bloc **Visualiser Feature** depuis Préparer et connecte-le aussi à la sortie de Charger CSV. Paramètre-le sur la deuxième colonne candidate. Compare les deux visualisations pour décider laquelle est la plus informative.

## Étape 5 — Sélectionner les colonnes

Glisse **Sélectionner Colonnes** depuis Préparer et connecte-le à la sortie de Charger CSV. En t'appuyant sur ce que tu viens d'observer, choisis les colonnes à conserver en excluant la feature la moins pertinente.

## Étape 6 — Diviser les données

Ajoute **Diviser les données** depuis Préparer et connecte-le à la sortie de Sélectionner Colonnes. Il partage les données entre jeu d'entraînement et jeu de test.

## Étape 7 — Choisir le modèle

Glisse **Régression Linéaire** depuis la catégorie Modèles sur le canvas. Ce modèle apprendra à prédire à partir des features que tu as sélectionnées.

## Étape 8 — Entraîner

Ajoute **Entraîner le modèle** depuis Entraîner et branche-le sur la sortie d'entraînement de Diviser les données. Connecte-y aussi Régression Linéaire : ce bloc prend deux entrées, les données et le modèle.

## Étape 9 — Démarrer

Glisse **Évaluer Régression** depuis Tester et connecte ses deux entrées : la sortie d'Entraîner le modèle et la sortie de test de Diviser les données. Clique sur **Démarrer** pour vérifier si ton choix de features améliore les métriques.
