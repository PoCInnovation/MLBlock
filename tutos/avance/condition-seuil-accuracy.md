# Sélecteur

**Condition sur seuil d'accuracy**
Construis un pipeline qui se reconfigure automatiquement si les performances sont insuffisantes.

---

# Intro

**Condition sur seuil d'accuracy**

Dans ce tuto, tu vas construire un pipeline qui évalue un modèle, puis prend une décision automatique selon ses performances. Si l'accuracy est en dessous d'un seuil que tu auras défini, un bloc [CATEGORIE CONTROLE] relance la séparation des données avec un ratio différent et réentraîne le modèle. Si l'accuracy est satisfaisante, le pipeline passe directement au résultat final. Ce tuto introduit la logique conditionnelle dans un pipeline ML.

---

# Étape 1

Glisse un bloc [BLOC CHARGER CSV] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. Il fournira les données que le pipeline tentera d'optimiser automatiquement.

---

# Étape 2

Ajoute un bloc [BLOC SELECTIONNER COLONNES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC CHARGER CSV]. Définis la colonne cible et les colonnes d'entrée à conserver.

---

# Étape 3

Glisse un bloc [BLOC NORMALISER] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC SELECTIONNER COLONNES]. Il harmonise les échelles des variables avant l'entraînement.

---

# Étape 4

Ajoute un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et relie la sortie du bloc [BLOC NORMALISER] à son entrée. Clique sur ce bloc pour ouvrir ses paramètres et note le ratio actuel, tu le modifieras dans la branche conditionnelle plus loin. Ce bloc produit deux sorties, entraînement et test.

---

# Étape 5

Glisse un bloc [BLOC CLASSIFICATION ARBRE] depuis [CATEGORIE MODELE] sur le canvas. Ce modèle sera entraîné en premier, avant que le pipeline ne juge si ses performances sont acceptables.

---

# Étape 6

Ajoute un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et branche-le sur la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y aussi le bloc [BLOC CLASSIFICATION ARBRE] : ce bloc prend deux entrées, les données et le modèle.

---

# Étape 7

Glisse un bloc [BLOC EVALUER CLASSIFICATION] depuis [CATEGORIE TESTER] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il produit les métriques sur lesquelles la condition sera évaluée.

---

# Étape 8

Ajoute un bloc [BLOC CONDITION SEUIL] depuis [CATEGORIE CONTROLE] et connecte-le à la sortie du bloc [BLOC EVALUER CLASSIFICATION]. Paramètre-le avec la métrique à surveiller (accuracy) et le seuil en dessous duquel le pipeline doit se reconfigurer, par exemple 0.75. Ce bloc produit deux sorties : une si la condition est vraie (accuracy suffisante), une si elle est fausse (accuracy insuffisante).

---

# Étape 9

Glisse un bloc [BLOC REAJUSTER SPLIT] depuis [CATEGORIE CONTROLE] et connecte-le à la sortie "condition fausse" du bloc [BLOC CONDITION SEUIL]. Ce bloc réenvoie les données vers un nouveau bloc [BLOC DIVISER DONNEES] avec un ratio ajusté, puis relance l'entraînement sur la branche de retry.

---

# Étape 10

Ajoute un bloc [BLOC AFFICHER RESULTAT] depuis [CATEGORIE TESTER] et connecte-le à la sortie "condition vraie" du bloc [BLOC CONDITION SEUIL]. Ce bloc reçoit le modèle entraîné et ses métriques finales et les présente à l'utilisateur une fois le seuil atteint.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement : s'il le faut, le pipeline se reconfigura automatiquement avant d'afficher le résultat dans le bloc [BLOC AFFICHER RESULTAT].
