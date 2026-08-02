## Context

La palette du mode avancé (`FlowPalette.tsx`) affiche les 64 blocks du catalogue en une liste unique, scrollable, sans recherche ni filtre. 33 blocks sont dans `neural`.

## Goals / Non-Goals

**Goals:**
- Recherche par nom en direct (input texte)
- Filtre par catégorie (chips cliquables)
- Filtres combinés (query + catégorie)
- État local uniquement

**Non-Goals:**
- Pas de persistance de la recherche/filtre (état UI éphémère)
- Pas de changement de layout global de la palette
- Pas de pagination

## Decisions

1. **État local `useState`** dans `FlowPalette.tsx` :
   ```ts
   const [query, setQuery] = useState('')
   const [cat, setCat] = useState('all')
   ```

2. **Logique de filtrage** — combinée, insensible à la casse :
   ```ts
   const visible = types.filter(t => {
     const def = catalog.blocks[t]
     const label = def.segs.find(s => s.t === 'text')?.v ?? t
     const matchQuery = !query || label.toLowerCase().includes(query.toLowerCase())
     const matchCat = cat === 'all' || def.cat === cat
     return matchQuery && matchCat
   })
   ```

3. **UI** :
   - Input de recherche dans le header (placeholder "Rechercher un block…")
   - Chips horizontales scrollables (`Tous` + une par catégorie), un seul actif
   - La liste filtrée garde le grouping par catégorie

4. **Thème** : utiliser `theme.ts` + `colorFor()`, pas de hex en dur.

## Risks / Trade-offs

- **[Liste aplatie]** Quand un filtre catégorie est actif, le grouping par catégorie devient redondant (une seule catégorie affichée) → garder le grouping tel quel, c'est simple et cohérent
- **[Performance]** 64 blocks filtrés à chaque keystroke → négligeable, pas de memo nécessaire
