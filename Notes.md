# Rendre plus ludique l'ui
Les liens entre les bloks peuvent avoir une animation de convoyeur de camion pour imager le transfert des donnes

# Blocks
Ajouter des types de données (images, ...)
Ajouter des blocks et revoir l'implémentation actuelle pour maximiser les possibilitées (pour proceder il faut regarder les exercices de base d'apprentissage de l'ia et vérifier un par un si on peux les réaliser)
⚠ Torchvision manque dans pyproject.toml → les blocs transforms (to_tensor, normalize, random_crop, random_flip, resize) plantent au runtime. Décision en attente (ajouter la dépendance).

# Implémentation
- Visualisation des resultats → OK
- Run de pipelines → OK (run local réel en subprocess + dispatch GPU ; la boucle execute→callbacks→panel fonctionne)

## OK
Le save des pipelines
L'import et l'export (validation des types inconnus incluse)
L'authentification perdue au refresh (revoir l'implémentation de supabase auth)
La visualisation des résultats (contrat de sortie typé + panel Console/Résultats)
Le run de pipeline (build + execute + polling, exécution locale sans GPU via MLBLOCK_RUN_MODE=local)

# Delete

## OK
Supprimer le pas à pas

# Les tutos
deux cours : avancé et facile
sous format .md rédiger deux cours
imaginer l'UI/UX
Coder l'ui/ux

# To fix

## OK
Les noms des outputs doivent apparaitrent directement pour meilleur ui/ux
Les noms des params doivent apparaitrent directement pour meilleur ui/ux
Il faux plus d'autocomplétion dans les params des blocks (trop imprécis)
Tout traduire en français
impossible de retirer les blocks en mode avancé

# Idea
TOutes les sorties des blocks sont accessibles à tous et le systeme linéaire deviens possible
