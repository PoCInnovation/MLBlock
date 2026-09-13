# 02 — Réduire le nombre de blocks (88 → ~45)

> **But:** Diviser par ~2 la charge cognitive palette, **sans perdre** la couverture des 12 exos §01. Réduire ≠ supprimer — c'est **fusionner / déprécier / cacher**.
> **Ordre adopté:** s'exécute **après** [03-evaluation-gaps](./03-evaluation-gaps.md). Ne pas couper avant la matrice `12×88`.

## État actuel (factuel)

* 88 blocks (97 fichiers `*.py` avec `__init__.py`) sur 13 `Category` (`{name}-{HEXCOLOR}`).
* Doublons `Tensor` vs `*_layer` (`convolution-6366F1`): `conv2d`/`conv2d_layer`, `linear`/`linear_layer`, `flatten`/`flatten_layer`, `relu`/`relu_layer`, `maxpool2d`/`maxpool2d_layer` — **5 paires** = bug #14 (poids éphémères vs persistants).
* Catégories mal nommées: `convolution-*` contient `linear/rnn/flatten`, collision couleur `modeles-F59E0B` vs `regroupement-F59E0B`.

## Règles de réduction

1. **Jamais sans mapping exo §01:** un block ne se supprime que si aucun des 12 DAGs ne l'exige (sinon `fusionner` ou `déprécier`).
2. **Paramétrique → `Module`, stateless → `functional`:** `conv/linear/embedding` **toujours** `*_layer` (`Module`), `relu/flatten/dropout` gardent les deux mais `Tensor` passe en `F.relu(x)` (pas `nn.ReLU()(x)`).
3. **Catégorie = Stage, pas Family:** `Category` sert la palette (couleur), `Family` sert `classify`. Ne pas confondre.

## Matrice cible (~45 blocks)

| Action | Blocks concernés | Pattern | Justif |
|---|---|---|---|
| **Supprimer (5)** | `conv2d`, `conv1d`, `conv3d`, `conv_transpose2d`, `linear` (versions `Tensor`) | Adapter | Poids éphémères, remplacés par `*_layer` |
| **Fusionner (6→3)** | `relu`+`relu_layer` → `relu_layer` seul, idem `maxpool/flatten` | Facade | 1 API canonique `Module`, `Tensor` reste en `F.*` interne |
| **Renommer (1 dossier)** | `convolution-6366F1` → `layers-6366F1` (ou `nn-6366F1`) | Bridge | Contient `linear/rnn`, pas que conv |
| **Déprécier (3, wrapper)** | `embedding` Tensor → `embedding_layer`, `dropout` garde 2 mais `Tensor` log `DeprecationWarning` | Adapter | Migration douce, tests verts |
| **Cacher (10, avancé)** | `prelu/selu/silu/gelu/elu/tanh/sigmoid/softmax/identity` → palette "Avancé" repliée | Facade | Gardés pour exos P1, pas en première vue |
| **Garder (45)** | `donnees(7) + transformations(7) + layers(5) + activation avancée(3) + normalisation(3) + regroupement(3) + sequences(4) + texte(3) + modeles(10) + entrainement(10) + renforcement(3) + visualisation(1)` | — | Couverture A/B/C |



1. Inventaire `BLOCK_REGISTRY` → CSV `block, category, family_in, family_out, used_in_exos[]`.
2. Tag chaque block `keep / merge / deprecate / hide / delete` avec raison + exo impacté.
3. PR1: `hide` + `deprecate` (non-breaking, `ruff`/`pytest` verts).
4. PR2: `delete` + `rename dossier` (breaking, migration `configs/*.json`).

## Critères d'acceptation

* [ ] CSV d'audit commité, 88 lignes taggées
* [ ] `GET /api/catalog` → ~45 blocks visibles par défaut (`?all=true` pour 88)
* [ ] Aucun des 12 DAGs §01 ne casse (ou gap documenté → §03)
* [ ] `pnpm build` + `pytest -q` verts après `hide/deprecate`

## Risques
* **Casser des pipelines sauvegardés:** `delete` sans `Adapter` qui délègue `conv2d -> conv2d_layer` = pipelines utilisateurs invalides. Wrapper obligatoire.
* **Ordre:** avec `1→3→2` adopté, pas d'aller-retour `delete→restore` — §3 précède §2.
