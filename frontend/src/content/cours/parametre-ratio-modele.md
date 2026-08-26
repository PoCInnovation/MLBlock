---
id: parametre-ratio-modele
title: Variante paramètre — ratio et modèle
difficulty: facile
description: Apprends à configurer les paramètres d'un bloc pour affiner ton pipeline, comme tu passerais des arguments à une fonction.
seo:
  title: Variante paramètre ratio et modèle — MLBlock
  description: Cours débutant pour apprendre à modifier les paramètres d'un bloc dans un pipeline de régression CSV avec MLBlock.
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
    select_columns: "Ajoute Sélectionner Colonnes pour définir ta cible et tes entrées."
    train_test_split: "Ajoute Diviser les données et modifie son paramètre ratio à 0.2."
    linear_regression: "Choisis Régression Linéaire comme modèle."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate_regression: "Termine avec Évaluer Régression pour observer l'impact du ratio."
---

## Étape 1 — Charger CSV

Glisse le bloc **Charger CSV** depuis la catégorie Données sur le canvas. Il lira le fichier de données que tu veux utiliser.

## Étape 2 — Sélectionner les colonnes

Ajoute **Sélectionner Colonnes** depuis Préparer et branche-le sur la sortie de Charger CSV. Définis quelle colonne est la cible à prédire et lesquelles sont les entrées.

## Étape 3 — Diviser les données

Glisse **Diviser les données** depuis Préparer et connecte-le à la sortie de Sélectionner Colonnes. Ce bloc produit deux sorties, une pour l'entraînement et une pour le test.

## Étape 4 — Configurer le ratio

Clique sur **Diviser les données** pour ouvrir ses paramètres. Modifie le ratio à `0.2` pour réserver 20 % des données au test. Ce paramètre correspond à l'argument que tu passerais dans un appel de fonction Python.

## Étape 5 — Choisir le modèle

Ajoute **Régression Linéaire** depuis la catégorie Modèles sur le canvas. Ce modèle apprendra à prédire des valeurs numériques à partir des colonnes sélectionnées.

## Étape 6 — Entraîner

Glisse **Entraîner le modèle** depuis Entraîner et connecte-le à la sortie d'entraînement de Diviser les données. Connecte-y aussi Régression Linéaire : ce bloc prend deux entrées, les données et le modèle à entraîner.

## Étape 7 — Démarrer

Ajoute **Évaluer Régression** depuis Tester et connecte ses deux entrées : la sortie d'Entraîner le modèle et la sortie de test de Diviser les données. Clique sur **Démarrer** pour observer comment le ratio influence les métriques affichées.
