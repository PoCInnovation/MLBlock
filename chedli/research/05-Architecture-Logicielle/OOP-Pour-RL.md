# Architecture Orientée Objet Modulaire pour le RL

Ce document présente l'architecture hautement modulaire basée sur le pattern Factory et l'injection de dépendances, conçue pour le projet PoC MLblock. Elle met en place une séparation stricte entre **Interfaces** (Contrats purs), **Classes Abstraites** (Logique partagée) et **Implémentations concrètes**.

## Diagramme de Classe

```mermaid
classDiagram
    %% --- Interfaces (Contrats purs) ---
    class IAgent {
        <<interface>>
        +train(env: IEnvironment, timesteps: int)*
        +predict(observation: Any) Action*
        +save(path: str)*
        +load(path: str)*
    }

    class IEnvironment {
        <<interface>>
        +reset() Observation*
        +step(action: Action) Tuple*
        +render()*
        +close()*
    }

    class ILogger {
        <<interface>>
        +log_metrics(metrics: dict)*
        +get_callback() Callback*
    }

    %% --- Classes Abstraites (Logique partagée) ---
    class AbstractAgent {
        <<abstract>>
        #config: dict
        #model_dir: str
        +train(env: IEnvironment, timesteps: int)*
        +predict(observation: Any) Action*
        +save(path: str)
        +load(path: str)
        +get_config() dict
    }

    class AbstractEnvironment {
        <<abstract>>
        #env_name: str
        #n_envs: int
        +reset() Observation*
        +step(action: Action) Tuple*
        +render()*
        +close()*
        +get_env_name() str
    }

    class AbstractLogger {
        <<abstract>>
        #log_dir: str
        +log_metrics(metrics: dict)*
        +get_callback() Callback*
        +create_log_dir()
    }

    %% --- Implémentations (Code Spécifique) ---
    class SB3_PPO_Agent {
        -model: PPO
        +train(env: IEnvironment, timesteps: int)
        +predict(observation: Any) Action
    }

    class Custom_DQN_Agent {
        -q_network: NeuralNet
        +train(env: IEnvironment, timesteps: int)
        +predict(observation: Any) Action
    }

    class GymnasiumEnv {
        -env: VectorEnv
        +reset() Observation
        +step(action: Action) Tuple
        +render()
        +close()
    }

    class TensorBoardLogger {
        +log_metrics(metrics: dict)
        +get_callback() Callback
    }

    %% --- Factories (Usines) ---
    class AgentFactory {
        <<static>>
        +create_agent(agent_type: str, config: dict)$ IAgent
    }

    class EnvFactory {
        <<static>>
        +create_env(env_type: str, config: dict)$ IEnvironment
    }

    class LoggerFactory {
        <<static>>
        +create_logger(logger_type: str, config: dict)$ ILogger
    }

    %% --- Chef d'Orchestre ---
    class MainExperiment {
        -config: dict
        -agent: IAgent
        -env: IEnvironment
        -logger: ILogger
        +load_config(path: str)
        +run_training()
        +run_evaluation()
    }

    %% --- Relations d'Implémentation (Interfaces) ---
    IAgent <|.. AbstractAgent : implements
    IEnvironment <|.. AbstractEnvironment : implements
    ILogger <|.. AbstractLogger : implements

    %% --- Relations d'Héritage (Classes Abstraites) ---
    AbstractAgent <|-- SB3_PPO_Agent : inherits
    AbstractAgent <|-- Custom_DQN_Agent : inherits
    AbstractEnvironment <|-- GymnasiumEnv : inherits
    AbstractLogger <|-- TensorBoardLogger : inherits

    %% --- Relations de Création (Factory Pattern) ---
    AgentFactory ..> IAgent : instantiates
    EnvFactory ..> IEnvironment : instantiates
    LoggerFactory ..> ILogger : instantiates

    %% --- Relations d'Utilisation / Composition ---
    MainExperiment --> AgentFactory : uses
    MainExperiment --> EnvFactory : uses
    MainExperiment --> LoggerFactory : uses
    
    MainExperiment o-- IAgent : contains
    MainExperiment o-- IEnvironment : contains
    MainExperiment o-- ILogger : contains
```

## Explication des blocs

1.  **Les Interfaces (`IAgent`, `IEnvironment`, `ILogger`)** : Ce sont des contrats stricts (100% abstraits). Elles définissent le "*Quoi*" sans s'occuper du "*Comment*". N'importe quelle méthode qui attend un environnement s'attendra à manipuler un type `IEnvironment`.
2.  **Les Classes Abstraites (`AbstractAgent`, `AbstractEnvironment`...)** : Elles implémentent l'Interface pour y ajouter de la **logique partagée**. Par exemple, `AbstractAgent` gère le dictionnaire de configuration (`#config`) et fournit éventuellement une implémentation par défaut de la fonction `save()` ou `load()`. Les méthodes `train()` restent abstraites et doivent être gérées par les enfants.
3.  **Les Implémentations (`SB3_PPO_Agent`, `GymnasiumEnv`...)** : Elles héritent des Classes Abstraites. Elles contiennent le vrai code technique lié aux bibliothèques (SB3, Gym) et remplissent les méthodes manquantes.
4.  **Les Factories (`AgentFactory`...)** : Elles lisent une configuration et instancient la bonne classe dynamiquement. Fait important : elles retournent un type d'Interface (`IAgent`) à l'appelant.
5.  **L'application centrale (`MainExperiment`)** : Elle est couplée **uniquement aux Interfaces**. Elle se contente d'appeler `agent.train(env)` sans savoir s'il s'agit d'un réseau de neurones PPO dans un environnement Gymnasium, ou d'une Table Q dans un environnement Custom.

#ReinforcementLearning/Architecture #OOP #DesignPattern #Factory
