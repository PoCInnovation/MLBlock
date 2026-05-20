Edited Definition.md
Viewed Definition.md:1-23

Voici un schéma détaillé de l'architecture et du cycle d'entraînement du PPO. Tu peux copier-coller ce bloc de code directement dans Obsidian, il sera généré visuellement grâce à Mermaid !

```mermaid
graph TD
    %% Composants principaux
    Env([Environnement])
    
    subgraph Agent PPO
        Actor[Acteur : Réseau de Politique π]
        Critic[Critique : Réseau de Valeur V]
    end
    
    subgraph Collecte de Données
        Buffer[(Mémoire / Trajectoires)]
    end
    
    subgraph Phase d'Entraînement
        AdvCalc[Calcul de l'Avantage - GAE]
        LossActor[Perte Acteur : PPO Clipping]
        LossCritic[Perte Critique : Erreur Quadratique - MSE]
    end

    %% 1. Phase de jeu (Rollouts)
    Env -- "État (S_t)" --> Actor
    Env -- "État (S_t)" --> Critic
    Actor -- "Action (a_t)" --> Env
    
    %% Stockage en mémoire
    Env -- "Récompense (R_t) & État Suivant" --> Buffer
    Actor -. "Probabilité (Ancienne Politique)" .-> Buffer
    Critic -. "Valeur estimée V(S_t)" .-> Buffer

    %% 2. Calcul de l'Avantage
    Buffer -- "R_t, V(S_t), V(S_t+1)" --> AdvCalc
    
    %% 3. Mise à jour de l'Acteur
    AdvCalc -- "Avantage (A_t)" --> LossActor
    Buffer -- "Anciennes probabilités" --> LossActor
    Actor -- "Nouvelles probabilités" --> LossActor
    LossActor -. "Mise à jour des poids" .-> Actor
    
    %% 4. Mise à jour du Critique
    Buffer -- "Récompenses réelles cumulées" --> LossCritic
    Critic -- "Nouvelles Valeurs Prédites" --> LossCritic
    LossCritic -. "Mise à jour des poids" .-> Critic

    %% Styles pour la lisibilité
    classDef env fill:#d4f1f4,stroke:#189ab4,stroke-width:2px;
    classDef actor fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    classDef critic fill:#fff3e0,stroke:#ff9800,stroke-width:2px;
    classDef calc fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px;
    classDef buffer fill:#eceff1,stroke:#607d8b,stroke-width:2px;

    class Env env;
    class Actor actor;
    class Critic critic;
    class LossActor,LossCritic,AdvCalc calc;
    class Buffer buffer;
```

### Comment lire ce schéma :
1. **La boucle du haut (Collecte)** : L'Acteur et le Critique regardent l'Environnement. L'Acteur prend des actions, l'Environnement renvoie des récompenses. Tout est sauvegardé dans le **Buffer** (la mémoire).
2. **Le point central (GAE)** : Une fois qu'on a joué quelques parties, on utilise la mémoire pour calculer l'**Avantage** (est-ce que l'action prise était meilleure que ce qu'avait prédit le Critique ?).
3. **La boucle du bas (Entraînement)** : 
   * On met à jour l'**Acteur** en comparant ses *nouvelles* probabilités avec les *anciennes* stockées en mémoire (c'est ici qu'intervient le fameux **Clipping** pour ne pas faire de mise à jour trop brutale).
   * On met à jour le **Critique** pour qu'il devienne plus précis dans ses futures estimations. 



#ReinforcementLearning/ActorCritic #PPO #Architecture
