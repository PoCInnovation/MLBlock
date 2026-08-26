---
id: prediction-image
title: Prédiction sur image
difficulty: moyen
description: Apprends à charger un jeu d'images, à le convertir en données exploitables, puis à entraîner un modèle dessus.
seo:
  title: Prédiction sur image — MLBlock
  description: Cours intermédiaire pour construire un pipeline de classification d'images avec MLBlock.
expected:
  nodes:
    - id: charger-images
      type: load_images
    - id: redimensionner
      type: resize_images
    - id: convertir
      type: flatten_images
    - id: normaliser
      type: normalizer
    - id: diviser
      type: train_test_split
    - id: modele
      type: neural_network
    - id: entrainer
      type: train_model
    - id: evaluer
      type: evaluate_classification
  edges:
    - from: charger-images
      to: redimensionner
    - from: redimensionner
      to: convertir
    - from: convertir
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
    load_images: "Glisse Charger Images depuis Données et pointe vers ton dossier d'images."
    resize_images: "Ajoute Redimensionner Images pour uniformiser la taille des images."
    flatten_images: "Ajoute Convertir en Tableau pour transformer chaque image en vecteur de pixels."
    normalizer: "Ajoute Normaliser pour ramener les valeurs de pixels (0-255) dans un intervalle standard."
    train_test_split: "Ajoute Diviser les données pour créer train/test."
    neural_network: "Choisis Classification Réseau Neuronal depuis Modèles."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate_classification: "Termine avec Évaluer Classification pour voir les métriques sur les images de test."
---

## Étape 1 — Charger les images

Glisse le bloc **Charger Images** depuis la catégorie Données sur le canvas. Indique le chemin vers ton dossier d'images, chaque sous-dossier correspondant à une catégorie.

## Étape 2 — Redimensionner

Ajoute **Redimensionner Images** depuis Préparer et connecte-le à la sortie de Charger Images. Définis la taille cible en pixels pour que toutes les images aient les mêmes dimensions avant la conversion.

## Étape 3 — Convertir en tableau

Glisse **Convertir en Tableau** depuis Préparer et connecte-le à la sortie de Redimensionner Images. Ce bloc aplatit chaque image en un vecteur de valeurs numériques que les modèles peuvent traiter comme des colonnes de données.

## Étape 4 — Normaliser

Ajoute **Normaliser** depuis Préparer et connecte-le à la sortie de Convertir en Tableau. Il ramène les valeurs de pixels (0–255) dans un intervalle standard, ce qui stabilise l'entraînement.

## Étape 5 — Diviser les données

Glisse **Diviser les données** depuis Préparer et connecte-le à la sortie de Normaliser. Il sépare les données en jeu d'entraînement et jeu de test.

## Étape 6 — Choisir le modèle

Ajoute **Classification Réseau Neuronal** depuis la catégorie Modèles sur le canvas. Ce type de modèle est particulièrement adapté aux données d'image converties en vecteurs de pixels.

## Étape 7 — Entraîner

Glisse **Entraîner le modèle** depuis Entraîner et relie-le à la sortie d'entraînement de Diviser les données. Connecte-y aussi Classification Réseau Neuronal : ce bloc prend deux entrées, les données et le modèle.

## Étape 8 — Démarrer

Ajoute **Évaluer Classification** depuis Tester et connecte ses deux entrées : la sortie d'Entraîner le modèle et la sortie de test de Diviser les données. Clique sur **Démarrer** pour voir les résultats sur des images que le modèle n'a jamais vues.
