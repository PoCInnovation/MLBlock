---
id: prediction-image
title: Prédiction sur image
difficulty: moyen
description: Apprends à charger un jeu d'images, à le convertir en données exploitables, puis à entraîner un modèle dessus.
seo:
  title: Prédiction sur image — MLBlock
  description: Cours intermédiaire pour classifier des images avec redimensionnement et tenseurs.
expected:
  nodes:
    - id: charger-images
      type: load_image
    - id: redimensionner
      type: resize
    - id: convertir
      type: to_tensor
    - id: normaliser
      type: normalize
    - id: separer
      type: random_split
    - id: modele
      type: logistic_regression
    - id: entrainer
      type: train_model
    - id: evaluer
      type: evaluate
  edges:
    - from: charger-images
      to: redimensionner
    - from: redimensionner
      to: convertir
    - from: convertir
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
    load_image: "Glisse le bloc Load Image depuis Données."
    resize: "Ajoute Resize pour uniformiser les tailles."
    to_tensor: "Ajoute Image to Tensor pour passer en pixels exploitables."
    normalize: "Ajoute Normalize Tensor pour stabiliser l'entraînement."
    random_split: "Ajoute Random Split pour créer train/test."
    logistic_regression: "Choisis Logistic Regression comme classifieur."
    train_model: "Ajoute Train Model pour lancer l'entraînement."
    evaluate: "Termine avec Evaluate Model sur des images jamais vues."
---

## Intro

Dans ce cours, tu vas construire un pipeline qui prend en entrée des images plutôt qu'un fichier CSV. Tu chargeras les images, tu les convertiras en tableau de pixels que le modèle peut lire, tu appliqueras une normalisation, puis tu entraîneras un modèle de classification et tu évalueras ses résultats.

## Étape 1 — Charger les images

Glisse un bloc **Load Image** (`load_image`) depuis la catégorie **Données** sur le canvas. Indique le chemin vers tes images.

## Étape 2 — Redimensionner

Ajoute un bloc **Resize** (`resize`) et connecte-le à la sortie du bloc **Load Image**. Définis la taille cible en pixels pour que toutes les images aient les mêmes dimensions avant la conversion.

## Étape 3 — Convertir en tenseur

Glisse un bloc **Image to Tensor** (`to_tensor`) et connecte-le à la sortie du bloc **Resize**. Ce bloc transforme chaque image en valeurs numériques que les modèles peuvent traiter.

## Étape 4 — Normaliser

Ajoute un bloc **Normalize Tensor** (`normalize`) et connecte-le à la sortie du bloc **Image to Tensor**. Il ramène les valeurs de pixels (0-255) dans un intervalle standard, ce qui stabilise l'entraînement du modèle.

## Étape 5 — Séparer les données

Glisse un bloc **Random Split** (`random_split`) et connecte-le à la sortie du bloc **Normalize Tensor**. Il sépare les données en jeu d'entraînement et jeu de test. Ce bloc produit deux sorties distinctes.

## Étape 6 — Choisir le modèle

Ajoute un bloc **Logistic Regression** (`logistic_regression`) depuis la catégorie **Modèles** sur le canvas. Ce classifieur linéaire est adapté pour débuter sur des images converties en vecteurs.

## Étape 7 — Entraîner

Glisse un bloc **Train Model** (`train_model`) et relie-le à la sortie d'entraînement du bloc **Random Split**. Connecte-y aussi le bloc **Logistic Regression** : ce bloc prend deux entrées, les données et le modèle à entraîner.

## Étape 8 — Évaluer

Ajoute un bloc **Evaluate Model** (`evaluate`) sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc **Train Model** d'un côté, et la sortie de test du bloc **Random Split** de l'autre.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour l'exécuter, les résultats apparaîtront dans le bloc **Evaluate Model**.
