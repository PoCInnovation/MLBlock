# Single-Port Connections

## Why

Relier deux blocs demande de choisir manuellement quel port connecter à quel port — peu instinctif pour la majorité des cas où un bloc n'a qu'un seul input/output, ou des ports de types distincts (la résolution est alors déterministe). L'utilisateur veut « connecter A vers B » et laisser le système trouver les ports compatibles.

## What Changes

- **Point unique d'entrée/sortie** : chaque bloc non-ambigu (inputs et outputs de dtypes tous distincts, ou un seul port par côté) affiche un seul handle cible à gauche et un seul handle source à droite. La connexion A → B est créée en résolvant automatiquement le couple (source_port, target_port) le plus compatible (dtype exact → même famille → convertible → bloqué avec toast).
- **Handles individuels conservés pour les blocs ambigus** : les blocs avec plusieurs ports du même dtype (`tensor_dataset` in Tensor×2, `train_model`/`train_epoch` in Module×2, `random_split` out Dataset×2, `train_test_split` out DataFrame×2) gardent leurs handles par port visibles — l'ambiguïté n'est jamais résolue par magie.
- **Coloration verte des ports fournis** : un port d'entrée passe en vert s'il a une edge entrante ; un port de sortie en vert s'il a au moins une edge sortante. État dérivé des edges existantes, aucune donnée à stocker.
- **Remplacement de connexion** : connecter une source vers un input déjà fourni **remplace** la connexion existante sur ce port (l'ancienne edge est supprimée).
- **Garde anti-double-input** : 1 input = 1 edge max (le remplacement ci-dessus l'applique) — corrige le bug latent où le backend laissait silencieusement le dernier edge gagner, et où le codegen émettait `f(x=1, x=2)`.
- **Fan-out conservé** : un output peut alimenter plusieurs blocs (plusieurs edges depuis le même point).
- **Vue grille inchangée dans sa règle** : le point unique s'applique aussi, la règle gauche→droite des colonnes reste.

## Capabilities

- **New Capabilities**:
  - `single-port-connections`: point unique d'entrée/sortie pour les blocs non-ambigus, résolution automatique des ports par compatibilité, coloration verte des ports fournis, remplacement de connexion sur input déjà fourni, garde 1 input = 1 edge.
- **Modified Capabilities**: `block-type-system` — le classifieur de compatibilité existant (`classifyEdge`) est réutilisé tel quel, aucune exigence ne change côté type-check. Aucune modification requise.

## Impact

- **Frontend** (uniquement) :
  - `frontend/src/components/flow/BlockNode.tsx` — rendu des handles : point unique (handles superposés au centre, un seul visible) ou handles individuels (blocs ambigus) ; coloration verte des ports fournis.
  - `frontend/src/components/flow/FlowCanvas.tsx` — `onConnect` : résolution automatique du couple (source_port, target_port) par compatibilité, remplacement de l'edge existante sur l'input cible.
  - `frontend/src/store/useAppStore.ts` — aucune donnée nouvelle (vert = dérivé des edges) ; le remplacement de connexion passe par les actions existantes.
- **Backend** : aucun changement — les edges stockent toujours les vrais noms de ports (`in_1`, `out_1`…), donc validation, exécution et codegen continuent de fonctionner.
- **Tests** : les 58 tests vitest existants doivent passer ; tests ajoutés pour la résolution de ports et le remplacement de connexion.
