Edited Definition.md
Viewed Definition.md:1-23

Voici les 4 différences fondamentales qui séparent le **Double DQN** (qui est une méthode purement *Value-Based*) des méthodes **Actor-Critic** :

### 1. Ce que les réseaux produisent (La Sortie)
* **Double DQN :** Les deux réseaux (Principal et Target) produisent des **scores de valeur (Q-Values)**. Par exemple, pour l'état actuel, le réseau sortira : `[10.5, 2.1, 15.8, -4.0]`. Il ne sait faire que ça : donner des notes.
* **Actor-Critic :** L'Acteur produit des **probabilités d'actions** (ex: `[10%, 5%, 80%, 5%]`). Le Critique, lui, produit un score de valeur.

### 2. Comment l'action est choisie (La Politique)
* **Double DQN :** La politique est **implicite**. Puisque le réseau ne donne que des notes, pour choisir une action on est obligé d'appliquer une règle mathématique par-dessus : on prend l'index de la meilleure note (`argmax`). Pour forcer l'exploration, on doit rajouter une surcouche artificielle : l'algorithme *Epsilon-Greedy* (on lance un dé pour agir au hasard de temps en temps).
* **Actor-Critic :** La politique est **explicite et stochastique**. L'Acteur définit exactement comment agir. Pour choisir une action, l'agent "tire au sort" en respectant les probabilités données par l'Acteur. L'exploration est donc *native* : tant que l'Acteur n'est pas sûr à 100%, il y a une chance qu'il essaye autre chose.

### 3. La méthode d'entraînement (Les Mathématiques)
* **Double DQN :** Il s'entraîne uniquement par **Régression (Erreur TD / Bellman)**. L'objectif est simplement que la note prédite soit la plus proche possible de la "vraie" note (Récompense + Valeur future). Il n'y a pas de concept d'encouragement ou de punition probabiliste.
* **Actor-Critic :** Il utilise le **Policy Gradient (Gradient de Politique)**. Le Critique calcule un "Avantage" (Est-ce que l'action prise était meilleure ou pire que ce qu'on attendait en moyenne ?). Ensuite, on modifie les poids de l'Acteur pour :
  - *Augmenter* la probabilité de l'action si l'Avantage était positif.
  - *Diminuer* la probabilité de l'action si l'Avantage était négatif.

### 4. La gestion des actions (Discret vs Continu)
* **Double DQN :** Il est **bloqué dans les mondes discrets** (gauche, droite, haut, bas). Pourquoi ? Parce que pour trouver la meilleure valeur future, il doit calculer le score de *toutes* les actions possibles et faire un `max`. Si l'action est un chiffre à virgule (ex: puissance du moteur à 42.5%), il y a une infinité d'actions possibles, le `max` devient impossible à calculer rapidement.
* **Actor-Critic :** Il est le **roi des mondes continus**. L'Acteur n'a pas besoin de calculer toutes les possibilités. Il lui suffit de sortir, par exemple, la "Moyenne" et "l'Écart-Type" d'une courbe de Gauss pour définir la poussée idéale du moteur. 

**En résumé pour vos notes** : Le Double DQN a deux têtes qui ne font qu'estimer des valeurs (pour corriger un biais mathématique de surestimation). L'Actor-Critic a deux têtes avec des métiers radicalement différents (l'une agit, l'autre juge).


Pour votre projet *Lunar Lander*, **c'est la technique n°1 que vous devriez utiliser pour votre partie "Ablation" ou pour briller lors de la soutenance** (Deliverable : *benchmark different techniques*), car elle demande de modifier à peine deux lignes de code par rapport au DQN standard.

Voici l'explication simple de son fonctionnement et de ce qu'il résout.

### 1. Le problème du DQN classique : La Surestimation (Overestimation Bias)
Dans le DQN classique, lorsqu'on calcule la "Cible" (ce que le réseau devrait idéalement prédire), on utilise l'équation de Bellman. Pour calculer la valeur de l'état suivant, on prend l'action qui a la valeur Q maximale selon le Target Net :

> $Y_{DQN} = Récompense + \gamma * \mathbf{\max_a} \big[ Q_{target}(État_{suivant}, a) \big]$

**Le défaut :** Le même réseau (le *Target Net*) fait deux choses à la fois : 
1. Il **choisit** quelle est la meilleure action.
2. Il **évalue** la valeur de cette action.

À cause des imprécisions naturelles du réseau de neurones (surtout au début de l'entraînement), certaines actions reçoivent des valeurs Q artificiellement trop hautes (du bruit). L'opérateur $\max$ va systématiquement sélectionner ces valeurs surestimées. Conséquence : **le DQN devient trop optimiste**. Il pense que certains états sont bien meilleurs qu'ils ne le sont en réalité, ce qui ralentit ou fait crasher l'apprentissage.

### 2. La solution du Double DQN (DDQN)
L'idée de génie du Double DQN est de **séparer le choix de l'action de son évaluation**, en utilisant les *deux* réseaux que vous avez déjà construits (le Réseau Principal et le Target Net).

* **Étape 1 (Le Choix) :** On utilise le **Réseau Principal** (celui qui est mis à jour tout le temps) pour trouver *quelle action* est la meilleure dans l'état suivant.
> $Action_{idéale} = \mathbf{argmax_a} \big[ Q_{principal}(État_{suivant}, a) \big]$

* **Étape 2 (L'Évaluation) :** On demande au **Target Net** de nous dire *quelle est la valeur* de cette action précise.
> $Y_{DoubleDQN} = Récompense + \gamma * Q_{target}(État_{suivant}, Action_{idéale})$

En découplant ces deux rôles, si le réseau principal s'emballe et choisit une action au hasard à cause du bruit, le Target Net donnera une évaluation beaucoup plus réaliste et neutre de cette action. La surestimation disparaît presque totalement !

### 3. Comment l'intégrer dans votre code PyTorch
Si vous avez déjà votre code DQN, voici la différence dans le calcul de la *Loss* (méthode `learn()`) :

**DQN Classique (En PyTorch)** :
```python
# Le Target Net choisit l'action ET donne la valeur
next_q_values = target_net(next_states).max(dim=1)[0]
expected_q_values = rewards + (gamma * next_q_values * (1 - dones))
```

**Double DQN (En PyTorch)** :
```python
# 1. Le Policy Net CHOISIT la meilleure action
best_actions = policy_net(next_states).argmax(dim=1).unsqueeze(1)

# 2. Le Target Net ÉVALUE cette action
next_q_values = target_net(next_states).gather(1, best_actions).squeeze(1)

expected_q_values = rewards + (gamma * next_q_values * (1 - dones))
```

**Bilan :** En changeant juste ces lignes, vous stabilisez énormément l'apprentissage de votre atterrisseur lunaire, et cela vous donne un excellent sujet de comparaison (DQN vs Double DQN) pour vos graphiques dans le rapport de 4 à 6 pages !

#ReinforcementLearning/ValueBased #DQN #DoubleDQN
