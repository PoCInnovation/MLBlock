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
    load_image: "Glisse le bloc Charger une image depuis Données."
    resize: "Ajoute Redimensionnement pour uniformiser les tailles."
    to_tensor: "Ajoute Convertir en tenseur pour passer en pixels exploitables."
    normalize: "Ajoute Normaliser un tenseur pour stabiliser l'entraînement."
    random_split: "Ajoute Séparation aléatoire pour créer train/test."
    logistic_regression: "Choisis Régression logistique comme classifieur."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate: "Termine avec Évaluer le modèle sur des images jamais vues."
---

## Intro

Dans ce cours, tu vas construire un pipeline qui prend en entrée des images plutôt qu'un fichier CSV. Tu chargeras les images, tu les convertiras en tableau de pixels que le modèle peut lire, tu appliqueras une normalisation, puis tu entraîneras un modèle de classification et tu évalueras ses résultats.

## Étape 1 — Charger les images

Glisse un bloc **Charger une image** (`load_image`) depuis la catégorie **Données** sur le canvas. Indique le chemin vers tes images.

## Étape 2 — Redimensionner

Ajoute un bloc **Redimensionnement** (`resize`) et connecte-le à la sortie du bloc **Charger une image**. Définis la taille cible en pixels pour que toutes les images aient les mêmes dimensions avant la conversion.

## Étape 3 — Convertir en tenseur

Glisse un bloc **Convertir en tenseur** (`to_tensor`) et connecte-le à la sortie du bloc **Redimensionnement**. Ce bloc transforme chaque image en valeurs numériques que les modèles peuvent traiter.

## Étape 4 — Normaliser

Ajoute un bloc **Normaliser un tenseur** (`normalize`) et connecte-le à la sortie du bloc **Convertir en tenseur**. Il ramène les valeurs de pixels (0-255) dans un intervalle standard, ce qui stabilise l'entraînement du modèle.

## Étape 5 — Séparer les données

Glisse un bloc **Séparation aléatoire du dataset** (`random_split`) et connecte-le à la sortie du bloc **Normaliser**. Il sépare les données en jeu d'entraînement et jeu de test. Ce bloc produit deux sorties distinctes.

## Étape 6 — Choisir le modèle

Ajoute un bloc **Régression logistique** (`logistic_regression`) depuis la catégorie **Modèles** sur le canvas. Ce classifieur linéaire est adapté pour débuter sur des images converties en vecteurs.

## Étape 7 — Entraîner

Glisse un bloc **Entraîner le modèle** (`train_model`) et relie-le à la sortie d'entraînement du bloc **Séparation aléatoire**. Connecte-y aussi le bloc **Régression logistique** : ce bloc prend deux entrées, les données et le modèle à entraîner.

## Étape 8 — Évaluer

Ajoute un bloc **Évaluer le modèle** (`evaluate`) sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc **Entraîner le modèle** d'un côté, et la sortie de test du bloc **Séparation aléatoire** de l'autre.

## Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour l'exécuter, les résultats apparaîtront dans le bloc **Évaluer le modèle**.
