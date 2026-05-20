Le **DQN (Deep Q-Network)** est un algorithme fondamental d'Apprentissage par Renforcement (RL). C'est celui qui a été popularisé par DeepMind en 2013 pour apprendre à jouer aux jeux Atari à partir des pixels. 

Dans le cadre de votre projet *Lunar Lander* (où vous devez implémenter un agent avec un MLP, un replay buffer, un target net et epsilon-greedy decay), **c'est exactement l'algorithme DQN classique que vous devez coder de A à Z !**

Voici comment le DQN fonctionne et pourquoi ces différents éléments sont nécessaires :

### 1. Le principe de base : Q-Learning + Réseau de Neurones
En Q-Learning classique, on maintient un tableau (Q-Table) qui stocke la "qualité" (la valeur attendue) de prendre une Action `a` dans un État `s`. 
Cependant, dans *Lunar Lander*, l'état est un vecteur continu de 8 dimensions (positions, vitesses, angles...). Il y a donc une infinité d'états possibles.
Le **DQN résout ce problème en remplaçant la Q-Table par un réseau de neurones** (le MLP : *Multi-Layer Perceptron*). Le réseau prend l'état `s` en entrée et prédit les valeurs `Q(s, a)` pour toutes les actions possibles en sortie.

### 2. Les 3 innovations majeures du DQN
Entraîner un réseau de neurones directement avec du Q-Learning est très instable. Le DQN a introduit des solutions élégantes pour stabiliser l'apprentissage (celles demandées par votre sujet) :

#### A. Le Replay Buffer (Mémoire d'expérience)
* **Le problème** : Si on entraîne le réseau pas-à-pas avec les données au fur et à mesure que l'agent joue, les données sont très corrélées (l'état `t` ressemble beaucoup à l'état `t+1`). Cela détruit l'apprentissage du réseau.
* **La solution (Replay Buffer)** : L'agent stocke chaque transition `(état, action, récompense, état_suivant, done)` dans une mémoire de taille fixe. Pendant l'entraînement, il pioche un **batch aléatoire** (par exemple 64 ou 128 transitions) dans cette mémoire. Cela casse la corrélation entre les données temporelles.

#### B. Le Target Network (Réseau cible)
* **Le problème** : Dans l'équation de Bellman, la cible (ce que le réseau doit essayer de prédire) dépend de `Q(s_suivant, meilleure_action)`. Si on utilise le même réseau pour calculer cette cible *et* pour faire la mise à jour, la cible bouge constamment à chaque itération. C'est comme essayer de toucher une cible mouvante, ce qui mène à des divergences.
* **La solution (Target Net)** : On crée une copie du réseau principal appelée le *Target Network*. On utilise ce Target Network pour calculer la valeur cible. Ses poids sont "gelés" et ne sont mis à jour (copiés depuis le réseau principal) que périodiquement (ex: tous les 1000 steps).

#### C. L'Epsilon-Greedy Decay (Exploration vs Exploitation)
* **Le problème** : Si l'agent choisit toujours l'action qui a la meilleure valeur estimée (exploitation), il risque de se bloquer dans un comportement sous-optimal sans jamais découvrir qu'une autre stratégie rapporte plus de points (exploration).
* **La solution (Epsilon-Greedy)** : À chaque étape, avec une probabilité $\epsilon$, l'agent choisit une action au hasard (exploration). Sinon (probabilité $1 - \epsilon$), il choisit la meilleure action selon son réseau (exploitation). On commence avec un $\epsilon$ élevé (ex: 1.0, très aléatoire) et on le fait diminuer progressivement (*decay*) vers une petite valeur (ex: 0.05) au fur et à mesure que le réseau s'améliore.

### 3. Comment structurer votre code (avec PyTorch)

Voici les blocs dont vous aurez besoin pour votre projet :

1. **La classe Network (le MLP)** : Héritera de `torch.nn.Module`. Elle aura une couche d'entrée (taille 8), 2 ou 3 couches cachées avec l'activation `ReLU`, et une couche de sortie (taille 4, correspondant aux 4 actions discrètes du Lunar Lander).
2. **La classe ReplayBuffer** : Une classe python simple (souvent utilisant un `collections.deque` ou des numpy arrays pré-alloués) avec des méthodes `add(transition)` et `sample(batch_size)`.
3. **L'Agent** : 
   - Contient `policy_net` (réseau principal pour agir et apprendre) et `target_net` (pour les cibles).
   - Une méthode `act(state)` qui implémente la logique Epsilon-Greedy.
   - Une méthode `learn()` qui pioche un batch du Replay Buffer, calcule la *Loss* (souvent MSE ou Huber Loss/Smooth L1) entre la prédiction et la cible de Bellman, puis fait une étape de descente de gradient via l'optimiseur (`torch.optim.Adam` généralement).

En maîtrisant ces concepts, vous validerez les critères fondamentaux du projet *START TREK*. Si vous le souhaitez, nous pourrons générer le pseudo-code ou la structure PyTorch de l'un de ces composants !

#ReinforcementLearning/ValueBased #DQN
