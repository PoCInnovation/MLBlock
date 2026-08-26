---
id: condition-seuil-accuracy
title: Condition sur seuil d'accuracy
difficulty: difficile
description: Construis un pipeline qui se reconfigure automatiquement si les performances sont insuffisantes.
seo:
  title: Condition sur seuil d'accuracy — MLBlock
  description: Cours avancé pour introduire la logique conditionnelle dans un pipeline ML avec MLBlock.
expected:
  nodes:
    - id: charger-csv
      type: load_csv
    - id: selectionner
      type: select_columns
    - id: normaliser
      type: normalizer
    - id: diviser
      type: train_test_split
    - id: modele
      type: decision_tree
    - id: entrainer
      type: train_model
    - id: evaluer
      type: evaluate_classification
    - id: condition
      type: condition_threshold
    - id: reajuster
      type: retry_split
    - id: resultat
      type: display_result
  edges:
    - from: charger-csv
      to: selectionner
    - from: selectionner
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
    - from: evaluer
      to: condition
    - from: condition
      to: reajuster
      fromPort: "false"
    - from: condition
      to: resultat
      fromPort: "true"
  hints:
    load_csv: "Glisse le bloc Charger CSV depuis Données."
    select_columns: "Ajoute Sélectionner Colonnes pour définir ta cible et tes entrées."
    normalizer: "Ajoute Normaliser pour harmoniser les échelles avant l'entraînement."
    train_test_split: "Ajoute Diviser les données et note le ratio actuel — tu le modifieras dans la branche de retry."
    decision_tree: "Choisis Classification Arbre depuis Modèles."
    train_model: "Ajoute Entraîner le modèle pour lancer l'entraînement."
    evaluate_classification: "Ajoute Évaluer Classification pour produire les métriques sur lesquelles la condition sera évaluée."
    condition_threshold: "Ajoute Condition Seuil depuis Contrôle et configure-le sur l'accuracy avec un seuil de 0.75."
    retry_split: "Connecte Réajuster Split à la sortie 'fausse' de Condition Seuil."
    display_result: "Connecte Afficher Résultat à la sortie 'vraie' de Condition Seuil."
---

## Étape 1 — Charger CSV

Glisse le bloc **Charger CSV** depuis la catégorie Données sur le canvas. Il fournira les données que le pipeline tentera d'optimiser automatiquement.

## Étape 2 — Sélectionner les colonnes

Ajoute **Sélectionner Colonnes** depuis Préparer et connecte-le à la sortie de Charger CSV. Définis la colonne cible et les colonnes d'entrée à conserver.

## Étape 3 — Normaliser

Glisse **Normaliser** depuis Préparer et connecte-le à la sortie de Sélectionner Colonnes. Il harmonise les échelles des variables avant l'entraînement.

## Étape 4 — Diviser les données

Ajoute **Diviser les données** depuis Préparer et relie la sortie de Normaliser à son entrée. Note le ratio actuel dans les paramètres, tu le modifieras dans la branche de retry. Ce bloc produit deux sorties, entraînement et test.

## Étape 5 — Choisir le modèle

Glisse **Classification Arbre** depuis la catégorie Modèles sur le canvas. Ce modèle sera entraîné en premier, avant que le pipeline ne juge si ses performances sont acceptables.

## Étape 6 — Entraîner

Ajoute **Entraîner le modèle** depuis Entraîner et branche-le sur la sortie d'entraînement de Diviser les données. Connecte-y aussi Classification Arbre : ce bloc prend deux entrées, les données et le modèle.

## Étape 7 — Évaluer

Glisse **Évaluer Classification** depuis Tester. Connecte la sortie d'Entraîner le modèle d'un côté, et la sortie de test de Diviser les données de l'autre. Il produit les métriques sur lesquelles la condition sera évaluée.

## Étape 8 — Condition sur seuil

Ajoute **Condition Seuil** depuis la catégorie Contrôle et connecte-le à la sortie d'Évaluer Classification. Paramètre-le sur la métrique `accuracy` avec un seuil de `0.75`. Ce bloc produit deux sorties : vraie si l'accuracy est suffisante, fausse sinon.

## Étape 9 — Branche de retry

Glisse **Réajuster Split** depuis Contrôle et connecte-le à la sortie « condition fausse » de Condition Seuil. Ce bloc réenvoie les données vers un nouveau Diviser les données avec un ratio ajusté, puis relance l'entraînement.

## Étape 10 — Démarrer

Ajoute **Afficher Résultat** depuis Tester et connecte-le à la sortie « condition vraie » de Condition Seuil. Clique sur **Démarrer** : si l'accuracy est insuffisante, le pipeline se reconfigura automatiquement avant d'afficher le résultat final.
