# MLBlock — Découverte complète de l'application

> **Niveau** : primaire (9-11 ans) et collège (11-15 ans) — parcours différenciés
> **Durée** : 1 séance de 60 minutes
> **Matériel** : un ordinateur par élève ou par binôme, accès internet
> **Prérequis** : savoir glisser-déposer des éléments à l'écran

Ce document est un **tour d'horizon de l'application MLBlock** : il permet d'avoir une vue d'ensemble de ce que l'on peut faire, de toutes les briques disponibles et du fonctionnement complet d'un programme d'IA.

---

## Objectifs

À la fin de la séance, l'élève sait :

- expliquer en une phrase ce qu'est MLBlock (« le Scratch de l'IA ») ;
- décrire les grandes étapes d'un programme d'IA ;
- citer les grandes familles de blocs et donner un exemple pour chacune ;
- expliquer ce que fait chaque partie de l'application (palette, canvas, console, résultats).

---

## Déroulé de la séance (60 min)

| Durée | Activité |
|---|---|
| 10 min | Introduction : c'est quoi l'IA ? |
| 20 min | Visite guidée de l'application, zone par zone |
| 20 min | Les 13 familles de blocs et ce qu'elles permettent |
| 10 min | Exemples de projets possibles + quizz |

---

## 1. Introduction : c'est quoi l'IA ? (10 min)

### Pour les primaires (9-11 ans)

> « Quand tu apprends à reconnaître un chien, tu as déjà vu plein de chiens. Ton cerveau a regardé des exemples : le museau, les oreilles, la queue. L'ordinateur, lui, n'a pas d'yeux. Il faut lui **montrer** des exemples pour qu'il apprenne tout seul. C'est ça, l'intelligence artificielle : un ordinateur qui apprend en regardant beaucoup d'exemples. »

**Question à poser à la classe** : *« Comment as-tu appris à reconnaître une pomme d'une poire ? »*
→ Réponse attendue : en en voyant beaucoup, en les comparant, en se trompant parfois.

### Pour les collégiens (11-15 ans)

> « L'intelligence artificielle, c'est un programme qui apprend à partir de données au lieu de recevoir toutes les règles écrites à l'avance. On parle d'**apprentissage machine** (machine learning). Le programme observe des **exemples**, il cherche des **régularités**, puis il s'en sert pour **prédire** sur de nouvelles données qu'il n'a jamais vues. »

**Trois mots à retenir** :

- **Donnée** : une information (une mesure, un chiffre, une image…).
- **Modèle** : le programme qui apprend à partir des données.
- **Entraîner** : montrer des exemples au modèle pour qu'il s'améliore.

---

## 2. MLBlock, c'est quoi ? (5 min)

**MLBlock est « le Scratch de l'IA »** : une application en ligne où l'on fabrique des programmes d'intelligence artificielle **sans écrire une seule ligne de code**. Comme dans Scratch, on **glisse-dépose** des briques colorées, appelées **blocs**, sur une feuille de travail. Chaque bloc fait une petite action. En les reliant entre eux, on construit une **chaîne de traitement** complète : c'est ce qu'on appelle un **pipeline**.

Ce qui est magique : derrière les blocs, l'application écrit toute seule le code (en langage Python) qui fait tourner le vrai programme d'IA. **Tu construis visuellement, l'ordinateur code pour toi.**

### La méthode avancée

Pendant cette séance, nous utiliserons la **méthode avancée** de MLBlock : le mode qui affiche la **palette complète de blocs** et le **canvas libre**, où l'on assemble les briques de A à Z, sans assistant ni raccourci. C'est la méthode la plus exigeante… et celle qui permet de vraiment comprendre ce qui se passe sous le capot.

---

## 3. Visite guidée : les 4 zones de l'écran (15 min)

L'écran de travail se compose de 4 zones à repérer ensemble :

### ① La palette de blocs (à gauche)
La bibliothèque de toutes les briques disponibles, rangées par **catégories colorées**. On peut chercher un bloc par son nom avec la barre de recherche.

### ② Le canvas (la grande zone au centre)
La **feuille de travail**. On y dépose les blocs et on les relie. C'est ici que se dessine le pipeline, comme un schéma.

### ③ Les blocs eux-mêmes
Chaque brique a :
- des **entrées** (pastilles à gauche) : les informations dont elle a besoin ;
- des **sorties** (pastilles à droite) : les informations qu'elle produit ;
- des **paramètres** (champs réglables) : les boutons de réglage du bloc.

On relie une sortie à une entrée avec un **trait** pour faire circuler l'information.

> 💡 **Règle d'or** : l'information circule de **gauche à droite**, comme dans une chaîne de montage : les données entrent, le modèle apprend, le résultat sort.

### ④ Le bouton Exécuter et la console (en bas)
Le bouton **Exécuter** lance le programme. La **console** affiche la progression et les résultats, avec des messages colorés. Les résultats finaux apparaissent dans l'onglet **Résultats** : graphiques, courbes, images, scores…

---

## 4. Les 13 familles de blocs (20 min)

Voici tout ce que l'application permet de faire, famille par famille. Montrer un exemple de bloc pour chacune.

### 🔴 Les données — « nourrir » l'IA
- **Données** 🟢 : charger un fichier CSV, des images, des textes, des jeux de données classiques (comme les fleurs d'iris), séparer entraînement/test, créer des fenêtres de séquence.
- **Chargement** 🟣 : charger un dataset d'entraînement et le découper.
- **Transformations** 🟠 : normaliser, redimensionner, convertir des données en tenseurs, recadrer, retourner des images.

### 🟠 Les modèles — « faire apprendre »
- **Modèles** 🟡 : les grands classiques du machine learning — forêt aléatoire, arbre de décision, k-means (regroupement), régression linéaire, SVM, PCA…
- **Regroupement** 🟡 : pools (moyen, maximum, adaptatif) pour réduire les images.
- **Convolution** 🔵 : les couches qui « regardent » les images (convolution 1D/2D/3D, embedding, couches linéaires, dropout).
- **Normalisation** 🟢 : stabiliser les valeurs (batch norm, layer norm).
- **Activation** 🔴 : les « interrupteurs » mathématiques des neurones (ReLU, sigmoïde, tanh, softmax…).
- **Séquences** 🟣 : comprendre l'ordre des choses — RNN, LSTM, GRU, attention multi-têtes (utile pour les textes et les séries temporelles).

### 🔵 L'entraînement — « vérifier et améliorer »
- **Entraînement** 🔴 : les optimiseurs (Adam, SGD), les fonctions de perte (erreur, entropie croisée), entraîner une époque ou un modèle complet, évaluer (précision, MSE, F1), arrêt précoce, matrices de confusion.
- **Renforcement** 🟠 : l'IA qui apprend par essais et erreurs — créer un environnement (comme CartPole), Q-learning, évaluer un agent. C'est la branche des jeux vidéo !

### 📝 Les textes — comprendre le langage
- **Texte** 🟣 : découper un texte en tokens, construire un vocabulaire, encoder les mots en indices. C'est le début du traitement du langage naturel.

### 📊 La visualisation — voir les résultats
- **Visualisation** 🌸 : tracer les prédictions d'un modèle sur un graphique.

---

## 5. Le cycle complet d'un projet d'IA (10 min)

Un pipeline MLBlock suit toujours le même cycle. C'est LA grande idée à retenir :

```
1. Données     2. Préparation     3. Modèle      4. Entraînement      5. Évaluation
  (charger)      (nettoyer,          (choisir       (faire apprendre      (mesurer la
                 séparer)             l'algo)        sur les exemples)     performance)
                                                                              │
                                                              Résultats (scores, graphiques)
```

**Exemples de projets que l'on peut construire :**

| Projet | Familles utilisées | Ce que fait l'IA |
|---|---|---|
| **Classer des fleurs d'iris** | Données + Modèles + Entraînement | Devine l'espèce à partir des mesures |
| **Reconnaître des chiffres manuscrits** (MNIST) | Chargement + Convolution + Entraînement | Lit des chiffres dessinés à la main |
| **Regrouper des clients** (clustering) | Données + Modèles | Découvre des groupes sans qu'on les lui donne |
| **Comprendre un texte** (tokenisation) | Texte | Découpe et encode les mots |
| **Équilibrer un bâton** (CartPole) | Renforcement | Un agent apprend par essais et erreurs |
| **Prévoir une série temporelle** | Données + Séquences + Entraînement | Anticipe la suite d'une courbe (météo, trafic…) |

---

## 6. Quizz de clôture (5 min)

Vrai ou faux ? (corrigé pour l'enseignant en italique)

1. **MLBlock permet de coder de l'IA sans écrire de code.** → *Vrai, on assemble des blocs visuels.*
2. **L'information circule de droite à gauche dans un pipeline.** → *Faux, de gauche à droite.*
3. **La console affiche les résultats du programme.** → *Vrai.*
4. **Les modèles de renforcement apprennent par essais et erreurs.** → *Vrai, comme pour CartPole.*
5. **On ne peut construire qu'un seul type de projet.** → *Faux, classification, images, textes, jeux…*

---

## 7. Fiche enseignant

### Préparation en amont
- Vérifier que l'application est accessible et qu'un compte élève existe (ou utiliser le mode de démonstration).
- Ouvrir la palette pour repérer les 13 catégories avant la séance.
- Préparer un écran de projection pour montrer chaque zone et chaque famille de blocs.

### Pièges à surveiller
- **Blocs non reliés** : rappeler qu'une sortie doit être branchée à une entrée.
- **Paramètres vides** : certains blocs exigent un réglage (colonne cible, ratio…) avant de fonctionner.
- **Erreur au lancement** : lire le message en rouge dans la console avec la classe — c'est l'occasion d'apprendre à déboguer.

### Prolongements possibles
- **Atelier pratique** : suivre la fiche « Classer des fleurs d'iris » (activité guidée pas à pas avec 4 blocs).
- **Sciences** : les élèves mesurent de vraies feuilles et créent leur propre fichier de données.
- **EMC / esprit critique** : quand peut-on faire confiance à une IA ? (biais, données insuffisantes…)

### Compétences travaillées (référentiel)
- Comprendre et modéliser un problème simple (maths, sciences).
- Raisonner par étapes (algorithme) et lire un résultat.
- Adopter une démarche d'investigation : émettre une hypothèse, la tester, conclure.

---

## Glossaire illustré

| Mot | Définition simple |
|---|---|
| **IA / intelligence artificielle** | Un ordinateur qui apprend à partir d'exemples au lieu de suivre des règles écrites à l'avance. |
| **MLBlock** | Une application en ligne, « le Scratch de l'IA », pour fabriquer des programmes d'IA en assemblant des blocs sans coder. |
| **Bloc** | Une brique visuelle qui fait une petite action (charger, entraîner, évaluer…). |
| **Pipeline** | La chaîne de blocs reliés qui forment un programme complet. |
| **Donnée** | Une information : une mesure, un nombre, une image, un mot. |
| **Dataset / jeu de données** | Une collection d'exemples utilisés par l'IA. |
| **Modèle** | Le programme qui apprend à partir des données pour faire des prédictions. |
| **Entraînement** | La phase où le modèle regarde des exemples pour apprendre. |
| **Évaluation** | La phase où on mesure la performance du modèle sur des données de test. |
| **Précision (accuracy)** | La proportion de bonnes réponses, entre 0 et 1 (1 = 100 %). |
| **Classification** | Deviner à quelle catégorie appartient un exemple (quelle espèce de fleur ?). |
| **Clustering** | Regrouper des exemples similaires sans qu'on ait donné les groupes à l'avance. |
| **Renforcement** | Une IA qui apprend par essais et erreurs (comme dans un jeu vidéo). |