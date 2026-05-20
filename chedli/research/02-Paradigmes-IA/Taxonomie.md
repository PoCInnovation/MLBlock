# Taxonomie des Paradigmes de l'Intelligence Artificielle

> **Carte mère** de tous les paradigmes de l'IA. Chaque dossier dans `research/` correspond à un paradigme fondamental. Ce document définit les frontières entre eux et montre comment ils s'articulent.

---

## 🌳 Arbre des Paradigmes

```
                    ┌─────────────────────────────────────────┐
                    │         Intelligence Artificielle        │
                    │         (Le domaine général)             │
                    └────────────┬────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────────┐
          │                      │                          │
          ▼                      ▼                          ▼
 ┌─────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
 │ Symbolic AI     │  │  Machine Learning    │  │  Evolutionary &     │
 │ (Systèmes       │  │  (Apprentissage       │  │  Swarm Methods      │
 │  experts,       │  │   à partir de données)│  │  (GA, GP, essaims)  │
 │  logique,       │  └──────────┬───────────┘  └──────────────────────┘
 │  règles)        │             │
 └─────────────────┘    ┌────────┴────────────┐
                        │                     │
                        ▼                     ▼
               ┌──────────────────┐  ┌──────────────────────┐
               │  Machine Learning │  │  Deep Learning       │◄─ ● 03-Deep-Learning/
               │  Classique        │  │  (Réseaux de neurones│
               │  (Forêts aléat.,  │  │   profonds : CNN,    │
               │   SVM, régress.)  │  │   Transformers,      │
               │                   │  │   GAN, Diffusion...) │
               └──────────────────┘  └──────────────────────┘
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        │                       │                       │
                        ▼                       ▼                       ▼
               ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
               │  Vision par      │  │  NLP / LLMs          │  │  RL Profond      │
               │  Ordinateur      │  │  (GPT, BERT, Llama)  │  │  (CNN/DQN,        │
               │  (CNN, ViT)      │  │                      │  │   Transformers)   │
               └──────────────────┘  └──────────────────────┘  └──────────────────┘

              ┌─────────────────────────────────────────────────────────┐
              │            Reinforcement Learning (RL)                  │◄─ ● 04-RL/
              │  (Apprentissage par interaction et récompense)          │
              └────────────┬────────────────────────────────┬───────────┘
                           │                                │
              ┌────────────┴────────────┐     ┌─────────────┴─────────────┐
              │  Model-Free RL          │     │  Model-Based RL           │
              │  (Apprend sans modèle   │     │  (Apprend un modèle du    │
              │   du monde)             │     │   monde pour planifier)   │
              └────────────┬────────────┘     │  AlphaZero, MuZero,      │
                           │                  │  Dreamer                  │
              ┌────────────┼────────────┐     └───────────────────────────┘
              │            │            │
              ▼            ▼            ▼
      ┌──────────┐ ┌──────────────┐ ┌──────────┐
      │ Value-   │ │  Actor-      │ │ Policy-  │
      │ Based    │ │  Critic      │ │ Based    │
      │ (DQN,    │ │  (PPO, SAC,  │ │ (REIN-   │
      │ Double   │ │  A2C, TD3)   │ │ FORCE)   │
      │ DQN)     │ │              │ │          │
      └──────────┘ └──────────────┘ └──────────┘
```

---

## 1. Symbolic AI (IA Symbolique)

**Aussi appelée :** GOFAI (Good Old-Fashioned AI), systèmes à base de connaissances.

**Principe :** L'intelligence émerge de la manipulation explicite de **symboles** et de **règles logiques**. Pas d'apprentissage à partir de données — la connaissance est codée par un expert humain.

**Sous-familles :**
- Systèmes experts (MYCIN, DENDRAL)
- Programmation logique (Prolog)
- Réseaux sémantiques
- Raisonnement à base de cas

**Forces :** Interprétable, transparent, ne nécessite pas de données.
**Faiblesses :** Rigide, ne passe pas à l'échelle, ne généralise pas.

> *📁 Dossier correspondant : (aucun — pas de notes dans ce projet)*

---

## 2. Machine Learning Classique (Apprentissage Statistique)

**Principe :** Des algorithmes statistiques apprennent des motifs dans les données sans être explicitement programmés. On infère des règles à partir d'exemples.

**Sous-paradigmes d'apprentissage :**

| Paradigme | Principe | Exemples d'algorithmes |
|-----------|----------|----------------------|
| **Supervisé** | Apprend à partir d'exemples étiquetés | Régression linéaire, SVM, Forêts aléatoires, k-NN |
| **Non supervisé** | Trouve des structures cachées sans étiquettes | k-means, DBSCAN, ACP, t-SNE |
| **Semi-supervisé** | Mélange de données étiquetées et non étiquetées | Self-training, graph-based |
| **Transductif** | Prédit sur un ensemble de test spécifique sans généraliser | - |

**Forces :** Interprétable (surtout les modèles linéaires), efficace sur petits jeux de données.
**Faiblesses :** Nécessite du feature engineering, ne capture pas les motifs complexes non linéaires sans travail manuel.

> *📁 Dossier correspondant : (aucun — notes non développées dans ce projet)*

---

## 3. Deep Learning (Apprentissage Profond) 📘

**Aussi appelé :** Connectionism, réseaux de neurones profonds.

**Principe :** Des réseaux de neurones à **multiples couches** apprennent des **représentations hiérarchiques** des données. Chaque couche transforme l'entrée en une représentation de plus en plus abstraite.

**C'est un paradigme à part entière**, pas une simple évolution du ML classique :
- Contrairement au ML classique, le Deep Learning **apprend automatiquement les caractéristiques** (feature learning)
- Il passe à l'échelle avec la quantité de données et de calcul
- Il est **architectural** : le choix de l'architecture (CNN, Transformer, etc.) détermine ce que le réseau peut apprendre

**Grandes familles d'architectures :**

| Architecture | Domaine roi | Mécanisme clé |
|-------------|-------------|---------------|
| **MLP** | Données tabulaires | Couches fully connected |
| **CNN** | Vision par ordinateur | Convolution / filtres |
| **RNN / LSTM** | Séries temporelles (historique) | Mémoire séquentielle |
| **Transformer** | NLP, vision, audio,... | Self-attention |
| **Autoencoders (VAE)** | Compression, détection d'anomalies | Encodage-décodage |
| **GAN** | Génération d'images | Compétition Générateur/Discriminateur |
| **Modèles de Diffusion** | Génération d'images (SOTA) | Dénombrage progressif |
| **Modèles Fondation (LLM)** | Tout domaine (modèles généralistes) | Scale + Transformer |

> *📁 Dossier : `03-Deep-Learning/Architectures.md` → Vue d'ensemble de toutes ces architectures*

---

## 4. Reinforcement Learning (Apprentissage par Renforcement) 🎮

**Principe :** Un **agent** apprend à prendre des décisions en interagissant avec un **environnement**. Il reçoit des **récompenses** (ou punitions) et doit maximiser la récompense cumulée sur le long terme.

**Le RL n'est pas une architecture mais un cadre d'apprentissage (learning framework) :**
- Il peut être combiné avec du Deep Learning → **Deep RL**
- Il peut être combiné avec des modèles symboliques
- Il peut utiliser n'importe quelle architecture de représentation (CNN, Transformer, MLP)

**Sous-familles de méthodes :**

| Famille | Ce qu'elle apprend | Exemples | Dossier |
|---------|-------------------|----------|---------|
| **Value-Based** | La valeur de chaque action | DQN, Double DQN | `Theorie/Methodes-Basees-Valeur/` |
| **Policy-Based** | Directement la politique (sans valeur) | REINFORCE | - |
| **Actor-Critic** | Les deux : politique + valeur | PPO, SAC, A2C, TD3 | `Theorie/Methodes-Acteur-Critique/` |
| **Model-Based** | Un modèle du monde + planification | AlphaZero, MuZero, Dreamer | - |

**Outils pratiques :**

| Outil | Rôle | Dossier |
|------|------|---------|
| **Gymnasium** | API standard pour les environnements | `Outils/Gymnasium.md` |
| **Stable-Baselines3** | Algorithmes RL prêts à l'emploi | `Outils/Stable-Baselines3.md` |
| **Gymnasium + SB3** | Guide d'intégration | `Outils/Gymnasium-Et-SB3.md` |

> *📁 Dossier : `04-Apprentissage-Par-Renforcement/` → Théorie + Outils*

---

## 5. Apprentissage Auto-Supervisé & Modèles Fondation

**Principe :** Le modèle apprend des représentations à partir de données **non étiquetées** en créant ses propres objectifs proxy (prédire un mot masqué, reconstruire une image corrompue, etc.).

**Statut :** Certains considèrent ce paradigme comme un 4ᵉ pilier de l'apprentissage (aux côtés du supervisé, non supervisé et RL), popularisé après 2017 avec BERT et GPT.

**Exemples :**
- **LLMs** : GPT, Claude, Llama (pré-entraînement par prédiction du prochain token)
- **Vision** : DINO, MAE (ImageNet auto-supervisé)
- **Multimodal** : CLIP (texte-image)

> *📁 Dossier correspondant : (pas de dossier dédié — les LLMs sont mentionnés dans Deep Learning)*

---

## 6. Méthodes Évolutionnaires & Essaims

**Principe :** Des populations de solutions candidats évoluent via sélection, croisement et mutation (algorithmes génétiques) ou via comportement collectif (essaims).

**Exemples :**
- Algorithmes génétiques (GA)
- Programmation génétique (GP)
- Optimisation par essaims (PSO)
- Stratégies d'évolution (ES)

> *📁 Dossier correspondant : (aucun — pas de notes dans ce projet)*

---

## 7. Paradigmes Hybrides & Émergents

| Paradigme | Combinaison | Exemple |
|-----------|-------------|---------|
| **Neuro-Symbolic AI** | Réseaux de neurones + raisonnement symbolique | DiffLogic, DeepProbLog |
| **Agentic AI** | LLM + outils + planification + mémoire | AutoGPT, LangChain Agents |
| **RAG** | LLM + recherche d'information | Retrieval-Augmented Generation |
| **RLHF** | RL + feedback humain + LLM | ChatGPT (PPO + Reward Model) |

---

## 🗺️ Correspondance avec la structure des dossiers

```
research/
├── 01-Vision-Projet/                              # ● Le projet MLblock
│   └── MLblock.md
├── 02-Paradigmes-IA/                              # ● Ce document
│   └── Taxonomie.md
├── 03-Deep-Learning/                              # ● Paradigme #3
│   └── Architectures.md
├── 04-Apprentissage-Par-Renforcement/             # ● Paradigme #4
│   ├── Theorie/
│   │   ├── Paradigmes-RL.md
│   │   ├── Methodes-Basees-Valeur/
│   │   │   ├── DQN.md
│   │   │   └── Double-DQN.md
│   │   └── Methodes-Acteur-Critique/
│   │       ├── Panorama.md
│   │       └── PPO/
│   │           ├── Definition.md
│   │           └── Architecture.md
│   └── Outils/
│       ├── Gymnasium.md
│       ├── Stable-Baselines3.md
│       └── Gymnasium-Et-SB3.md
└── 05-Architecture-Logicielle/                    # ● Conception logicielle
    ├── OOP-Pour-RL.md
    └── ressources/
        └── IEnvironment-Training.png
```

---

## Notes importantes

- **Deep Learning ≠ Machine Learning classique.** Bien que le Deep Learning soit techniquement un sous-ensemble (« c'est des réseaux de neurones, c'est du ML »), la pratique, les architectures, les échelles de données et les paradigmes d'entraînement sont suffisamment différents pour mériter leur propre catégorie.
- **Le RL est un cadre, pas une architecture.** On peut faire du RL avec des CNN, des Transformers ou des MLP — le choix de l'architecture est orthogonal au choix de la méthode d'apprentissage.
- **Les paradigmes ne sont pas mutuellement exclusifs.** La plupart des systèmes modernes hybrident plusieurs paradigmes (ex: ChatGPT = Transformer + RL + feedback humain).

#IA/Paradigmes #Taxonomie
