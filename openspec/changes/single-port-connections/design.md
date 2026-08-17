# Design — Single-Port Connections

## Context

Voir proposal.md (motivation) et specs/single-port-connections (exigences). État actuel vérifié dans le code :

- `BlockNode.tsx` rend un `Handle` par port (`topFor(i, n)` répartit verticalement), étiquettes `in_N · dtype` dans la grille commune du body.
- `FlowCanvas.tsx` `onConnect` : prend les handles cliqués tels quels, `classifyEdge` → compatible / convertible (toast + `insertConverter`) / incompatible (toast erreur).
- Les edges stockent `sourceHandle`/`targetHandle` = vrais noms de ports (`in_1`, `out_1`…), sérialisés en `source_port`/`target_port` avec fallback `'out_1'`/`'in_1'`. Backend et codegen consomment ces noms directement (le nom du port = nom du paramètre Python).
- ReactFlow positionne les edges d'après les handles présents dans le DOM — on ne peut pas référencer un port sans handle rendu.
- Aucun garde anti-double-input : le backend `inputs[target_port] = value` laisse silencieusement le dernier edge gagner, et le codegen émettrait `f(x=1, x=2)` (crash). Bug latent à corriger.
- Blocs ambigus (2+ ports même dtype, inventaire du catalogue) : `tensor_dataset`, `train_model`, `train_epoch` (inputs), `random_split`, `train_test_split` (outputs). Tous les autres sont résolubles par type de façon déterministe.

## Goals / Non-Goals

**Goals** :
- Point unique d'entrée/sortie pour les blocs non-ambigus, handles par port conservés pour les ambigus.
- Résolution automatique du couple (source_port, target_port) à la connexion, basée sur le classifieur existant.
- Coloration verte des ports fournis, dérivée des edges.
- Remplacement de l'edge existante quand un input déjà fourni est reconnecté.
- Tout cela frontend-only, edges toujours stockées avec de vrais noms de ports.

**Non-Goals** :
- Aucun changement backend (validation, exécution, codegen).
- Aucun changement de la règle gauche→droite de la vue grille.
- Pas de menu de sélection de port au drop (l'ambiguïté est rendue visible par les handles individuels, pas résolue par un dialogue).

## Decisions

### D1 — Tous les handles restent dans le DOM, superposés au centre pour les blocs non-ambigus

ReactFlow positionne les edges par handle rendu. Donc pour un bloc non-ambigu on rend **tous** ses handles mais **empilés au même point** (`top: 50%`) : un seul visible (le point unique), les autres `opacity: 0` + `pointer-events: none` (non draggables, non ciblables). Une edge référençant `in_2` (invisible) se dessine au centre — cohérent avec le point visible.

- **Pourquoi pas un seul handle** : une edge vers un port non rendu serait dessinée à une position par défaut incohérente ; et le backend exige des vrais noms de ports.
- **Pourquoi pas `isValidConnection`** : le blocage se fait déjà dans `onConnect` ; garder un seul point de décision.

Détection ambiguïté (par côté) : `new Set(ports.map(p => p.dtype)).size !== ports.length`.

### D2 — Résolution par scoring, dans `onConnect`, dans un utilitaire pur

Nouvelle fonction pure `resolveConnection(srcNode, tgtNode, srcHandle, tgtHandle, graph)` dans `frontend/src/utils/` (testable sans React) :

1. **Candidats** : côté ambigu → uniquement le handle cliqué (choix utilisateur figé). Côté non-ambigu → tous les ports du côté (le point unique représente tous les outputs/inputs).
2. **Score de chaque couple** (source, target) :
   - dtype identique : **3**
   - cible wildcard (`object`/`Any`) : **2**
   - même famille (`familyOf`) : **2**
   - convertible : **1**
   - incompatible : **0**
3. Meilleur couple ; en cas d'égalité, premier dans l'ordre de déclaration des ports.
4. Retour : `{ sourcePort, targetPort, verdict }` ou `null`.

**Pourquoi un score plus fin que `classifyEdge`** : `classifyEdge` rend `compatible` pour l'exact ET pour le wildcard. Sans distinction, `plot_predictions` (inputs `object` puis `pd.DataFrame`) avec une source DataFrame choisirait `in_1` (object, premier par ordre) au lieu de `in_2` (exact) — mauvais port sémantique. Le scoring préserve la priorité exact > wildcard.

`onConnect` consomme le résultat : verdict `compatible` → edge avec les ports résolus (en remplaçant l'edge existante sur le target, voir D3) ; `convertible` → toast + `insertConverter` adapté ; `incompatible` → toast erreur (comportement existant).

### D3 — Remplacement de l'edge existante sur l'input cible

Après résolution, avant d'ajouter la nouvelle edge : supprimer toute edge existante avec `target === tgtNode.id && targetHandle === port résolu`. Implémentation : `flowEdges.filter(...)` + concat, même pattern que `insertConverter` (déjà en place dans le fichier). Un seul `commitUndoPoint` au début de `onConnect` (déjà le cas) → le remplacement est un seul geste undoable.

**Alternative écartée** : bloquer avec un toast « déjà connecté » — l'utilisateur a choisi le remplacement (plus fluide pour corriger).

### D4 — Vert « fourni » dérivé dans `BlockNode`

`BlockNode` lit déjà `flowEdges` du store. Pour chaque port : input vert si `flowEdges.some(e => e.target === id && e.targetHandle === p.name)` ; output vert si `flowEdges.some(e => e.source === id && e.sourceHandle === p.name)`. Couleur `theme.color.success` appliquée aux étiquettes `in_N · dtype` dans le body et au handle/point correspondant.

- **Zéro donnée stockée** : pas de champ store, pas d'impact fingerprint / undo / payload / sérialisation.
- Recalcul automatique à chaque changement d'edge (le composant est déjà réactif aux edges).

### D5 — `insertConverter` résout ses ports

Le flux convertible insère un convertisseur entre A et B. Il faut lui passer les ports **résolus** du couple (sourcePort de A, targetPort de B) au lieu des handles cliqués, pour que les edges `A → conv` et `conv → B` ciblent les bons ports (un convertisseur a un seul input/output, mais le câblage vers B doit viser le port résolu).

## Risks / Trade-offs

- **Handles invisibles empilés** → le point unique est plus haut/plus bas que le premier port étiqueté ? → Le point est centré verticalement (`top: 50%`), l'étiquette reste dans le body ; c'est le comportement voulu (le point = le bloc, pas un port précis). Les blocs ambigus gardent la répartition par port.
- **Égalité de score entre ports d'un bloc non-ambigu** → impossible : dtypes distincts par définition, et wildcard vs exact est départagé par le score. Les égalités résiduelles (2 wildcards) sont départagées par l'ordre de déclaration.
- **Régression des tests existants** → la résolution est une fonction pure isolée, testable sans DOM ; les 58 tests vitest existants doivent passer inchangés.
- **Bug latent double-input** → corrigé par D3 (remplacement) : jamais deux edges sur le même port.

## Migration Plan

- Aucune migration de données : les pipelines sauvegardés contiennent déjà des edges avec de vrais noms de ports ; le rendu change, le format non.
- Déploiement : frontend seul (build + déploiement statique). Rollback : revert du commit, aucune compat arrière requise.

## Open Questions

Aucune — les choix restants (priorité exact > wildcard, remplacement plutôt que blocage, point centré) ont été tranchés avec l'utilisateur ou sont déterministes. Détails de style (taille du point, teinte de vert) réglables au moment de l'implémentation sans changer les specs.
