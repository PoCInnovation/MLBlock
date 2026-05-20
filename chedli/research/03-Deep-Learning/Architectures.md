Les architectures d'apprentissage automatique (Machine Learning) et d'apprentissage profond (Deep Learning) se sont grandement diversifiées ces dernières années. Voici les grandes familles d'architectures les plus connues, classées par domaine d'application principal :

### 1. Les Transformers (L'état de l'art actuel)
Introduits en 2017 par Google (dans le papier "Attention Is All You Need"), les Transformers dominent aujourd'hui presque tous les domaines, en particulier le traitement du langage naturel (NLP).
*   **Fonctionnement :** Ils reposent sur le mécanisme d'**attention** (self-attention), permettant au modèle d'évaluer l'importance de chaque mot dans une phrase, indépendamment de sa position.
*   **Exemples célèbres :** 
    *   **GPT** (Generative Pre-trained Transformer) d'OpenAI (la base de ChatGPT).
    *   **BERT** (Bidirectional Encoder Representations from Transformers) de Google.
    *   **Llama** (Meta), **Mistral**, etc.
*   **Applications :** Traduction, génération de texte, résumé, mais aussi vision par ordinateur (Vision Transformers - ViT) et audio.

### 2. Réseaux de Neurones Convolutifs (CNN)
Les CNN sont les rois historiques de la **vision par ordinateur** (Computer Vision).
*   **Fonctionnement :** Ils utilisent des filtres (convolutions) qui parcourent les images pour extraire des caractéristiques locales (bords, textures, puis formes complexes).
*   **Exemples célèbres :** ResNet, VGG, YOLO (pour la détection d'objets en temps réel), AlexNet.
*   **Applications :** Reconnaissance faciale, classification d'images, diagnostic médical par imagerie, conduite autonome.

### 3. Modèles de Diffusion (Diffusion Models)
C'est l'architecture derrière la révolution récente de la **génération d'images**.
*   **Fonctionnement :** Le modèle apprend à détruire progressivement une image en y ajoutant du "bruit" aléatoire, puis apprend le processus inverse : partir de bruit pur et générer une image nette, souvent guidé par un texte.
*   **Exemples célèbres :** Midjourney, Stable Diffusion, DALL-E.
*   **Applications :** Génération et édition d'images/vidéos à partir de descriptions textuelles.

### 4. Réseaux de Neurones Récurrents (RNN) et LSTM / GRU
Avant les Transformers, c'était l'architecture standard pour traiter des **données séquentielles** (qui ont une notion d'ordre et de temps).
*   **Fonctionnement :** Contrairement aux réseaux classiques, ils ont une "mémoire" interne qui conserve les informations des étapes précédentes. Les **LSTM** (Long Short-Term Memory) ont été créés pour mémoriser des informations sur de plus longues séquences.
*   **Applications :** Prédiction de séries temporelles (météo, finance), reconnaissance vocale, traduction automatique (avant les Transformers).

### 5. Réseaux Antagonistes Génératifs (GAN)
Créés en 2014, les GANs ont longtemps dominé la génération de contenu avant l'arrivée des modèles de diffusion.
*   **Fonctionnement :** Deux réseaux s'affrontent. Un **Générateur** crée de fausses données (ex: faux visages), et un **Discriminateur** essaie de deviner si l'image est vraie ou fausse. Ils s'améliorent mutuellement.
*   **Exemples célèbres :** StyleGAN.
*   **Applications :** Deepfakes, génération de visages photoréalistes, upscaling d'images (amélioration de la résolution).

### 6. Auto-encodeurs (Autoencoders & VAE)
Utilisés principalement pour l'apprentissage non supervisé.
*   **Fonctionnement :** Ils compressent les données d'entrée en une représentation très petite (l'encodeur), puis tentent de reconstruire la donnée d'origine à partir de cette compression (le décodeur). Les **VAE** (Variational Autoencoders) ajoutent une dimension probabiliste pour générer de nouvelles données.
*   **Applications :** Détection d'anomalies (si le modèle n'arrive pas à reconstruire la donnée, c'est que c'est une anomalie), compression de données, débruitage d'images.

### 7. Perceptron Multicouche (MLP) / Réseaux denses (Dense Networks)
C'est l'architecture "classique" et basique du Deep Learning.
*   **Fonctionnement :** Des couches de neurones où chaque neurone d'une couche est connecté à tous les neurones de la couche suivante (Fully Connected).
*   **Applications :** Données tabulaires (fichiers Excel, bases de données), problèmes de classification simples.

### 8. Apprentissage par Renforcement Profond (Deep RL Architectures)
Architectures utilisées pour apprendre à un agent à prendre des décisions dans un environnement.
*   **Exemples célèbres :** 
    *   **DQN** (Deep Q-Network) : A permis à l'IA de DeepMind de battre les humains sur des jeux Atari.
    *   **PPO** (Proximal Policy Optimization) : Très utilisé aujourd'hui, notamment c'est l'algorithme utilisé pour affiner ChatGPT (RLHF - Reinforcement Learning from Human Feedback).


::: mermaid
graph TD;
    In[Entrées (Texte source)] --> IE[Input Embeddings]
    IE --> PE1[Positional Encoding]
    PE1 --> EncBlock

    %% Bloc Encodeur (Répété N fois)
    subgraph "Encodeur (Répété N fois)"
        EncBlock[ ]
        EncBlock --> MHA1[Multi-Head Attention]
        MHA1 --> AddNorm1[Add & Norm]
        AddNorm1 --> FF1[Feed Forward]
        FF1 --> AddNorm2[Add & Norm]
    end

    %% Sortie de l'Encodeur
    AddNorm2 --> EncOut[Représentations encodées]

    %% Définition des sorties (pour l'entraînement)
    Out[Sorties décalées / Texte cible] --> OE[Output Embeddings]
    OE --> PE2[Positional Encoding]
    PE2 --> DecBlock

    %% Bloc Décodeur (Répété N fois)
    subgraph "Décodeur (Répété N fois)"
        DecBlock[ ]
        DecBlock --> MMHA[Masked Multi-Head Attention]
        MMHA --> AddNorm3[Add & Norm]
        
        %% Le décodeur reçoit l'info de l'encodeur ici
        EncOut --> CrossAtt[Cross Multi-Head Attention]
        AddNorm3 --> CrossAtt
        
        CrossAtt --> AddNorm4[Add & Norm]
        AddNorm4 --> FF2[Feed Forward]
        FF2 --> AddNorm5[Add & Norm]
    end

    %% Tête finale de prédiction
    AddNorm5 --> Lin[Couche Linéaire]
    Lin --> Soft[Softmax]
    Soft --> Prob[Probabilités du prochain mot]
:::

#MachineLearning/Architecture #DeepLearning
