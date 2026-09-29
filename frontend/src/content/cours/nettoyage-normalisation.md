---
id: nettoyage-normalisation
title: Nettoyage et normalisation
difficulty: moyen
description: Apprends à traiter un CSV imparfait, avec des valeurs manquantes et des échelles incohérentes, avant de l'entraîner.
seo:
  title: Nettoyage et normalisation — MLBlock
  description: Cours intermédiaire pour normaliser les échelles et préparer un CSV avant entraînement.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: normaliser
      type: standard_scaler
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
    standard_scaler: "Ajoute Standard Scaler pour harmoniser les échelles."
    train_test_split: "Ajoute Train-Test Split pour créer train/test."
    linear_regression: "Choisis Linear Regression comme modèle."
    train_model: "Ajoute Train Model pour lancer l'entraînement."
    evaluate: "Termine avec Evaluate Model pour voir l'effet du nettoyage."
---

## Intro

Dans ce cours, tu vas travailler avec un jeu de données CSV un peu plus sale qu'à l'habitude : certaines lignes contiennent des valeurs manquantes et les colonnes numériques ont des échelles très différentes. Tu ajouteras une étape de normalisation avant de passer à l'entraînement et à l'évaluation. Ces étapes de nettoyage sont indispensables pour éviter que le modèle ne soit biaisé.

> Note : le bloc d'imputation des valeurs manquantes n'existe pas encore dans le catalogue. Nettoie ton CSV en amont (supprime ou comble les cellules vides) avant de suivre ce cours.

## Étape 1 — Charger CSV

Glisse un bloc **Load CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. Pointe vers le fichier CSV contenant des colonnes à échelles variables.

## Étape 2 — Normaliser

Ajoute un bloc **Standard Scaler** (`standard_scaler`) et connecte-le à la sortie du bloc **Load CSV**. Il ramène toutes les colonnes numériques dans un même intervalle afin qu'aucune variable ne domine les autres à cause de son échelle.

## Étape 3 — Séparer les données

Glisse un bloc **Train-Test Split** (`train_test_split`) et connecte-le à la sortie du bloc **Standard Scaler**. Il partage les données entre jeu d'entraînement et jeu de test. Ce bloc produit deux sorties distinctes.

## Étape 4 — Choisir le modèle

Ajoute un bloc **Linear Regression** (`linear_regression`) depuis la catégorie **Modèles** sur le canvas. Ce modèle apprendra à prédire des valeurs numériques à partir des colonnes nettoyées et normalisées.

## Étape 5 — Entraîner

Glisse un bloc **Train Model** (`train_model`) et connecte-le à la sortie d'entraînement du bloc **Train-Test Split**. Connecte-y aussi le bloc **Linear Regression** : ce bloc prend deux entrées, les données et le modèle.

## Étape 6 — Évaluer

Ajoute un bloc **Evaluate Model** (`evaluate`) sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc **Train Model** d'un côté, et la sortie de test du bloc **Train-Test Split** de l'autre.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement et observe comment la normalisation influence les métriques affichées par le bloc **Evaluate Model**.
