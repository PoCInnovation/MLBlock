# Sélecteur

**Prédiction sur image**
Apprends à charger un jeu d'images, à le convertir en données exploitables, puis à entraîner un modèle dessus.

---

# Intro

**Prédiction sur image**

Dans ce tuto, tu vas construire un pipeline qui prend en entrée un dossier d'images plutôt qu'un fichier CSV. Tu chargeras le jeu d'images, tu le convertiras en tableau de pixels que le modèle peut lire, tu appliqueras une normalisation, puis tu entraîneras un modèle de classification et tu évalueras ses résultats. Ce tuto introduit des blocs de préparation spécifiques aux données visuelles que tu ne trouves pas dans les pipelines CSV.

---

# Étape 1

Glisse un bloc [BLOC CHARGER IMAGES] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. Indique le chemin vers ton dossier d'images, chaque sous-dossier correspondant à une catégorie.

---

# Étape 2

Ajoute un bloc [BLOC REDIMENSIONNER IMAGES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC CHARGER IMAGES]. Définis la taille cible en pixels pour que toutes les images aient les mêmes dimensions avant la conversion.

---

# Étape 3

Glisse un bloc [BLOC CONVERTIR EN TABLEAU] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC REDIMENSIONNER IMAGES]. Ce bloc aplatit chaque image en un vecteur de valeurs numériques (pixels) que les modèles peuvent traiter comme des colonnes de données.

---

# Étape 4

Ajoute un bloc [BLOC NORMALISER] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC CONVERTIR EN TABLEAU]. Il ramène les valeurs de pixels (0-255) dans un intervalle standard, ce qui stabilise l'entraînement du modèle.

---

# Étape 5

Glisse un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC NORMALISER]. Il sépare les données en jeu d'entraînement et jeu de test. Ce bloc produit deux sorties distinctes.

---

# Étape 6

Ajoute un bloc [BLOC CLASSIFICATION RESEAU NEURONAL] depuis [CATEGORIE MODELE] sur le canvas. Ce type de modèle est particulièrement adapté aux données d'image converties en vecteurs de pixels.

---

# Étape 7

Glisse un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et relie-le à la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y aussi le bloc [BLOC CLASSIFICATION RESEAU NEURONAL] : ce bloc prend deux entrées, les données et le modèle à entraîner.

---

# Étape 8

Ajoute un bloc [BLOC EVALUER CLASSIFICATION] depuis [CATEGORIE TESTER] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il calcule les métriques de classification sur des images que le modèle n'a jamais vues.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour l'exécuter, les résultats apparaîtront dans le bloc [BLOC EVALUER CLASSIFICATION].
