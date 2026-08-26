---
id: comparaison-modeles-controle
title: Comparaison de deux modèles avec branchement Contrôle
difficulty: difficile
description: Entraîne deux modèles en parallèle sur les mêmes données et laisse le pipeline choisir automatiquement le meilleur.
seo:
  title: Comparaison de deux modèles — MLBlock
  description: Cours avancé pour entraîner deux modèles en parallèle et sélectionner automatiquement le meilleur avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: selectionner
      type: select_columns
    - id: normaliser
      type: normalizer
    - id: diviser
      type: train_test_split
    - id: modele-1
      type: linear_regression
    - id: entrainer-1
      type: train_model
    - id: modele-2
      type: random_forest
    - id: entrainer-2
      type: train_model
    - id: evaluer-1
      type: evaluate_regression
    - id: evaluer-2
      type: evaluate_regression
    - id: comparer
      type: compare_results
  edges:
    - from: charger-csv
      to: selectionner
    - from: selectionner
      to: normaliser
    - from: normaliser
      to: diviser
    - from: diviser
      to: entrainer-1
    - from: modele-1
      to: entrainer-1
    - from: diviser
      to: entrainer-2
    - from: modele-2
      to: entrainer-2
    - from: entrainer-1
      to: evaluer-1
    - from: diviser
      to: evaluer-1
    - from: entrainer-2
      to: evaluer-2
    - from: diviser
      to: evaluer-2
    - from: evaluer-1
      to: comparer
    - from: evaluer-2
      to: comparer
  hints:
    load_csv: "Glisse le bloc Charger CSV depuis Données."
    select_columns: "Ajoute Sélectionner Colonnes pour définir ta cible et tes entrées."
    normalizer: "Ajoute Normaliser pour harmoniser les échelles avant la bifurcation."
    train_test_split: "Ajoute Diviser les données — ses deux sorties alimenteront les deux branches."
    linear_regression: "Ajoute Régression Linéaire comme premier modèle de la comparaison."
    random_forest: "Ajoute Régression Forêt comme deuxième modèle."
    train_model: "Ajoute deux blocs Entraîner le modèle, un par branche."
    evaluate_regression: "Ajoute deux blocs Évaluer Régression, un par branche."
    compare_results: "Ajoute Comparer Résultats depuis Contrôle pour sélectionner automatiquement le meilleur modèle."
---

## Étape 1 — Charger CSV

Glisse le bloc **Charger CSV** depuis la catégorie Données sur le canvas. Il fournira les données communes aux deux branches du pipeline.

## Étape 2 — Sélectionner les colonnes

Ajoute **Sélectionner Colonnes** depuis Préparer et connecte-le à la sortie de Charger CSV. Définis la colonne cible et les colonnes d'entrée.

## Étape 3 — Normaliser

Glisse **Normaliser** depuis Préparer et connecte-le à la sortie de Sélectionner Colonnes. Il harmonise les échelles avant que les données partent dans les deux branches.

## Étape 4 — Diviser les données

Ajoute **Diviser les données** depuis Préparer et relie la sortie de Normaliser à son entrée. Ce bloc produit deux sorties, entraînement et test, qui alimenteront les deux branches de modèles.

## Étape 5 — Premier modèle

Glisse **Régression Linéaire** depuis la catégorie Modèles sur le canvas. Ce sera le premier modèle de la comparaison.

## Étape 6 — Entraîner le premier modèle

Ajoute un bloc **Entraîner le modèle** depuis Entraîner et branche-le sur la sortie d'entraînement de Diviser les données. Connecte-y aussi Régression Linéaire.

## Étape 7 — Deuxième modèle

Glisse **Régression Forêt** depuis la catégorie Modèles sur le canvas. Ce sera le deuxième modèle à comparer.

## Étape 8 — Entraîner le deuxième modèle

Ajoute un deuxième bloc **Entraîner le modèle** depuis Entraîner et connecte-le à la sortie d'entraînement de Diviser les données. Connecte-y Régression Forêt.

## Étape 9 — Évaluer le premier modèle

Glisse un bloc **Évaluer Régression** depuis Tester. Connecte la sortie du premier Entraîner le modèle d'un côté, et la sortie de test de Diviser les données de l'autre.

## Étape 10 — Évaluer le deuxième modèle

Ajoute un deuxième bloc **Évaluer Régression** depuis Tester. Connecte la sortie du deuxième Entraîner le modèle d'un côté, et la sortie de test de Diviser les données de l'autre.

## Étape 11 — Démarrer

Glisse **Comparer Résultats** depuis la catégorie Contrôle. Connecte la sortie du premier Évaluer Régression d'un côté, et la sortie du deuxième de l'autre. Clique sur **Démarrer** pour exécuter les deux branches en parallèle et voir quel modèle obtient les meilleures métriques.
