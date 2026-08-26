---
id: prediction-csv-principal
title: Prédiction sur CSV simple
difficulty: facile
description: Construis ton premier pipeline de bout en bout, du fichier de données au résultat, sans écrire une ligne de code.
seo:
  title: Prédiction sur CSV simple — MLBlock
  description: Cours débutant pour construire un pipeline complet de régression à partir d'un CSV avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
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
    select_columns: "Ajoute Sélectionner Colonnes pour choisir ta cible et tes entrées."
    train_test_split: "Ajoute Diviser les données pour créer train/test."
    linear_regression: "Choisis Régression Linéaire comme modèle."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate_regression: "Termine avec Évaluer Régression pour voir les métriques."
---

## Étape 1 — Charger CSV

Glisse le bloc **Charger CSV** depuis la catégorie Données sur le canvas. C'est lui qui lit ton fichier et alimente tout le reste du pipeline.

## Étape 2 — Sélectionner les colonnes

Ajoute **Sélectionner Colonnes** depuis Préparer et connecte-le à la sortie de Charger CSV. Indique quelle colonne est la valeur à prédire et lesquelles sont les entrées.

## Étape 3 — Diviser les données

Glisse **Diviser les données** depuis Préparer et connecte-le à la sortie de Sélectionner Colonnes. Il sépare automatiquement tes données en deux parties : une pour entraîner le modèle, une pour le tester.

## Étape 4 — Choisir le modèle

Ajoute **Régression Linéaire** depuis la catégorie Modèles sur le canvas. C'est le modèle qui apprendra à prédire des valeurs numériques à partir de tes données.

## Étape 5 — Entraîner

Glisse **Entraîner le modèle** depuis Entraîner et relie-le à la sortie d'entraînement de Diviser les données. Connecte-y aussi Régression Linéaire : ce bloc prend deux entrées, les données et le modèle à entraîner.

## Étape 6 — Évaluer

Ajoute **Évaluer Régression** depuis Tester sur le canvas. Connecte la sortie d'Entraîner le modèle d'un côté, et la sortie de test de Diviser les données de l'autre. Il calcule les métriques sur des données que le modèle n'a jamais vues.

## Étape 7 — Démarrer

Branche tout et clique sur **Démarrer** dans l'éditeur. Les résultats d'évaluation s'afficheront directement dans le bloc Évaluer Régression.
