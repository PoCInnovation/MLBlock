---
id: comparaison-modeles
title: Comparaison de deux modèles
difficulty: difficile
description: Entraîne deux modèles en parallèle sur les mêmes données et compare leurs performances.
seo:
  title: Comparaison de deux modèles — MLBlock
  description: Cours avancé pour entraîner régression linéaire et forêt aléatoire sur le même jeu et comparer.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: normaliser
      type: standard_scaler
    - id: separer
      type: train_test_split
    - id: modele-a
      type: linear_regression
    - id: entrainer-a
      type: train_model
    - id: evaluer-a
      type: evaluate
    - id: modele-b
      type: random_forest
    - id: entrainer-b
      type: train_model
    - id: evaluer-b
      type: evaluate
  edges:
    - from: charger-csv
      to: normaliser
    - from: normaliser
      to: separer
    - from: separer
      to: entrainer-a
    - from: modele-a
      to: entrainer-a
    - from: entrainer-a
      to: evaluer-a
    - from: separer
      to: evaluer-a
    - from: separer
      to: entrainer-b
    - from: modele-b
      to: entrainer-b
    - from: entrainer-b
      to: evaluer-b
    - from: separer
      to: evaluer-b
  hints:
    load_csv: "Glisse le bloc Charger un CSV depuis Données."
    standard_scaler: "Ajoute Mise à l'échelle standard avant les deux branches."
    train_test_split: "Ajoute Séparer train/test pour alimenter les deux branches."
    linear_regression: "Choisis Régression linéaire comme premier modèle."
    random_forest: "Choisis Forêt aléatoire comme deuxième modèle."
    train_model: "Ajoute Entraîner le modèle dans chaque branche."
    evaluate: "Ajoute Évaluer le modèle dans chaque branche pour comparer."
---

## Intro

Dans ce cours, tu vas construire un pipeline qui entraîne deux modèles différents sur le même jeu de données préparé, puis qui compare leurs performances. Tu utiliseras un bloc de séparation pour alimenter deux branches d'entraînement en parallèle et tu évalueras chaque modèle séparément.

> Note : le bloc de contrôle automatique (sélection du meilleur modèle) n'existe pas encore dans le catalogue. La comparaison se fait ici en lisant les deux blocs **Évaluer le modèle** et en retenant le meilleur score.

## Étape 1 — Charger CSV

Glisse un bloc **Charger un CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. Il fournira les données communes aux deux branches du pipeline.

## Étape 2 — Normaliser

Ajoute un bloc **Mise à l'échelle standard** (`standard_scaler`) et connecte-le à la sortie du bloc **Charger un CSV**. Il harmonise les échelles avant que les données partent dans les deux branches.

## Étape 3 — Séparer les données

Ajoute un bloc **Séparer train/test** (`train_test_split`) et relie la sortie du bloc **Mise à l'échelle standard** à son entrée. Ce bloc produit deux sorties qui alimenteront les deux branches de modèles.

## Étape 4 — Branche A : régression linéaire

Glisse un bloc **Régression linéaire** (`linear_regression`) sur le canvas. Ce sera le premier modèle de la comparaison.

## Étape 5 — Entraîner la branche A

Ajoute un bloc **Entraîner le modèle** (`train_model`) et branche-le sur la sortie d'entraînement du bloc **Séparer train/test**. Connecte-y aussi le bloc **Régression linéaire**. C'est la branche d'entraînement du premier modèle.

## Étape 6 — Branche B : forêt aléatoire

Glisse un bloc **Forêt aléatoire** (`random_forest`) sur le canvas. Ce sera le deuxième modèle à comparer avec le premier.

## Étape 7 — Entraîner la branche B

Ajoute un deuxième bloc **Entraîner le modèle** (`train_model`) et connecte-le à la sortie d'entraînement du bloc **Séparer train/test**. Connecte-y le bloc **Forêt aléatoire**. C'est la branche d'entraînement parallèle du deuxième modèle.

## Étape 8 — Évaluer les deux branches

Ajoute deux blocs **Évaluer le modèle** (`evaluate`). Pour chacun : connecte la sortie du bloc **Entraîner le modèle** de la branche d'un côté, et la sortie de test du bloc **Séparer train/test** de l'autre.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour exécuter les deux branches en parallèle, puis compare les métriques des deux blocs **Évaluer le modèle** pour désigner le vainqueur.
