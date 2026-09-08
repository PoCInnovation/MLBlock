---
id: parametre-ratio-modele
title: Variante paramètre — ratio et modèle
difficulty: facile
description: Apprends à configurer les paramètres d'un bloc pour affiner ton pipeline, comme tu passerais des arguments à une fonction.
seo:
  title: Variante paramètre — ratio et modèle — MLBlock
  description: Cours débutant pour régler le ratio train/test et comprendre les paramètres des blocs.
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
    load_csv: "Glisse le bloc Charger un CSV depuis Données."
    train_test_split: "Ajoute Séparer train/test et règle son paramètre de ratio."
    linear_regression: "Choisis Régression linéaire comme modèle."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate: "Termine avec Évaluer le modèle pour observer l'effet du ratio."
---

## Intro

Dans ce cours, tu vas construire le même pipeline de prédiction CSV qu'en introduction, mais cette fois tu apprendras à modifier les paramètres d'un bloc plutôt que de laisser les valeurs par défaut. Tu choisiras toi-même le ratio de séparation entraînement/test, ce qui te permettra de comprendre comment chaque paramètre influence le comportement du pipeline.

## Étape 1 — Charger CSV

Glisse un bloc **Charger un CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. Il lira le fichier de données que tu veux utiliser.

## Étape 2 — Séparer les données

Ajoute un bloc **Séparer train/test** (`train_test_split`) et branche-le sur la sortie du bloc **Charger un CSV**. Ce bloc produit deux sorties, une pour l'entraînement et une pour le test.

## Étape 3 — Régler le ratio

Clique sur le bloc **Séparer train/test** pour ouvrir ses paramètres. Modifie le paramètre de ratio pour passer à 0.2, ce qui réserve 20 % des données au test au lieu de la valeur par défaut. Observe comment ce chiffre correspond à l'argument que tu passerais dans un appel de fonction Python.

## Étape 4 — Choisir le modèle

Ajoute un bloc **Régression linéaire** (`linear_regression`) depuis la catégorie **Modèles** sur le canvas. Ce modèle apprendra à prédire des valeurs numériques à partir des colonnes sélectionnées.

## Étape 5 — Entraîner

Glisse un bloc **Entraîner le modèle** (`train_model`) et connecte-le à la sortie d'entraînement du bloc **Séparer train/test**. Connecte-y aussi le bloc **Régression linéaire** : ce bloc prend deux entrées, les données et le modèle à entraîner.

## Étape 6 — Évaluer

Ajoute un bloc **Évaluer le modèle** (`evaluate`). Connecte la sortie du bloc **Entraîner le modèle** d'un côté, et la sortie de test du bloc **Séparer train/test** de l'autre. Ce bloc a deux entrées pour pouvoir comparer les prédictions du modèle aux vraies valeurs.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour l'exécuter et observe comment le ratio que tu as choisi influence les métriques affichées par le bloc **Évaluer le modèle**.
