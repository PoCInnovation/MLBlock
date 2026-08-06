# Design: block-param-intelligence

## Context

Le registry introspecte déjà les docstrings (`_extract_param_desc`) et expose `ParamInfo{type, description, default, required, options}` dans le catalogue — mais le frontend (`toSegments`) jette la description et rend tous les params non-Literal en texte libre. Les 3 listes (shape, mean, std) exigent une syntaxe JSON exacte ; `evaluate.method` est un string libre à 2 valeurs valides ; les 66 ints et 20 floats ont des fourchettes naturelles (probabilités ∈ [0,1], compteurs ≥ 1) invisibles.

Le pattern qui marche déjà : les `Literal` → `<select>` avec `options`. La validation live à réutiliser : le feu tricolore du type-checking (vert/rouge à l'édition).

Contraintes : les blocs restent des fonctions pures avec docstrings FR ; `get_type_hints` échoue sur les annotations string → pas d'`Annotated` ; le catalogue est la seule interface frontend ; le CSV est stocké sur Supabase storage.

## Goals / Non-Goals

**Goals:**
- Métadonnées de param parsées des docstrings (convention FR), exposées dans le catalogue.
- UI : placeholder discret + validation live + input number + datalist + vérification JSON/longueur.
- Autocomplétion `target_column` dataflow-aware (colonnes du CSV source).

**Non-Goals:**
- Refonte des blocs (docstrings enrichies uniquement, pas de nouvelle API).
- Validation stricte au run (la coercion reste la frontière d'exécution ; la validation live est un guide).
- Autocomplétion pour d'autres params dépendant des données.

## Decisions

### D1 — Convention docstring FR, suffixe structuré
`_extract_param_desc` capture la description jusqu'à la fin de ligne ; on étend la regex pour parser un suffixe entre parenthèses à la fin :

```
p: Probabilité de dropout. (entre: 0-1, pas: 0.05)
kernel_size: Taille du filtre. (impair)
method: Métrique. (choix: mse|accuracy)
shape: Forme d'entrée. (format: [C,H,W] | [N,C,H,W])
mean: Moyennes par canal. (longueur: 3)
```

Grammaire : `(cle: valeur)` séparées par `, `, clés françaises `entre|pas|impair|choix|format|longueur`. Résultat dans `ParamInfo` : `min, max, step, odd, choices: list[str], format, len`. `choices` pour un param existant avec `options` (Literal) → redondant, ignoré.
- *Pourquoi docstring* : source unique, discovery existante, aucun changement de signature.
- *Alternatives* : `Annotated[Field]` (get_type_hints échoue), heuristiques par nom (fragiles), mapping centralisé (info hors des blocs).

### D2 — Catalogue exposé, segments enrichis
`toSegments` propage `min/max/step/odd/choices/format/len/description` dans le segment (extension des types `NumSeg`/`SelSeg`). Le frontend ne calcule rien — il affiche ce que le backend déclare.

Rendu :
- **num avec range** → `input type=number` min/max/step + placeholder `entre 0 et 1` ; **odd** → validation « valeur paire refusée ».
- **str avec choices** → `<input list>` + `<datalist>` (autocomplétion, saisie libre possible).
- **list avec format** → placeholder `[1, 28, 28]` + validation JSON live (couleur du feu tricolore) ; **len** → compteur d'éléments.
- **description** → tooltip au survol du label.

### D3 — Validation live (feu tricolore)
Même mécanique que le type-checking : à chaque frappe, valider la valeur contre les métadonnées (range, impair, choices, JSON, longueur) → bordure/icône verte (valide) ou rouge (invalide + message) ; jamais bloquant à la saisie. Les valeurs invalides restent saisissables (le run reste la vérité finale).

### D4 — Autocomplétion target_column (dataflow-aware)
- Backend : `GET /api/files/{path}/columns` — lit le CSV stocké (Supabase storage, 1re ligne) → `{columns: [...]}`. Auth : même dépendance que le reste (utilisateur courant).
- Frontend (avancé) : pour un node, remonter les edges entrants récursivement jusqu'à un `load_csv` (via `data.fields.path`) → fetch des colonnes → datalist sur `target_column`.
- Frontend (linéaire) : le bloc précédent de type `load_csv` dans le script → même mécanique.
- Saisie libre toujours possible ; pas de colonnes (pas de fichier, chemin inconnu) → champ libre muet.
- *Pourquoi* : les colonnes ne sont pas dans le catalogue (statique) — elles dépendent du graphe et des données.

## Risks / Trade-offs

- **Docstrings FR et parsage** : la convention doit tolérer une description sans suffixe (le comportement actuel reste) et un suffixe mal formé (ignoré silencieusement, jamais bloquant).
- **`entre: 0-1` ambigu** : bornes inclusives/exclusives non distinguées — choix : bornes inclusives par défaut, `(entre: 0<1)` pour exclure un côté si besoin. Documenté.
- **Datalist et nombres** : `input type=number` n'a pas de datalist fiable → les `choices` sur un `int`/`float` (rare) utiliseront un `<select>` pur.
- **target_column en aval de df_to_tensor** : le DataFrame source peut être transformé — on remonte jusqu'au premier `load_csv`/source trouvé, fallback libre.
- **Perf** : fetch des colonnes par node à l'ouverture — une seule requête par chemin unique (cache par URL).
