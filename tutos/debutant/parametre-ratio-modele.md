# Sélecteur

**Variante paramètre : ratio et modèle**
Apprends à configurer les paramètres d'un bloc pour affiner ton pipeline, comme tu passerais des arguments à une fonction.

---

# Intro

**Variante paramètre : ratio et modèle**

Dans ce tuto, tu vas construire le même pipeline de prédiction CSV qu'en introduction, mais cette fois tu apprendras à modifier les paramètres d'un bloc plutôt que de laisser les valeurs par défaut. Tu choisiras toi-même le ratio de séparation entraînement/test, ce qui te permettra de comprendre comment chaque paramètre influence le comportement du pipeline.

---

# Étape 1

Glisse un bloc [BLOC CHARGER CSV] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. Il lira le fichier de données que tu veux utiliser.

---

# Étape 2

Ajoute un bloc [BLOC SELECTIONNER COLONNES] depuis [CATEGORIE PREPARER] et branche-le sur la sortie du bloc [BLOC CHARGER CSV]. Définis quelle colonne est la cible à prédire et lesquelles sont les entrées.

---

# Étape 3

Glisse un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC SELECTIONNER COLONNES]. Ce bloc produit deux sorties, une pour l'entraînement et une pour le test.

---

# Étape 4

Clique sur le bloc [BLOC DIVISER DONNEES] pour ouvrir ses paramètres. Modifie le paramètre de ratio pour passer à 0.2, ce qui réserve 20 % des données au test au lieu de la valeur par défaut. Observe comment ce chiffre correspond à l'argument que tu passerais dans un appel de fonction Python.

---

# Étape 5

Ajoute un bloc [BLOC REGRESSION LINEAIRE] depuis [CATEGORIE MODELE] sur le canvas. Ce modèle apprendra à prédire des valeurs numériques à partir des colonnes sélectionnées.

---

# Étape 6

Glisse un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et connecte-le à la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y aussi le bloc [BLOC REGRESSION LINEAIRE] : ce bloc prend deux entrées, les données et le modèle à entraîner.

---

# Étape 7

Ajoute un bloc [BLOC EVALUER REGRESSION] depuis [CATEGORIE TESTER]. Connecte la sortie du bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Ce bloc a deux entrées pour pouvoir comparer les prédictions du modèle aux vraies valeurs.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement pour l'exécuter et observe comment le ratio que tu as choisi influence les métriques affichées par le bloc [BLOC EVALUER REGRESSION].
