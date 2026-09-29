# Spécifications d'Interface & Ergonomie (UI_SPECIFICATION.md)

Ce document décrit les règles de conception visuelle, de mise en page réactive et d'interaction pour l'implémentation des **Super-Blocs** et du **Flux Vivant** sur le canvas MLBlock.

---

## 1. Principes Fondamentaux de l'Interface

```
                                    CANVAS MLBLOCK
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ [Header Réactif : Logo + Switcher [Actuel(11) | Cible(3)] + Bouton Flux Vivant]       │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                        │
 │   ┌────────────────┐         ┌───────────────────┐         ┌─────────────────────┐     │
 │   │ Pipeline       │         │ CNN Backbone      │         │ Entraîneur PyTorch  │     │
 │   │ Données (S0/1) │────────>│ (Conteneur S2)    │────────>│ (Stage S3)          │     │
 │   │                │ (Shape) │                   │ (Modèle)│                     │     │
 │   │ 4 étapes       │         │ 5 couches         │         │ [● Modèle  ✓]       │     │
 │   │ [+ Étape...]   │──┐      │ [+ Couche...]     │         │ [● Données ✓]       │     │
 │   └────────────────┘  │      └───────────────────┘         │ [+ Callback...]     │     │
 │                       │                                    └─────────────────────┘     │
 │                       └──────────────(DataLoader)─────────────────────▲                │
 │                                    (Courbe sous le modèle)                             │
 │                                                                                        │
 │ [+ Ajouter Super-Bloc]                                            [Zoom: 100% | Fit]   │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Clarté d'abord :** Pas plus de 4 à 5 boîtes sur le canvas par défaut pour un pipeline standard.
2. **Auto-explicite :** Chaque câble a une couleur sémantique qui correspond à la pastille du port d'arrivée.
3. **Zéro câble invisible ou traversant :** Les liaisons longues qui contournent un conteneur adoptent une courbure de Bézier fluide par le bas pour éviter toute superposition.

---

## 2. Le Panneau Multi-Entrées des Blocs

Les blocs d'entraînement ou de fusion de tenseurs (comme `train_model` ou `concatenate`) ne doivent plus utiliser de ports anonymes (`in_1`, `in_2`).

### Spécification visuelle d'un Slot d'Entrée Typé :

```
┌──────────────────────────────────────────────┐
│ ENTRÉES REQUISES :              ✓ 2/2 PRÊTES │
├──────────────────────────────────────────────┤
│ (●) Modèle (nn.Module)           [connecté]  │ <── Slot Orange
│ (●) Données (DataLoader)         [connecté]  │ <── Slot Violet
└──────────────────────────────────────────────┘
```

- **Le port rond `●` :** Placé sur le bord gauche du slot, avec un diamètre de 14px et une bordure colorée (Orange pour modèle, Violet pour données).
- **Le libellé :** Indique en toutes lettres le rôle et le type attendu.
- **L'indicateur d'état :**
  - Vert `[connecté]` quand un câble valide est branché.
  - Rouge clignotant `[requis]` si le pipeline tente de se lancer sans cette entrée indispensable.
  - Hover magnétique : tirer un fil orange met en surbrillance verte uniquement le slot `Modèle` et estompe les autres.

---

## 3. Gestion des Étapes Internes (In-Block Steps)

À l'intérieur des Super-Blocs conteneurs, les éléments s'empilent verticalement dans une zone à défilement doux (`max-height: 270px`) :

### A. Dans le Conteneur Données (`DataContainer`)
- Étapes séquentielles : Source $\to$ Transformations / Augmentations $\to$ Batching.
- Bouton : `+ Ajouter étape (Augmentation, Filtre...)`.
- Options du sélecteur contextuel :
  - `RandomHorizontalFlip` (p=0.5)
  - `RandomCrop` (size=32, padding=4)
  - `ColorJitter` (brightness=0.2)
  - `Normalize` (custom mean/std)

### B. Dans le Conteneur Modèle (`ModelContainer`)
- Couches séquentielles : Conv2D, Activation, Pooling, Normalisation, Dropout, Dense.
- Bouton : `+ Ajouter une couche (Conv, Norm, Drop...)`.
- **Comportement dynamique :** Dès qu'une couche est ajoutée ou supprimée, le volume de paramètres entraînables est recalculé en local et affiché sur le badge du câble de sortie (`CNN: 144.2k params`).

### C. Dans le Conteneur Entraîneur (`TrainerContainer`)
- Composants optionnels de la boucle d'apprentissage :
  - `EarlyStopping` (patience, min_delta)
  - `CosineAnnealingLR` (scheduler de taux d'apprentissage)
  - `ModelCheckpoint` (sauvegarde du meilleur checkpoint)

---

## 4. Grille Réactive & Moteur Pan/Zoom

Pour assurer une ergonomie irréprochable du petit portable 13 pouces (1024px) jusqu'à l'écran 4K :

| Breakpoint | Largeur Écran | Comportement Navbar | Comportement Canvas |
|---|:---:|---|---|
| **Large Desktop** | $\ge 1251$ px | Libellés complets (`1. Structure Actuelle (11 Blocs)`), sous-titre de baseline affiché, badge visible | Échelle à 100%, centrée |
| **Medium / Laptop** | $901$ à $1250$ px | Libellés condensés **`[1. Actuel (11)]`** et **`[2. Cible (3)]`**, sous-titre masqué, paddings compacts | Auto-scale adaptatif (~65-75%) pour éliminer le scroll horizontal |
| **Small / Tablet** | $\le 900$ px | Icônes seules pour les boutons d'action, bannière d'aide masquée | Boutons de zoom et contrôles ancrés en bas |

### Moteur Pan & Zoom :
- **Translation (`panX, panY`) :** Clic et glisser n'importe où dans le fond du canvas.
- **Zoom (`scale`) :** Molette de la souris ou boutons `[+]` / `[-]` bornés entre 40% et 220%.
- **Recentrer (`Fit to Screen`) :** Calcule instantanément le rectangle englobant ($W \times H$) des nœuds affichés et ajuste le zoom et le centrage pour que 100% du graphe soit visible sans manipulation.
- **Précision des ports :** La position des ancres SVG est divisée par l'échelle `scale` pour garantir que les courbes partent et arrivent au pixel près au centre des pastilles quelle que soit l'échelle de zoom active.
