---
id: predire-valeur-csv
title: Prédire une valeur depuis un CSV
difficulty: facile
description: Apprends à prédire une valeur continue à partir d’un fichier CSV en 7 étapes, du chargement à l’évaluation.
seo:
  title: Prédire une valeur depuis un CSV — MLBlock
  description: Cours débutant pour construire un pipeline de régression à partir d’un CSV avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: separer
      type: train_test_split
    - id: normaliser
      type: standard_scaler
    - id: modele
      type: linear_regression
    - id: entrainer
      type: train_model
    - id: perte
      type: mse_loss
    - id: evaluer
      type: evaluate
  edges:
    - from: charger-csv
      to: separer
    - from: separer
      to: normaliser
    - from: normaliser
      to: modele
    - from: modele
      to: entrainer
    - from: entrainer
      to: perte
    - from: perte
      to: evaluer
    - from: separer
      to: evaluer
  hints:
    load_csv: "Glisse le bloc Charger CSV depuis Données."
    train_test_split: "Ajoute Séparer les données pour créer train/test."
    standard_scaler: "Normalise les données avec Standard Scaler."
    linear_regression: "Choisis Régression Linéaire comme modèle."
    train_model: "Ajoute Entraîner le modèle pour lancer l’entraînement."
    mse_loss: "Utilise Perte MSE pour la régression."
    evaluate: "Termine avec Évaluer pour voir les prédictions."
---

## Étape 1 — Charger CSV

Importe ton fichier CSV avec le bloc **Charger CSV**. Ce bloc lit le fichier et expose un DataFrame pour la suite du pipeline.

> Astuce : vérifie que ton CSV contient une colonne cible numérique.

## Étape 2 — Séparer les données

Utilise **Séparer les données** (`train_test_split`) pour diviser ton jeu en entraînement et test. Par défaut 80 % / 20 %.

## Étape 3 — Normaliser

Applique **Standard Scaler** pour centrer et réduire les features.

## Étape 4 — Choisir le modèle

Ajoute **Régression Linéaire** depuis la catégorie Modèles.

## Étape 5 — Entraîner

Connecte le modèle à **Entraîner le modèle** (`train_model`).

## Étape 6 — Calculer la perte

Ajoute **Perte MSE** (`mse_loss`) pour mesurer l’erreur quadratique moyenne.

## Étape 7 — Démarrer

Branche tout et clique sur **Démarrer** dans l’éditeur.
