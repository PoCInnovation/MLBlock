# Sélecteur

**Nettoyage et normalisation**
Apprends à traiter un CSV imparfait, avec des valeurs manquantes et des échelles incohérentes, avant de l'entraîner.

---

# Intro

**Nettoyage et normalisation**

Dans ce tuto, tu vas travailler avec un jeu de données CSV un peu plus sale qu'à l'habitude : certaines lignes contiennent des valeurs manquantes et les colonnes numériques ont des échelles très différentes. Tu ajouteras deux étapes de préparation supplémentaires, un bloc pour combler les valeurs manquantes et un bloc pour normaliser les échelles, avant de passer à l'entraînement et à l'évaluation. Ces étapes de nettoyage sont indispensables pour éviter que le modèle ne soit biaisé par des données incomplètes ou déséquilibrées.

---

# Étape 1

Glisse un bloc [BLOC CHARGER CSV] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. Pointe vers le fichier CSV contenant des valeurs manquantes et des colonnes à échelles variables.

---

# Étape 2

Ajoute un bloc [BLOC SELECTIONNER COLONNES] depuis [CATEGORIE PREPARER] et branche-le sur la sortie du bloc [BLOC CHARGER CSV]. Indique quelle colonne est la cible à prédire et lesquelles sont les entrées à conserver.

---

# Étape 3

Glisse un bloc [BLOC IMPUTER VALEURS MANQUANTES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC SELECTIONNER COLONNES]. Ce bloc remplace les cellules vides par une valeur statistique (la moyenne ou la médiane de la colonne), ce qui évite que le modèle plante sur des données incomplètes.

---

# Étape 4

Ajoute un bloc [BLOC NORMALISER] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC IMPUTER VALEURS MANQUANTES]. Il ramène toutes les colonnes numériques dans un même intervalle afin qu'aucune variable ne domine les autres à cause de son échelle.

---

# Étape 5

Glisse un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC NORMALISER]. Il partage les données entre jeu d'entraînement et jeu de test. Ce bloc produit deux sorties distinctes.

---

# Étape 6

Ajoute un bloc [BLOC REGRESSION LINEAIRE] depuis [CATEGORIE MODELE] sur le canvas. Ce modèle apprendra à prédire des valeurs numériques à partir des colonnes nettoyées et normalisées.

---

# Étape 7

Glisse un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et connecte-le à la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y aussi le bloc [BLOC REGRESSION LINEAIRE] : ce bloc prend deux entrées, les données et le modèle.

---

# Étape 8

Ajoute un bloc [BLOC EVALUER REGRESSION] depuis [CATEGORIE TESTER] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il affiche les métriques de performance sur les données de test.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement et observe comment le nettoyage et la normalisation influencent les métriques affichées par le bloc [BLOC EVALUER REGRESSION].
