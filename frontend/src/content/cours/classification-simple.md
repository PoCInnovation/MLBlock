---
id: classification-simple
title: Classification simple
difficulty: facile
description: Entraîne un modèle à reconnaître des catégories, oui/non, A/B, depuis un fichier CSV.
seo:
  title: Classification simple — MLBlock
  description: Cours débutant pour construire un pipeline de classification à partir d'un CSV avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: selectionner
      type: select_columns
    - id: encoder
      type: label_encoder
    - id: diviser
      type: train_test_split
    - id: modele
      type: decision_tree
    - id: entrainer
      type: train_model
    - id: evaluer
      type: evaluate_classification
  edges:
    - from: charger-csv
      to: selectionner
    - from: selectionner
      to: encoder
    - from: encoder
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
    select_columns: "Ajoute Sélectionner Colonnes pour définir la colonne cible catégorielle."
    label_encoder: "Ajoute Encoder Catégories pour convertir les étiquettes en valeurs numériques."
    train_test_split: "Ajoute Diviser les données pour créer train/test."
    decision_tree: "Choisis Classification Arbre depuis Modèles."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate_classification: "Termine avec Évaluer Classification pour voir précision, rappel et F1."
---

## Étape 1 — Charger CSV

Glisse le bloc **Charger CSV** depuis la catégorie Données sur le canvas. Assure-toi de pointer vers un fichier dont la colonne cible contient bien des catégories (oui/non, rouge/bleu, 0/1).

## Étape 2 — Sélectionner les colonnes

Ajoute **Sélectionner Colonnes** depuis Préparer et relie la sortie de Charger CSV à son entrée. Indique quelle colonne est la cible à prédire et lesquelles sont les entrées numériques ou textuelles.

## Étape 3 — Encoder les catégories

Glisse **Encoder Catégories** depuis Préparer et connecte-le à la sortie de Sélectionner Colonnes. Ce bloc convertit les étiquettes textuelles en valeurs numériques que le modèle peut lire.

## Étape 4 — Diviser les données

Ajoute **Diviser les données** depuis Préparer et connecte-le à la sortie d'Encoder Catégories. Il sépare tes données en un jeu d'entraînement et un jeu de test.

## Étape 5 — Choisir le modèle

Glisse **Classification Arbre** depuis la catégorie Modèles sur le canvas. Ce type de modèle est adapté pour prédire des catégories discrètes.

## Étape 6 — Entraîner

Ajoute **Entraîner le modèle** depuis Entraîner et branche-le sur la sortie d'entraînement de Diviser les données. Connecte-y aussi Classification Arbre : ce bloc prend deux entrées, les données et le modèle.

## Étape 7 — Démarrer

Glisse **Évaluer Classification** depuis Tester sur le canvas. Connecte la sortie d'Entraîner le modèle d'un côté, et la sortie de test de Diviser les données de l'autre. Clique sur **Démarrer** pour voir les métriques de classification : précision, rappel et F1.
