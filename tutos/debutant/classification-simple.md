# Sélecteur

**Classification simple**
Entraîne un modèle à reconnaître des catégories, oui/non, A/B, depuis un fichier CSV.

---

# Intro

**Classification simple**

Dans ce tuto, tu vas construire un pipeline pour prédire une catégorie plutôt qu'une valeur numérique. À partir d'un fichier CSV dont la colonne cible contient des étiquettes (oui/non, rouge/bleu, 0/1), tu chargeras les données, tu les prépareras, tu choisiras un modèle de classification et tu évalueras ses résultats avec des métriques adaptées à ce type de problème.

---

# Étape 1

Glisse un bloc [BLOC CHARGER CSV] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. Assure-toi de pointer vers un fichier dont la colonne cible contient bien des catégories.

---

# Étape 2

Ajoute un bloc [BLOC SELECTIONNER COLONNES] depuis [CATEGORIE PREPARER] et relie la sortie du bloc [BLOC CHARGER CSV] à son entrée. Indique quelle colonne est la cible (la catégorie à prédire) et lesquelles sont les entrées numériques ou textuelles.

---

# Étape 3

Glisse un bloc [BLOC ENCODER CATEGORIES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC SELECTIONNER COLONNES]. Ce bloc convertit les étiquettes textuelles en valeurs numériques que le modèle peut lire.

---

# Étape 4

Ajoute un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC ENCODER CATEGORIES]. Il sépare les données en un jeu d'entraînement et un jeu de test. Ce bloc produit deux sorties distinctes.

---

# Étape 5

Glisse un bloc [BLOC CLASSIFICATION ARBRE] depuis [CATEGORIE MODELE] sur le canvas. Ce type de modèle est adapté pour prédire des catégories discrètes.

---

# Étape 6

Ajoute un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et branche-le sur la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y aussi le bloc [BLOC CLASSIFICATION ARBRE] : ce bloc prend deux entrées, les données et le modèle.

---

# Étape 7

Glisse un bloc [BLOC EVALUER CLASSIFICATION] depuis [CATEGORIE TESTER] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il affiche des métriques de classification, précision, rappel et F1.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement et consulte les métriques de classification affichées par le bloc [BLOC EVALUER CLASSIFICATION].
