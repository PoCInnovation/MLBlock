## Context

Le store (`useAppStore`) expose déjà `isDirty()` : comparaison du fingerprint du canvas courant (`fingerprintOf({flowNodes, flowEdges, projectName})`) au `savedFingerprint` (dernier save/load). Le bouton « Sauvegarder » (`EditorHeader.tsx`) ne l'utilise que pour le garde-fou de déconnexion (ligne ~149) ; le rendu du bouton ne grise que pendant `saving`.

## Goals / Non-Goals

**Goals:**
- Le bouton « Sauvegarder » reflète l'état de synchronisation : actif si modifié, désactivé si propre.
- Retour visuel clair quand le projet est à jour.

**Non-Goals:**
- Modifier la logique de save/stash/restore (unsaved-changes-guard inchangé).
- Comparaison remote vs localStorage (option C de l'exploration — rejetée : contradiction avec le purge du stash au save).

## Decisions

### D1 — Le bouton principal reflète `isDirty()`
`EditorHeader.tsx` : `disabled={!isDirty() || saving}` sur le bouton « Sauvegarder » principal + style grisé quand désactivé. La lecture se fait via le hook store existant (re-render automatique à chaque changement de fingerprint).

### D2 — Feedback « Sauvegardé » quand propre
Quand `!isDirty() && !saving`, le bouton affiche « Sauvegardé » (icône Check) avec un style neutre au lieu de « Sauvegarder ». Évite d'ajouter un badge/état séparé (minimal).

### D3 — L'action du menu ⋮ inchangée
L'entrée « Sauvegarder » du menu ⋮ (si présente) reste telle quelle — le menu est une action forcée, pas un indicateur.

## Risks / Trade-offs

- **Premier montage** : au mount d'un nouveau projet, `isDirty()` vaut false (fingerprint initial == sauvegardé) → bouton « Sauvegardé » dès l'ouverture — correct (rien à sauvegarder tant que rien n'est modifié).
- **`savedFingerprint: null`** : `isDirty()` retourne false → bouton désactivé — cohérent (pas de projet chargé).
