# Sélecteur

**Comparaison de features**
Apprends à inspecter visuellement tes colonnes avant de choisir lesquelles conserver pour l'entraînement.

---

# Intro

**Comparaison de features**

Dans ce tuto, tu vas construire un pipeline qui commence par une étape d'inspection visuelle de tes données avant de sélectionner les colonnes à utiliser. Tu compareras deux features de ton jeu de données pour décider laquelle est la plus pertinente, puis tu poursuivras avec la sélection, l'entraînement et l'évaluation habituels. Cette étape d'exploration t'évite de nourrir ton modèle avec des variables inutiles ou redondantes.

---

# Étape 1

Glisse un bloc [BLOC CHARGER CSV] depuis la catégorie [CATEGORIE DONNEES] sur le canvas. Ce bloc charge l'intégralité du jeu de données, toutes colonnes incluses, pour que tu puisses les explorer avant de faire un choix.

---

# Étape 2

Ajoute un bloc [BLOC INSPECTER COLONNES] depuis [CATEGORIE PREPARER] et relie la sortie du bloc [BLOC CHARGER CSV] à son entrée. Ce bloc affiche des statistiques descriptives pour chaque colonne, ce qui te donnera une première idée de la distribution de tes variables.

---

# Étape 3

Glisse un bloc [BLOC VISUALISER FEATURE] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC CHARGER CSV]. Paramètre-le sur la première colonne que tu souhaites comparer. Ce bloc produit une représentation graphique de la distribution de la feature sélectionnée.

---

# Étape 4

Ajoute un deuxième bloc [BLOC VISUALISER FEATURE] depuis [CATEGORIE PREPARER] et connecte-le aussi à la sortie du bloc [BLOC CHARGER CSV]. Paramètre-le sur la deuxième colonne candidate. Compare les deux visualisations pour décider laquelle des deux features est la plus informative pour ta prédiction.

---

# Étape 5

Glisse un bloc [BLOC SELECTIONNER COLONNES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC CHARGER CSV]. En t'appuyant sur ce que tu viens d'observer, choisis les colonnes à conserver, en excluant la feature que tu juges moins pertinente.

---

# Étape 6

Ajoute un bloc [BLOC DIVISER DONNEES] depuis [CATEGORIE PREPARER] et connecte-le à la sortie du bloc [BLOC SELECTIONNER COLONNES]. Il partage les données entre jeu d'entraînement et jeu de test. Ce bloc produit deux sorties distinctes.

---

# Étape 7

Glisse un bloc [BLOC REGRESSION LINEAIRE] depuis [CATEGORIE MODELE] sur le canvas. Ce modèle apprendra à prédire à partir des features que tu as sélectionnées.

---

# Étape 8

Ajoute un bloc [BLOC ENTRAINER] depuis [CATEGORIE ENTRAINER] et branche-le sur la sortie d'entraînement du bloc [BLOC DIVISER DONNEES]. Connecte-y aussi le bloc [BLOC REGRESSION LINEAIRE] : ce bloc prend deux entrées, les données et le modèle à entraîner.

---

# Étape 9

Glisse un bloc [BLOC EVALUER REGRESSION] depuis [CATEGORIE TESTER] sur le canvas. Ce bloc prend deux entrées : connecte la sortie du bloc [BLOC ENTRAINER] d'un côté, et la sortie de test du bloc [BLOC DIVISER DONNEES] de l'autre. Il mesure l'impact de ton choix de features sur les performances finales du modèle.

---

# Lancement

Le pipeline est prêt. Clique sur le bouton de lancement et vérifie dans le bloc [BLOC EVALUER REGRESSION] si le choix de features que tu as fait améliore les métriques par rapport à un pipeline sans inspection préalable.
