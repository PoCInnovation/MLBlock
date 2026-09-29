# ADR 0001 — Typage par Stages et Façade Synchronisée (UX Blocks Rework)

- **Statut :** Accepté
- **Date :** 2026-09-13
- **Auteurs / Décideurs :** Équipe MLBlock
- **Référence :** `docs/UX_Blocks_Rework/`

---

## Contexte

MLBlock compte actuellement 88 blocs répartis sur 13 catégories techniques et 16 familles de types internes (`core/types.py`).
Cette architecture présente plusieurs limites :
1. **Charge cognitive élevée pour l'apprenant :** L'utilisateur est confronté à 88 blocs non hiérarchisés et à des erreurs de connexion rouges (`incompatible`) sans explications claires ni guidage.
2. **Désynchronisation Front/Back :** La classification des arêtes (`core/types.py` en Python vs `typeCheck.ts` en TypeScript) présente des disparités (ex: gestion des images, listes, unions `DataFrame | ndarray`).
3. **Dualité d'API (bug #14) :** Présence de blocs `Tensor` éphémères (`conv2d`, `linear`) en doublon avec les blocs `*_layer` persistants (`nn.Module`).

---

## Décision

Nous adoptons une refonte architecturale structurée en 4 étapes séquentielles : **`1 → 3 → 2 → 4+5`** :

1. **Exercices de référence (12 DAGs canoniques) :** Le périmètre fonctionnel est borné par 12 exercices officiels (PyTorch, scikit-learn, Gymnasium).
2. **Stages du pipeline IA (5 étapes UX) :** Remplacement des 13 catégories techniques par 5 stages constants :
   - `S0 Ingest` : Chargement des données.
   - `S1 Prepare` : Prétraitements et transformations.
   - `S2 Represent` : Architecture modèle (`S2A` DL / `S2B` ML).
   - `S3 Train` : Entraînement (`S3A` DL avec boucle, loss, optim / `S3B` fit ML).
   - `S4 Eval` : Évaluation, inférence, métriques, visualisations.
   - *(+ `SX World` pour l'environnement RL isolé).*
3. **Façade `TypeSystem` synchronisée :** Une interface unique de validation et de classification des arêtes partagée conceptuellement entre le backend Python et le frontend TypeScript.
4. **UX & Frontend avec Astryx :**
   - **Bulle de confirmation Astryx :** Toute connexion `convertible` (ex: `pd.DataFrame` → `torch.Tensor`) ouvre une bulle de confirmation Astryx proposant d'insérer automatiquement le bloc adaptateur intermédiaire (`df_to_tensor`).
   - **Badges de Stage visuels :** Chaque nœud sur le canvas (`BlockNode.tsx`) arbore un badge visuel identifiant son stage (`S0`..`S4`, `SX`).
   - **Filtrage de la palette :** La palette affiche par défaut ~45 blocs essentiels classés par Stage, avec une section "Avancé" repliée.

---

## Design Patterns Appliqués

| Pattern | Rôle |
|---|---|
| **Facade** | Centralisation du système de types (`TypeSystem`) pour `validation.py`, `generator.py` et le canvas ReactFlow. |
| **Template Method** | Modélisation du workflow standard IA (`S0 → S1 → S2 → S3 → S4`) décliné en 3 variantes (DL, ML, RL). |
| **State** | Filtrage dynamique des connexions autorisées et de la palette selon le stage courant du graphe. |
| **Strategy** | Convertisseurs de types modulaires (`DataFrame → Tensor`, `Image → Tensor`). |
| **Adapter** | Maintien de la rétrocompatibilité pour les pipelines existants (redirection des anciens blocs `Tensor` vers `*_layer`). |

---

## Conséquences

- **Positives :**
  - Expérience utilisateur considérablement simplifiée sans sacrifier la sécurité du typage fort.
  - Zéro dérive possible entre les verdicts de connexion frontend et la validation backend.
  - Clarté pédagogique pour l'apprenant grâce aux badges de stage et aux suggestions guidées.
- **Négatives / Risques surveillés :**
  - Nécessité de synchroniser rigoureusement les tests miroirs front/back (`vitest` vs `pytest`).
  - L'exercice RL CartPole DQN (`C2`) nécessite une passerelle `Adapter env ↔ tensor` classée en P1 (différée après la stabilisation de v1).
