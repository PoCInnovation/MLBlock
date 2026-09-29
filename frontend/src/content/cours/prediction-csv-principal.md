---
id: prediction-csv-principal
title: Prédiction sur CSV simple
difficulty: facile
description: Construis ton premier pipeline de bout en bout, du fichier de données au résultat, sans écrire une ligne de code.
seo:
  title: Prédiction sur CSV simple — MLBlock
  description: Cours débutant pour construire un pipeline complet de régression depuis un CSV avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: separer
      type: train_test_split
    - id: modele
      type: linear_regression
    - id: entrainer
      type: train_model
    - id: evaluer
      type: evaluate
  edges:
    - from: charger-csv
      to: separer
    - from: separer
      to: entrainer
    - from: modele
      to: entrainer
    - from: entrainer
      to: evaluer
    - from: separer
      to: evaluer
  hints:
    load_csv: "Glisse le bloc Load CSV depuis Données."
    train_test_split: "Ajoute Train-Test Split pour créer train/test."
    linear_regression: "Choisis Linear Regression comme modèle."
    train_model: "Ajoute Train Model pour lancer l'entraînement."
    evaluate: "Termine avec Evaluate Model pour voir les prédictions."
---

## Intro

Dans ce cours, tu vas construire un pipeline complet pour prédire une valeur à partir d'un fichier CSV. Tu commenceras par charger tes données, tu les prépareras pour l'entraînement, tu choisiras un modèle, puis tu évalueras ses performances. À la fin, tu auras un pipeline fonctionnel qui prédit des valeurs numériques sur de nouvelles données.

## Étape 1 — Charger CSV

Glisse un bloc **Load CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. C'est lui qui lit ton fichier et alimente tout le reste du pipeline.

## Étape 2 — Séparer les données

Ajoute un bloc **Train-Test Split** (`train_test_split`) et connecte-le à la sortie du bloc **Load CSV**. Il sépare automatiquement tes données en deux parties : une pour entraîner le modèle, une pour le tester. Ce bloc produit deux sorties distinctes.

## Étape 3 — Choisir le modèle

Ajoute un bloc **Linear Regression** (`linear_regression`) depuis la catégorie **Modèles** sur le canvas. C'est le modèle qui va apprendre à prédire des valeurs numériques à partir de tes données.

## Étape 4 — Entraîner

Glisse un bloc **Train Model** (`train_model`) et relie-le à la sortie d'entraînement du bloc **Train-Test Split**. Ce bloc prend deux entrées : connecte-y aussi le bloc **Linear Regression** pour lui indiquer quel modèle entraîner.

## Étape 5 — Évaluer

Ajoute un bloc **Evaluate Model** (`evaluate`) sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc **Train Model** d'un côté, et la sortie de test du bloc **Train-Test Split** de l'autre. Il calcule les métriques de performance sur des données que le modèle n'a jamais vues.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour l'exécuter, les résultats d'évaluation s'afficheront directement dans le bloc **Evaluate Model**.
