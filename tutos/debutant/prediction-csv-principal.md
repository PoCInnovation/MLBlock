# Sélecteur

**Prédiction sur CSV simple**
Construis ton premier pipeline de bout en bout, du fichier de données au résultat, sans écrire une ligne de code.

---

# Intro

**Prédiction sur CSV simple**

Dans ce tuto, tu vas construire un pipeline complet pour prédire une valeur à partir d'un fichier CSV. Tu commenceras par charger tes données, tu les prépareras pour l'entraînement, tu choisiras un modèle, puis tu évalueras ses performances. À la fin, tu auras un pipeline fonctionnel qui prédit des valeurs numériques sur de nouvelles données.

---

# Étape 1

Glisse un bloc [BLOC CHARGER CSV] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. C'est lui qui lit ton fichier et alimente tout le reste du pipeline.

---

# Étape 2

Ajoute un bloc [BLOC SELECTIONNER COLONNES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC CHARGER CSV]. Ce bloc te permet de choisir quelles colonnes du CSV utiliseront comme entrées et laquelle sera la valeur à prédire.

---

# Étape 3

Glisse un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC SELECTIONNER COLONNES]. Il sépare automatiquement tes données en deux parties : une pour entraîner le modèle, une pour le tester. Ce bloc produit deux sorties distinctes.

---

# Étape 4

Ajoute un bloc [BLOC REGRESSION LINEAIRE] depuis [CATEGORIE MODELE] sur le canvas. C'est le modèle qui va apprendre à prédire des valeurs numériques à partir de tes données.

---

# Étape 5

Glisse un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et relie-le à la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Ce bloc prend deux entrées : connecte-y aussi le bloc [BLOC REGRESSION LINEAIRE] pour lui indiquer quel modèle entraîner.

---

# Étape 6

Ajoute un bloc [BLOC EVALUER REGRESSION] depuis [CATEGORIE TESTER] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc [BLOC ENTRAINER] (le modèle entraîné) d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il calcule les métriques de performance sur des données que le modèle n'a jamais vues.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour l'exécuter, les résultats d'évaluation s'afficheront directement dans le bloc [BLOC EVALUER REGRESSION].
