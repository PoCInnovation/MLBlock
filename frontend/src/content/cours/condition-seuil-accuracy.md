---
id: condition-seuil-accuracy
title: Condition sur seuil d'accuracy
difficulty: difficile
description: Construis un pipeline qui évalue un modèle et ajuste sa configuration si les performances sont insuffisantes.
seo:
  title: Condition sur seuil d'accuracy — MLBlock
  description: Cours avancé pour évaluer un classifieur et itérer sur le ratio train/test.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: normaliser
      type: standard_scaler
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
      to: normaliser
    - from: normaliser
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
    standard_scaler: "Ajoute Standard Scaler avant l'entraînement."
    train_test_split: "Ajoute Train-Test Split et note son ratio."
    decision_tree: "Choisis Decision Tree comme modèle à évaluer."
    train_model: "Ajoute Train Model pour lancer l'entraînement."
    evaluate: "Ajoute Evaluate Model : c'est sur ses métriques que tu jugeras."
---

## Intro

Dans ce cours, tu vas construire un pipeline qui évalue un modèle, puis prend une décision selon ses performances. Si l'accuracy est en dessous du seuil que tu auras défini (par exemple 0.75), tu ajustes la séparation des données avec un ratio différent et tu réentraînes le modèle. Si l'accuracy est satisfaisante, tu passes directement au résultat final.

> Note : les blocs de contrôle conditionnel n'existent pas encore dans le catalogue. La boucle « évaluer → ajuster → relancer » se fait ici manuellement, en suivant les étapes ci-dessous.

## Étape 1 — Charger CSV

Glisse un bloc **Load CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. Il fournira les données que le pipeline tentera d'optimiser.

## Étape 2 — Normaliser

Ajoute un bloc **Standard Scaler** (`standard_scaler`) et connecte-le à la sortie du bloc **Load CSV**. Il harmonise les échelles des variables avant l'entraînement.

## Étape 3 — Séparer les données

Ajoute un bloc **Train-Test Split** (`train_test_split`) et relie la sortie du bloc **Standard Scaler** à son entrée. Note le ratio actuel — tu le modifieras si l'accuracy est insuffisante. Ce bloc produit deux sorties, entraînement et test.

## Étape 4 — Choisir le modèle

Glisse un bloc **Decision Tree** (`decision_tree`) sur le canvas. Ce modèle sera entraîné en premier, avant de juger si ses performances sont acceptables.

## Étape 5 — Entraîner

Ajoute un bloc **Train Model** (`train_model`) et branche-le sur la sortie d'entraînement du bloc **Train-Test Split**. Connecte-y aussi le bloc **Decision Tree** : ce bloc prend deux entrées, les données et le modèle.

## Étape 6 — Évaluer

Glisse un bloc **Evaluate Model** (`evaluate`). Ce bloc prend deux entrées : connecte la sortie du bloc **Train Model** d'un côté, et la sortie de test du bloc **Train-Test Split** de l'autre. Il produit les métriques sur lesquelles la condition sera évaluée.

## Étape 7 — Décider du seuil

Lance le pipeline et lis l'accuracy dans le bloc **Evaluate Model**. Si elle est sous 0.75 : change le ratio du bloc **Train-Test Split** (par exemple 0.2 → 0.3), relance, et compare. Sinon, garde le résultat final.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement : ajuste le ratio et relance tant que le seuil n'est pas atteint, puis conserve le meilleur résultat.
