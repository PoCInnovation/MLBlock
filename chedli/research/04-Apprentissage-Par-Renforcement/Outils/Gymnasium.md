Ran command: `npx -y ctx7@latest library "gymnasium" "What is Gymnasium, its core concepts, spaces, and how to use it for reinforcement learning"`
Ran command: `npx -y ctx7@latest docs /farama-foundation/gymnasium "What is Gymnasium, its core API, spaces, and how to use it?"`

D'après la documentation officielle, **Gymnasium** (anciennement connu sous le nom de *OpenAI Gym*, dont il est le fork maintenu officiellement par la Farama Foundation) est **le standard absolu de l'industrie** pour créer des environnements d'Apprentissage par Renforcement (RL).

Son but principal est de fournir une **API commune** pour que n'importe quel algorithme d'IA (comme ceux de Stable-Baselines3) puisse interagir avec n'importe quel jeu ou simulateur sans avoir à modifier son code.

Voici les concepts clés pour bien comprendre et utiliser Gymnasium :

### 1. Le Cœur de l'API : La boucle d'interaction
Dans Gymnasium, tout repose sur l'objet `Env` (Environnement) et un cycle très précis. L'agent prend une action, l'environnement avance d'une étape, et renvoie 5 informations :

*   **`observation`** : Le nouvel état de l'environnement (ex: les pixels de l'écran, ou la vitesse du robot).
*   **`reward`** : La récompense immédiate suite à l'action (un nombre flottant).
*   **`terminated`** : Un booléen (`True`/`False`) indiquant si l'épisode est **naturellement terminé** (l'agent a gagné, ou il a percuté un mur et est mort).
*   **`truncated`** : Un booléen indiquant si l'épisode a été **coupé artificiellement** (généralement parce que l'agent a atteint la limite de temps maximale autorisée sans gagner ni perdre).
*   **`info`** : Un dictionnaire contenant des informations de débogage ou des métriques (l'IA ne s'en sert pas pour apprendre, c'est pour l'humain).

**Exemple de boucle classique :**
```python
import gymnasium as gym

# Initialisation
env = gym.make("CartPole-v1")
observation, info = env.reset() # Toujours reset avant de commencer

for _ in range(100):
    action = env.action_space.sample() # Choisir une action (ici aléatoire)
    
    # Le coeur de Gymnasium : la méthode step()
    observation, reward, terminated, truncated, info = env.step(action)
    
    if terminated or truncated:
        observation, info = env.reset() # On recommence une partie
```

### 2. Le Concept d'Espaces (`Spaces`)
Pour que l'agent sache ce qu'il a le droit de faire, Gymnasium utilise des objets `Space`. Il en existe plusieurs, mais les 3 principaux sont :

*   **`Discrete(n)`** : Utilisé pour les actions limitées et dénombrables (ex: `Discrete(4)` = {0, 1, 2, 3} pour Haut, Bas, Gauche, Droite).
*   **`Box(low, high, shape)`** : Utilisé pour les variables continues, délimitées entre un minimum et un maximum. 
    * *Exemple pour un volant* : `Box(low=-1.0, high=1.0, shape=(1,))`
    * *Exemple pour une image RGB* : `Box(low=0, high=255, shape=(64, 64, 3))`
*   **`Dict`** : Permet de combiner plusieurs espaces si les observations sont complexes (ex: un capteur laser + la vitesse + le niveau de batterie).

### 3. Les Environnements Inclus
Gymnasium n'est pas seulement une API, c'est aussi une immense collection de jeux "bacs à sable" fournis nativement pour tester tes algorithmes :
*   **Classic Control** : Pendule à inverser, voiture sur une colline (CartPole, MountainCar).
*   **Atari** : Jouer à Pong, Breakout ou Space Invaders à partir des pixels bruts.
*   **MuJoCo** : Simulations physiques complexes de robots (ex: apprendre à un robot humanoïde à marcher).
*   **Box2D** : Le fameux atterrissage sur la lune (`LunarLander-v3`).

En résumé, Gymnasium est le pont universel : tu construis (ou tu charges) ton problème dans Gymnasium, et tu branches un algorithme SB3 dessus pour qu'il apprenne à le résoudre !

#ReinforcementLearning/Outils #Gymnasium
