Edited Stable-Baselines3.md
Viewed Stable-Baselines3.md:1-23
Ran command: `npx -y ctx7@latest library "stable-baselines3" "How to use Gymnasium environments with Stable Baselines3"`
Ran command: `npx -y ctx7@latest docs /dlr-rm/stable-baselines3 "How to use Gymnasium custom environments with Stable Baselines3, including vectorization and compatibility"`

Pour utiliser Stable-Baselines3 (SB3) avec tes propres environnements, tu dois te plier à la norme **Gymnasium** (le standard officiel en Python pour le RL, anciennement "OpenAI Gym").

Voici la marche à suivre officielle issue de la documentation, étape par étape :

### 1. Créer la structure de base de l'Environnement
Ton environnement doit hériter de la classe `gym.Env`. Tu dois définir au minimum deux attributs (`action_space`, `observation_space`) et deux méthodes (`step()`, `reset()`).

Voici le template de base fourni par la documentation :

```python
import gymnasium as gym
import numpy as np
from gymnasium import spaces

class MonEnvironnement(gym.Env):
    """Environnement personnalisé compatible avec SB3."""

    # Facultatif : définir comment l'environnement peut être affiché
    metadata = {"render_modes": ["human"], "render_fps": 30}

    def __init__(self):
        super().__init__()
        
        # 1. Définir l'espace d'actions (ce que l'agent peut faire)
        # Ex: 4 actions discrètes (Haut, Bas, Gauche, Droite)
        self.action_space = spaces.Discrete(4)
        
        # 2. Définir l'espace d'observations (ce que l'agent "voit")
        # Ex: Une grille de pixels (image 255x255 avec 3 canaux RGB)
        self.observation_space = spaces.Box(
            low=0, high=255, shape=(3, 255, 255), dtype=np.uint8
        )

    def reset(self, seed=None, options=None):
        """Réinitialise l'environnement à son état de départ."""
        super().reset(seed=seed) # Pour l'aléatoire
        
        # Logique pour remettre le jeu à zéro...
        observation = self._get_obs()
        info = {} # Dictionnaire pour des infos de debug
        
        return observation, info

    def step(self, action):
        """Prend une action et avance le jeu d'une étape."""
        # Logique du jeu : Que se passe-t-il quand l'agent fait cette action ?
        
        observation = self._get_obs() # Nouvel état
        reward = 1.0 # Récompense obtenue
        terminated = False # Est-ce que l'agent a gagné ou perdu (fin du jeu) ?
        truncated = False # Est-ce qu'on a dépassé le temps limite (sans gagner ni perdre) ?
        info = {} # Infos additionnelles
        
        return observation, reward, terminated, truncated, info

    def render(self):
        """Pour afficher le jeu (ex: Pygame, print console)."""
        pass
```

### 2. Valider la compatibilité avec SB3
C'est **l'étape la plus importante**. SB3 fournit un vérificateur pour s'assurer que tu n'as pas fait d'erreur dans ton environnement (comme oublier de renvoyer le dictionnaire `info` dans le `reset`).

```python
from stable_baselines3.common.env_checker import check_env

env = MonEnvironnement()
# Si cette fonction s'exécute sans erreur, ton environnement est parfait !
check_env(env)
```

### 3. Vectoriser l'environnement pour PPO
Comme vu précédemment, PPO a besoin de beaucoup de données. La documentation SB3 recommande fortement d'encapsuler ton environnement pour lancer plusieurs parties en même temps :

```python
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import SubprocVecEnv
from stable_baselines3 import PPO

if __name__ == "__main__":
    # Crée 4 environnements en parallèle sur différents coeurs de ton processeur
    vec_env = make_vec_env(MonEnvironnement, n_envs=4, vec_env_cls=SubprocVecEnv)
    
    # Entraînement !
    model = PPO("MlpPolicy", vec_env, verbose=1)
    model.learn(total_timesteps=10000)
```

*(Note : Si `SubprocVecEnv` pose des problèmes sur ton ordinateur, tu peux utiliser `DummyVecEnv`, qui exécute les environnements séquentiellement mais garde la compatibilité SB3).*

### En résumé
1.  Tu modélises ton problème sous forme de classe Gymnasium (`__init__`, `step`, `reset`).
2.  Tu vérifies que tout est conforme avec `check_env`.
3.  Tu l'envoies à l'algorithme PPO. C'est aussi simple que ça !

---

## Utiliser un environnement existant (ex: Lunar Lander)

Si tu ne veux pas créer ton propre environnement mais plutôt utiliser un classique déjà fourni par Gymnasium (comme `LunarLander-v3`, `CartPole-v1`, etc.), c'est encore plus simple.

> [!NOTE] Prérequis pour Lunar Lander
> Pour Lunar Lander spécifiquement, il faut installer les dépendances physiques Box2D :
> `pip install "gymnasium[box2d]"`

### Code d'entraînement basique

Ici, pas besoin de créer de classe, tu as juste besoin du nom de l'environnement :

```python
import gymnasium as gym
from stable_baselines3 import PPO

# 1. Créer l'environnement
env = gym.make("LunarLander-v3")

# 2. Instancier le modèle (MlpPolicy car l'observation est un vecteur de nombres)
model = PPO("MlpPolicy", env, verbose=1)

# 3. Entraîner l'agent
model.learn(total_timesteps=50000)

# 4. Sauvegarder le modèle
model.save("ppo_lunar_lander")
env.close()
```

### Vectoriser un environnement existant

Tout comme pour un environnement custom, tu peux utiliser `make_vec_env` pour l'entraîner en parallèle. La seule différence est que tu lui passes une **chaîne de caractères** (le nom de l'environnement) plutôt que ta classe :

```python
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3 import PPO

# Crée 4 environnements en parallèle
vec_env = make_vec_env("LunarLander-v3", n_envs=4)

model = PPO("MlpPolicy", vec_env, verbose=1)
model.learn(total_timesteps=100000)
```

### Tester l'agent entraîné avec un rendu visuel

Une fois entraîné, tu peux charger le modèle et regarder comment il se comporte :

```python
import gymnasium as gym
from stable_baselines3 import PPO

# 1. Charger l'environnement avec le mode "human" pour voir l'animation
env = gym.make("LunarLander-v3", render_mode="human")

# 2. Charger le modèle
model = PPO.load("ppo_lunar_lander")

obs, info = env.reset()
for i in range(1000):
    # L'agent prédit la meilleure action en fonction de ce qu'il voit (obs)
    # deterministic=True permet d'exploiter la politique apprise (pas d'aléatoire d'exploration)
    action, _states = model.predict(obs, deterministic=True)
    
    # L'environnement avance d'une étape
    obs, reward, terminated, truncated, info = env.step(action)
    
    if terminated or truncated:
        obs, info = env.reset()

env.close()
```

#ReinforcementLearning/Outils #Gymnasium #StableBaselines3
