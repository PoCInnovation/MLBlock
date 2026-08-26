---
id: nettoyage-normalisation
title: Nettoyage et normalisation
difficulty: moyen
description: Apprends à traiter un CSV imparfait, avec des valeurs manquantes et des échelles incohérentes, avant de l'entraîner.
seo:
  title: Nettoyage et normalisation — MLBlock
  description: Cours intermédiaire pour nettoyer et normaliser un jeu de données CSV avant l'entraînement avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: selectionner
      type: select_columns
    - id: imputer
      type: imputer
    - id: normaliser
      type: normalizer
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
      to: imputer
    - from: imputer
      to: normaliser
    - from: normaliser
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
    imputer: "Ajoute Imputer Valeurs Manquantes pour combler les cellules vides."
    normalizer: "Ajoute Normaliser pour ramener toutes les colonnes dans le même intervalle."
    train_test_split: "Ajoute Diviser les données pour créer train/test."
    linear_regression: "Choisis Régression Linéaire comme modèle."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate_regression: "Termine avec Évaluer Régression pour voir l'impact du nettoyage."
---

## Étape 1 — Charger CSV

Glisse le bloc **Charger CSV** depuis la catégorie Données sur le canvas. Pointe vers le fichier CSV contenant des valeurs manquantes et des colonnes à échelles variables.

## Étape 2 — Sélectionner les colonnes

Ajoute **Sélectionner Colonnes** depuis Préparer et branche-le sur la sortie de Charger CSV. Indique quelle colonne est la cible à prédire et lesquelles sont les entrées à conserver.

## Étape 3 — Imputer les valeurs manquantes

Glisse **Imputer Valeurs Manquantes** depuis Préparer et connecte-le à la sortie de Sélectionner Colonnes. Ce bloc remplace les cellules vides par une valeur statistique (moyenne ou médiane) pour éviter que le modèle plante sur des données incomplètes.

## Étape 4 — Normaliser

Ajoute **Normaliser** depuis Préparer et connecte-le à la sortie d'Imputer Valeurs Manquantes. Il ramène toutes les colonnes numériques dans un même intervalle afin qu'aucune variable ne domine les autres à cause de son échelle.

## Étape 5 — Diviser les données

Glisse **Diviser les données** depuis Préparer et connecte-le à la sortie de Normaliser. Il partage les données entre jeu d'entraînement et jeu de test.

## Étape 6 — Choisir le modèle

Ajoute **Régression Linéaire** depuis la catégorie Modèles sur le canvas. Ce modèle apprendra à prédire des valeurs numériques à partir des colonnes nettoyées et normalisées.

## Étape 7 — Entraîner

Glisse **Entraîner le modèle** depuis Entraîner et connecte-le à la sortie d'entraînement de Diviser les données. Connecte-y aussi Régression Linéaire : ce bloc prend deux entrées, les données et le modèle.

## Étape 8 — Démarrer

Ajoute **Évaluer Régression** depuis Tester et connecte ses deux entrées : la sortie d'Entraîner le modèle et la sortie de test de Diviser les données. Clique sur **Démarrer** pour observer comment le nettoyage et la normalisation influencent les métriques.
