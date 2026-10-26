# REVIEW — MLBlock démo v2 (Hyperframes)

Film : 47,0 s, 1920×1080, 30 fps, h264 + AAC. Rendu **brouillon** disponible (`out/mlblock-demo-v2-draft.mp4`) ; le rendu `delivery` n'est lancé qu'après validation de l'aperçu (règle du skill).

## Appels créatifs
- **Storyline retenue : A, « un étudiant × avant/après »** (`STORYLINES.md`). Un seul étudiant, un seul jeu (wine, 178 vins), deux mondes : papier clair (code qui plante) → thème sombre réel de MLBlock.
- **Transition « objet → monde »** : le vrai bouton `Lancer` (#22C55E, mesuré à x=1367 y=30 79×32 dans la capture) grossit jusqu'à couvrir l'écran.
- **Règle de mise en page unique** pour les 4 scènes à capture : colonne texte à gauche (0–620 px), fenêtre de capture à droite (1300×1080). Le texte ne recouvre jamais l'UI. (Premier jet : texte posé sur la capture → illisible, rejeté après revue.)
- **Le payoff est « le chiffre »** : `100,0 %` à pleine largeur, compteur accéléré (`power2.in`) qui atteint 100,0 % exactement à l'impact (38,2 s) ; le riser culmine au même instant (mesuré : −12,2 dB à 38,2 s dans le mix). La matrice et le t-SNE arrivent après.
- Storylines non construites : B « le résultat d'abord », C « avant/après pur » (écartée : les 396 lignes de code généré ne sont pas du code d'étudiant).

## Ce qui est réel / non inventé
- Code « avant » = `assets/avant/avant.py` (12 lignes), erreur = `assets/avant/erreur.txt`, **exécutés** (4 runs identiques : `ValueError: could not convert string to float: 'class_2'`, graine fixée).
- Captures = l'UI de production (`04`, `06`, `07`, `08`, `09-run-1`, `10`, `11-tsne`), non redessinées.
- Chiffres = `video/data/local-run/outputs.json` (RF 1,0 ; LR 0,9814814814814815 ; matrice `[[19,0,0],[0,21,0],[0,0,14]]`) ; 9 blocs distincts (n1…n9) vérifiés.
- **Le run n'est PAS un run Vast.** Deux essais prod ont échoué (`Installation des dépendances échouée`, jobs `19fd29cf`, `1f399bbe`). La vidéo affiche « Exécution locale du code généré · jeu wine, 178 vins » et n'affiche jamais un `done` de Vast.
- Logo MLBlock : défini par le code de l'app (`EditorHeader.tsx:115-118`) et reproduit à l'identique (le repo n'a pas de fichier logo MLBlock) ; logo PoC = `frontend/public/assets/poc-logo.png`.

## Mesuré / seulement regardé
- **Mesuré** : `lint` 0/0 ; `check` 0 erreur 0 avertissement (lint, runtime, layout, contraste 27/27, craft) ; fichier : h264, 1920×1080, 30 fps, AAC 48 kHz stéréo, durée 50,000 s ; audio : −17,3 LUFS intégré, pic vrai −1,5 dBTP, 0 écrêtage ; attaques d'effets mesurées aux instants prévus (0,42 ; 0,78 ; 1,12 ; 8,09 ; 11,94 ; 14,19 ; 14,9 ; 16,43 ; 21,99 ; 27,84 ; 36,02 ; 47,2 s).
- **Seulement regardé** : la composition (planches `snapshot --review`, 9 images extraites du mp4 rendu).
- **Personne n'a écouté le son** : il est mesuré, pas entendu.

## Défauts trouvés et corrigés pendant la revue
Texte sur capture (P0) → colonnes ; titre « corrige » sur le graphe (P0) ; plan 3 d'`assemble` hors image (bandes noires) ; riser écrêté (+0,8 dBTP) → volume 0,5 ; trous de 3 s (`dead_stretch` ×2) → mouvement réel ; écran vide à 9 s et à 35 s ; payoff en coin d'écran (P0) → grands chiffres ; **police Geist non déclarée** dans 5 scènes (repli système plus large, texte masqué par le logo PoC) → `@font-face` ajouté.

## Plan le plus faible
Le Journal (`09-run-1-start.png`, 0–2,7 s de la scène `run`) : capture réelle mais sombre et floue ; elle prouve « un job est créé » sans être belle. Avec plus de temps : recapturer le Journal en succès (impossible tant que le bootstrap Vast échoue).

## Manques assumés
- **Pas de musique** : aucun fournisseur disponible (`heygen` absent, MusicGen non installé) ; film muet + effets sonores. Pour en ajouter : déposer `assets/music/bgm.mp3` (`id="music"`, `data-timeline-role="music"`) puis `npx hyperframes beats`.
- Le curseur n'est pas le composant `agent-cursor` du registre (trop spécifique « agent IA » : étiquette de nom, étapes) ; c'est une flèche SVG simple, animée par GSAP.
- `code-typing` du registre écarté (décor avec glow banni par la SPEC, fichier de démo à réécrire) ; le code apparaît entier dès la frame 0, ce qui sert la règle « jamais de première image vide ».
- Rendu logiciel (pas de GPU sous WSL) : lent mais déterministe.

## Révision 2 (retours : « Avant » à 5 s, reveal imparfait, textes qui se chevauchent dans « Assemble »)
- **Avant : 8,3 s → 5,0 s.** Légende 0,3–1,2 s, curseur 1,5–3,3 s, sortie 4,7 s. Toute la suite glisse de −3,3 s (table unique : hôtes, racine, 12 effets sonores recalés sur leur action).
- **Reveal** : cause réelle = ordre des calques (`#rv-dark` devant `#rv-green` mangeait le vert), pas le timing. Nouvelle mécanique en iris : le vert sort du vrai bouton `Lancer`, plein vert tenu 0,1 s, se referme sur le centre ; **aucun texte n'est jamais sur du vert** (rayon du vert mesuré < 75 px quand le titre entre). Titre à 1,0 s, sous-titre à 1,45 s.
- **Assemble** : cause réelle = un sous-texte (`as-s2`) calé à 4,15 s au lieu de 5,25 s (décalage raté) + `hide`/`show` qui se recouvraient. Réécrit avec un tableau de plans : un seul texte à l'écran à la fois, plus de trou < 0,2 s. Sous-textes raccourcis (lecture ≥ 0,5 s + 0,3 s/mot).
- **Run** : la matrice entrait pendant que le bandeau rétrécissait (chevauchement avec `100,0 %`) → entrée après la fin du bandeau ; scène allongée de 0,3 s (9,5 s).
- **Polices** : titres `corrige`/`evalue` à 90 px (« Il te corrige. » mesuré 567 px à 104 px > 550 px de colonne).
- Le curseur d'`assemble` et son clic ont été supprimés (curseur retiré lors du passage en colonnes ; un son sans action à l'écran était une erreur).

## Mesuré après révision
`lint` 0/0 ; `check` 0 erreur 0 avertissement (lint, runtime, layout, contraste, craft) ; fichier 47,000 s h264 1920×1080 30 fps ; audio −17 LUFS, pic vrai −1,5 dBTP, 0 écrêtage ; attaques d'effets aux instants recalés (4,74 ; 9,38 ; 12,34 ; 14,88 ; 19,09 ; 24,64 ; 31,64 ; 42,8 s).
