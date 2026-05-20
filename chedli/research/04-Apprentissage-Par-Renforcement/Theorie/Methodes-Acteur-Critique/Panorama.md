Les méthodes **Acteur-Critique (Actor-Critic)** représentent aujourd'hui l'état de l'art dans la majorité des applications pratiques de l'Apprentissage par Renforcement. Elles tirent le meilleur des deux mondes : les méthodes basées sur la valeur (comme DQN) et les méthodes basées sur la politique (comme REINFORCE).

Voici une plongée en détail dans leur fonctionnement et les architectures phares de cette famille.

### 1. Le concept de base : L'intuition
Imagine un apprenti conducteur (l'**Acteur**) et son moniteur d'auto-école (le **Critique**).
*   **L'Acteur (Policy Network)** : Son rôle est de choisir quelle action prendre (ex: tourner le volant, freiner) en fonction de ce qu'il voit (l'état). Au début, il fait n'importe quoi.
*   **Le Critique (Value Network)** : Son rôle n'est pas de conduire, mais d'évaluer la situation. Il observe ce que fait l'Acteur et lui donne une note (ex: "Attention, tu as freiné trop tard, c'était dangereux").

Au fil du temps :
*   Le Critique devient de plus en plus précis dans ses évaluations.
*   L'Acteur utilise les retours du Critique pour améliorer sa conduite.

### 2. Comment ça fonctionne mathématiquement ?
Dans un réseau de neurones Actor-Critic, on a généralement deux sorties (qui peuvent partager les mêmes couches de base pour comprendre l'image/l'état) :

1.  **La Politique $\pi(a|s)$ (L'Acteur)** : Quelle est la probabilité de prendre l'action $a$ dans l'état $s$ ?
2.  **La Valeur $V(s)$ (Le Critique)** : Quel est le score total qu'on s'attend à gagner en partant de l'état $s$ ?

**Le concept clé : L'Avantage (Advantage $A$)**
Pour mettre à jour l'Acteur, on n'utilise pas juste la récompense brute, mais l'**Avantage**. 
$$A = \text{Récompense réelle obtenue} - \text{Récompense prédite par le Critique } V(s)$$
*   Si $A > 0$ : L'action était **meilleure** que prévu. On encourage l'Acteur à la refaire.
*   Si $A < 0$ : L'action était **pire** que prévu. On décourage l'Acteur.

---

### 3. Les Algorithmes Actor-Critic les plus connus

#### A. A2C / A3C (Advantage Actor-Critic / Asynchronous)
*   **L'idée** : L'apprentissage par renforcement classique est lent car l'agent explore un seul chemin à la fois. A3C crée **plusieurs agents clones** qui jouent en parallèle dans des environnements séparés.
*   **Fonctionnement** : Chaque clone explore un bout du jeu et envoie ses découvertes à un "réseau global". Le réseau global se met à jour et renvoie son nouveau cerveau aux clones.
*   **A2C (Synchrone)** : Une version simplifiée où le réseau global attend que tous les clones aient fini leur partie avant de se mettre à jour (plus stable mathématiquement que A3C).

#### B. PPO (Proximal Policy Optimization)
C'est le roi incontesté aujourd'hui. Il est utilisé par OpenAI (notamment pour aligner ChatGPT avec les humains via RLHF), par Tesla, et dans de nombreux jeux vidéo.
*   **Le problème qu'il résout** : Dans les anciens algorithmes, si le Critique disait "Cette action est géniale", l'Acteur changeait radicalement son comportement. Mais si le Critique se trompait, l'Acteur détruisait tout ce qu'il avait appris (catastrophic forgetting) et la performance s'effondrait.
*   **La solution PPO (Le Clipping)** : PPO empêche l'Acteur de changer d'avis trop vite. Mathématiquement, il "coupe" (clip) la mise à jour pour s'assurer que la nouvelle politique ne s'éloigne jamais de plus de X% (souvent 20%) de l'ancienne politique. L'apprentissage est donc très **stable** et **monotone** (il s'améliore petit à petit sans jamais s'effondrer).

#### C. SAC (Soft Actor-Critic)
C'est l'algorithme favori pour la **robotique** et les environnements complexes à actions continues.
*   **L'idée (Maximisation de l'Entropie)** : SAC modifie la fonction de récompense. L'agent ne cherche plus seulement à avoir le meilleur score, mais il cherche à avoir le meilleur score **tout en agissant de la manière la plus aléatoire/imprévisible possible** (ce qu'on appelle l'entropie).
*   **Pourquoi faire ça ?** Cela force l'agent à explorer massivement toutes les options possibles au lieu de s'enfermer dans la première stratégie qui marche à peu près bien. Il est aussi "Sample Efficient", c'est-à-dire qu'il apprend avec beaucoup moins d'essais que PPO.

#### D. DDPG (Deep Deterministic Policy Gradient) et TD3
*   Conçus spécifiquement pour les **espaces d'actions continus** (ex: "tourner le volant de 34,2 degrés" plutôt que "Gauche / Droite"). 
*   Contrairement aux autres qui sortent des probabilités (politique stochastique), DDPG sort directement une valeur exacte (politique déterministe). 
*   **TD3 (Twin Delayed DDPG)** est son évolution directe. Il utilise deux "Critiques" au lieu d'un seul pour éviter de surestimer la valeur des actions (un problème récurrent avec DDPG).


#ReinforcementLearning/ActorCritic
