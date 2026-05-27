Viewed Architectures.md:1-94

Les architectures d'Apprentissage par Renforcement (Reinforcement Learning - RL) se divisent généralement en plusieurs grandes familles selon la manière dont l'agent apprend à prendre des décisions (apprentissage de la valeur, apprentissage de la politique, ou une combinaison des deux). 

Voici les architectures de Reinforcement Learning les plus connues et les plus utilisées aujourd'hui :

### 1. Les méthodes fondées sur la Valeur (Value-Based)
L'objectif ici est d'estimer la "valeur" d'une action dans un état donné (le gain futur attendu), puis de choisir l'action qui a la plus grande valeur.
*   **DQN (Deep Q-Network)** : C'est l'architecture qui a lancé la révolution du Deep RL. Développée par DeepMind en 2013, elle utilise un réseau de neurones convolutif (CNN) pour lire les pixels d'un écran et estimer la valeur des actions. Elle a permis à une IA de battre les humains sur des dizaines de jeux Atari.
*   **Variantes du DQN (Double DQN, Dueling DQN, Rainbow)** : Des améliorations successives du DQN classique pour éviter que le modèle ne surestime les récompenses et pour séparer l'estimation de la valeur de l'état global et l'avantage d'une action spécifique.

### 2. Les méthodes Acteur-Critique (Actor-Critic)
C'est la famille la plus populaire aujourd'hui. Elle combine deux réseaux (ou deux têtes d'un même réseau) : l'**Acteur** décide de l'action à prendre (Policy), et le **Critique** évalue si cette action était bonne ou mauvaise (Value).
*   **PPO (Proximal Policy Optimization)** : Développé par OpenAI en 2017, c'est devenu **le standard de l'industrie**. PPO est stable, relativement simple à régler, et très performant. C'est l'algorithme derrière l'étape **RLHF** (Reinforcement Learning from Human Feedback) utilisée pour entraîner ChatGPT.
*   **A3C / A2C (Asynchronous Advantage Actor-Critic)** : Une architecture où plusieurs agents jouent en parallèle dans des copies séparées de l'environnement pour explorer plus vite et mettre à jour un réseau global.
*   **SAC (Soft Actor-Critic)** : Une excellente architecture pour les environnements à actions continues (comme faire bouger un bras robotique). SAC cherche non seulement à maximiser la récompense, mais aussi à maximiser l'"entropie" (l'imprévisibilité de ses actions), ce qui l'encourage à explorer massivement.
*   **DDPG (Deep Deterministic Policy Gradient) & TD3** : D'autres architectures très connues pour le contrôle continu (robotique, physique).

### 3. Les méthodes fondées sur un Modèle (Model-Based)
L'agent essaie de comprendre et de simuler les règles de son environnement ("World Model") avant de planifier ses actions.
*   **AlphaZero / MuZero (DeepMind)** : Des architectures légendaires. AlphaZero a vaincu les champions du monde d'Échecs et de Go. MuZero est allé encore plus loin en apprenant les règles du jeu par lui-même en jouant, sans qu'on lui fournisse les règles au préalable.
*   **Dreamer (DreamerV3)** : Une architecture où l'agent apprend un "modèle du monde" dans un espace compressé (latent). L'agent peut alors "rêver" (simuler des milliers de parties dans sa tête en quelques secondes) pour s'entraîner sans avoir besoin d'interagir constamment avec le vrai environnement.

### 4. Le RL vu comme un problème de séquence (Sequence Modeling)
*   **Decision Transformer** : Une approche très récente (2021) qui consiste à abandonner les concepts classiques du RL pour traiter le problème comme de la génération de texte. On donne au Transformer la séquence `(État, Action, Récompense)` et on lui demande de prédire l'action suivante pour obtenir une récompense maximale.



#ReinforcementLearning/Architecture
