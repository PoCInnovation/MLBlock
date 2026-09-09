---
id: comparaison-features
title: Comparaison de features
difficulty: moyen
description: Apprends à inspecter tes colonnes avant de choisir lesquelles conserver pour l'entraînement.
seo:
  title: Comparaison de features — MLBlock
  description: Cours intermédiaire pour comparer les variables d'un CSV et mesurer l'impact sur les performances.
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
    train_test_split: "Ajoute Séparer train/test pour créer train/test."
    linear_regression: "Choisis Régression linéaire comme modèle."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate: "Termine avec Évaluer le modèle pour mesurer l'impact de ton choix."
---

## Intro

Dans ce cours, tu vas construire un pipeline qui commence par une réflexion sur tes données avant de sélectionner les colonnes à utiliser. Tu compareras deux features de ton jeu de données pour décider laquelle est la plus pertinente, puis tu poursuivras avec l'entraînement et l'évaluation habituels. Cette étape d'exploration t'évite de nourrir ton modèle avec des variables inutiles ou redondantes.

> Note : les blocs d'inspection visuelle n'existent pas encore dans le catalogue. Fais l'exploration dans ton tableur, puis construis ici le pipeline final avec les colonnes retenues.

## Étape 1 — Charger CSV

Glisse un bloc **Charger un CSV** (`load_csv`) depuis la catégorie **Données** sur le canvas. Ce bloc charge l'intégralité du jeu de données pour que tu puisses l'exploiter.

## Étape 2 — Explorer (hors canvas)

Ouvre ton CSV dans un tableur : compare les distributions de tes deux colonnes candidates (moyenne, écart-type, valeurs extrêmes). Décide laquelle garder pour la prédiction.

## Étape 3 — Séparer les données

Ajoute un bloc **Séparer train/test** (`train_test_split`) et connecte-le à la sortie du bloc **Charger un CSV**. Il partage les données entre jeu d'entraînement et jeu de test. Ce bloc produit deux sorties distinctes.

## Étape 4 — Choisir le modèle

Glisse un bloc **Régression linéaire** (`linear_regression`) depuis la catégorie **Modèles** sur le canvas. Ce modèle apprendra à prédire à partir des features que tu as sélectionnées.

## Étape 5 — Entraîner

Ajoute un bloc **Entraîner le modèle** (`train_model`) et branche-le sur la sortie d'entraînement du bloc **Séparer train/test**. Connecte-y aussi le bloc **Régression linéaire** : ce bloc prend deux entrées, les données et le modèle à entraîner.

## Étape 6 — Évaluer

Glisse un bloc **Évaluer le modèle** (`evaluate`) sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc **Entraîner le modèle** d'un côté, et la sortie de test du bloc **Séparer train/test** de l'autre. Il mesure l'impact de ton choix de features sur les performances finales.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement et vérifie dans le bloc **Évaluer le modèle** si ton choix de features améliore les métriques.
