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
    load_csv: "Glisse le bloc Charger un CSV depuis Données."
    standard_scaler: "Ajoute Mise à l'échelle standard avant l'entraînement."
    train_test_split: "Ajoute Séparer train/test et note son ratio."
    decision_tree: "Choisis Arbre de décision comme modèle à évaluer."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate: "Ajoute Évaluer le modèle : c'est sur ses métriques que tu jugeras."
---

## Intro

Dans ce cours, tu vas construire un pipeline qui évalue un modèle, puis prend une décision selon ses performances. Si l'accuracy est en dessous du seuil que tu auras défini (par exemple 0.75), tu ajustes la séparation des données avec un ratio différent et tu réentraînes le modèle. Si l'accuracy est satisfaisante, tu passes directement au résultat final.

> Note : les blocs de contrôle conditionnel n'existent pas encore dans le catalogue. La boucle « évaluer → ajuster → relancer » se fait ici manuellement, en suivant les étapes ci-dessous.

## Étape 1 — Charger CSV

Glisse un bloc **Charger un CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. Il fournira les données que le pipeline tentera d'optimiser.

## Étape 2 — Normaliser

Ajoute un bloc **Mise à l'échelle standard** (`standard_scaler`) et connecte-le à la sortie du bloc **Charger un CSV**. Il harmonise les échelles des variables avant l'entraînement.

## Étape 3 — Séparer les données

Ajoute un bloc **Séparer train/test** (`train_test_split`) et relie la sortie du bloc **Mise à l'échelle standard** à son entrée. Note le ratio actuel — tu le modifieras si l'accuracy est insuffisante. Ce bloc produit deux sorties, entraînement et test.

## Étape 4 — Choisir le modèle

Glisse un bloc **Arbre de décision** (`decision_tree`) sur le canvas. Ce modèle sera entraîné en premier, avant de juger si ses performances sont acceptables.

## Étape 5 — Entraîner

Ajoute un bloc **Entraîner le modèle** (`train_model`) et branche-le sur la sortie d'entraînement du bloc **Séparer train/test**. Connecte-y aussi le bloc **Arbre de décision** : ce bloc prend deux entrées, les données et le modèle.

## Étape 6 — Évaluer

Glisse un bloc **Évaluer le modèle** (`evaluate`). Ce bloc prend deux entrées : connecte la sortie du bloc **Entraîner le modèle** d'un côté, et la sortie de test du bloc **Séparer train/test** de l'autre. Il produit les métriques sur lesquelles la condition sera évaluée.

## Étape 7 — Décider du seuil

Lance le pipeline et lis l'accuracy dans le bloc **Évaluer le modèle**. Si elle est sous 0.75 : change le ratio du bloc **Séparer train/test** (par exemple 0.2 → 0.3), relance, et compare. Sinon, garde le résultat final.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement : ajuste le ratio et relance tant que le seuil n'est pas atteint, puis conserve le meilleur résultat.
