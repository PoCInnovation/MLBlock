# Sélecteur

**Comparaison de deux modèles avec branchement Contrôle**
Entraîne deux modèles en parallèle sur les mêmes données et laisse le pipeline choisir automatiquement le meilleur.

---

# Intro

**Comparaison de deux modèles avec branchement Contrôle**

Dans ce tuto, tu vas construire un pipeline qui entraîne deux modèles différents sur le même jeu de données préparé, puis qui sélectionne automatiquement le meilleur grâce à un bloc de contrôle. Tu utiliseras un bloc de séparation pour alimenter deux branches d'entraînement en parallèle, tu évalueras chaque modèle séparément, puis tu relieras les deux résultats à un bloc [CATEGORIE CONTROLE] qui compare les métriques et décide lequel est le plus performant.

---

# Étape 1

Glisse un bloc [BLOC CHARGER CSV] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. Il fournira les données communes aux deux branches du pipeline.

---

# Étape 2

Ajoute un bloc [BLOC SELECTIONNER COLONNES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC CHARGER CSV]. Définis la colonne cible et les colonnes d'entrée.

---

# Étape 3

Glisse un bloc [BLOC NORMALISER] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC SELECTIONNER COLONNES]. Il harmonise les échelles avant que les données partent dans les deux branches.

---

# Étape 4

Ajoute un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et relie la sortie du bloc [BLOC NORMALISER] à son entrée. Ce bloc produit deux sorties, la sortie d'entraînement et la sortie de test, qui alimenteront les deux branches de modèles.

---

# Étape 5

Glisse un bloc [BLOC REGRESSION LINEAIRE] depuis [CATEGORIE MODELE] sur le canvas. Ce sera le premier modèle de la comparaison.

---

# Étape 6

Ajoute un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et branche-le sur la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y aussi le bloc [BLOC REGRESSION LINEAIRE] : ce bloc prend deux entrées, les données et le modèle. C'est la branche d'entraînement du premier modèle.

---

# Étape 7

Glisse un bloc [BLOC REGRESSION FORET] depuis [CATEGORIE MODELE] sur le canvas. Ce sera le deuxième modèle à comparer avec le premier.

---

# Étape 8

Ajoute un deuxième bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et connecte-le à la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y le bloc [BLOC REGRESSION FORET] : ce bloc prend aussi deux entrées, les données et le modèle. C'est la branche d'entraînement parallèle du deuxième modèle.

---

# Étape 9

Glisse un bloc [BLOC EVALUER REGRESSION] depuis [CATEGORIE TESTER] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du premier bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il produit les métriques du premier modèle.

---

# Étape 10

Ajoute un deuxième bloc [BLOC EVALUER REGRESSION] depuis [CATEGORIE TESTER] sur le canvas. Connecte la sortie du deuxième bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il produit les métriques du deuxième modèle.

---

# Étape 11

Glisse un bloc [BLOC COMPARER RESULTATS] depuis [CATEGORIE CONTROLE] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du premier bloc [BLOC EVALUER REGRESSION] d'un côté, et la sortie du deuxième bloc [BLOC EVALUER REGRESSION] de l'autre. Il compare automatiquement les métriques et sélectionne le modèle le plus performant.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour exécuter les deux branches en parallèle, le bloc [BLOC COMPARER RESULTATS] affichera quel modèle a obtenu les meilleures métriques.
