---
id: classification-simple
title: Classification simple
difficulty: facile
description: Entraîne un modèle à reconnaître des catégories, oui/non, A/B, depuis un fichier CSV.
seo:
  title: Classification simple — MLBlock
  description: Cours débutant pour prédire une catégorie depuis un CSV avec un arbre de décision.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: separer
      type: train_test_split
    - id: modele
      type: decision_tree
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
    decision_tree: "Choisis Decision Tree comme modèle de classification."
    train_model: "Ajoute Train Model pour lancer l'entraînement."
    evaluate: "Termine avec Evaluate Model pour voir précision, rappel et F1."
---

## Intro

Dans ce cours, tu vas construire un pipeline pour prédire une catégorie plutôt qu'une valeur numérique. À partir d'un fichier CSV dont la colonne cible contient des étiquettes (oui/non, rouge/bleu, 0/1), tu chargeras les données, tu les prépareras, tu choisiras un modèle de classification et tu évalueras ses résultats avec des métriques adaptées.

## Étape 1 — Charger CSV

Glisse un bloc **Load CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. Assure-toi de pointer vers un fichier dont la colonne cible contient bien des catégories.

## Étape 2 — Séparer les données

Ajoute un bloc **Train-Test Split** (`train_test_split`) et relie la sortie du bloc **Load CSV** à son entrée. Il sépare les données en un jeu d'entraînement et un jeu de test. Ce bloc produit deux sorties distinctes.

> Note : l'encodage des catégories textuelles se fait actuellement en dehors du canvas. Utilise un CSV avec une cible déjà numérique (0/1) pour ce cours.

## Étape 3 — Choisir le modèle

Glisse un bloc **Decision Tree** (`decision_tree`) depuis la catégorie **Modèles** sur le canvas. Ce type de modèle est adapté pour prédire des catégories discrètes.

## Étape 4 — Entraîner

Ajoute un bloc **Train Model** (`train_model`) et branche-le sur la sortie d'entraînement du bloc **Train-Test Split**. Connecte-y aussi le bloc **Decision Tree** : ce bloc prend deux entrées, les données et le modèle.

## Étape 5 — Évaluer

Glisse un bloc **Evaluate Model** (`evaluate`) sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc **Train Model** d'un côté, et la sortie de test du bloc **Train-Test Split** de l'autre. Il affiche les métriques de classification.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement et consulte les métriques de classification affichées par le bloc **Evaluate Model**.
