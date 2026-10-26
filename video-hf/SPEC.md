# SPEC — MLBlock démo v2 (storyline A)

GOAL:    Un étudiant bloqué par une erreur de code comprend, en 50 s, qu'il peut classer 178 vins en assemblant 9 blocs, et voit le vrai résultat (100,0 % / 98,1 %).
OUTPUT:  HyperFrames, 1920x1080, 30 fps
TIME:    50 s x 30 fps = 1500 frames. Pas de musique garantie (voir SOUND). Pas de BPM.

## LOOK
Monde AVANT (0–8 s) :
- ground `#E9E4DC`, grain 0 (aplat), ink `#1B1714`, erreur `#C0392B` (une seule fois, sur la ligne ValueError).
- code : JetBrains Mono (police embarquée), 34 px, interligne 1,45, 12 lignes (contenu exact de `assets/avant/avant.py`).
- erreur : contenu exact de `assets/avant/erreur.txt` : `ValueError: could not convert string to float: 'class_2'`.
- le code occupe 62 % de la largeur (1190 px), aligné à gauche à x=120 ; une légende à droite : `178 vins · 3 classes · 0 modèle` en Fredoka 700, 72 px.
Monde APRÈS (8–50 s) : tokens réels de `frontend/src/index.css` (`.dark`) :
- ground `#171311`, card `#1F1916`, ink `#F0E9E3`, border `#3A332E`, accent `#D97757` (une seule couleur d'accent hors macros).
- macros (de `backend/mlblock/core/stages.py`) : Données `#22C55E`, Modèle `#6366F1`, Résultats `#06B6D4`.
- titres : Fredoka 700, 112 px (≈10,4 % de la hauteur), une ligne, 1 mot en accent ; corps : Geist 600, 44 px.
- captures : pleine largeur de plan, jamais dans une petite fenêtre au milieu d'un fond vide ; zoom 1,6–2,0x sur la zone utile, texte natif de la capture ≥ 26 px après zoom.
- logo MLBlock = carré 160 px arrondi 36 px, fond `#D97757`, carré blanc 56 px arrondi 8 px au centre, puis le mot `MLBlock` Fredoka 700 (définition réelle : `EditorHeader.tsx:115-118`). Logo PoC = `assets/shots/poc-logo.png` sur pastille claire `#FAF7F5`, 22 % de la largeur max.

## OBJECTS
- terminal papier : carte `#F4F0E8` bordure `#1B1714` 2 px, ombre 0 12 0 `#1B1714` 100 % (offset dur, pas de flou), barre de titre `avant.py`.
- curseur : flèche réelle (agent-cursor du registre), 5,5 % de la largeur (≈105 px).

## MOTION
- arrivée : `expo.out` 0,5 s ; caméra : `power2.inOut` 0,6 s + flou de mouvement 15 px (`data-motion-blur="on"` racine) ; sortie : `power3.in` 0,25 s.
- compteur : `count-up` 0,9 s ease-out. Aucun ressort sur l'opacité. Titre atterri = immobile.
- transitions (4 types) : (1) object-becomes-the-world (erreur → bouton `Lancer`, 0,65 s), (2) blur swap sur un même décor, (3) iris depuis le clic du curseur, (4) coupe sèche (≤ 1/3 des raccords).

## SHOTS (frames @30 fps, héros du plan, ce qu'on lit, son, passage au suivant)
1. 0–75 : terminal avec ValueError visible dès la frame 0 ; lecture : « ça plante » ; son : tick ; sortie : le code défile vers le haut de 0,2 s.
2. 75–240 : le code se (re)tape en 1,6 s puis l'erreur tombe, curseur hésite sur `fit(` ; légende « 178 vins · 3 classes · 0 modèle » ; sortie : le message d'erreur reste.
3. 240–330 : transition (1) ; le bouton `Lancer` (vert `#22C55E` de l'UI) grossit ~8 % → 250 % ; titre « MLBlock » atterrit immobile ; son : whoosh.
4. 330–600 : `04-editeur-complet.png` plein cadre ; zoom sur Données puis Modèle puis Résultats, une macro à la fois (30 f chacune) ; curseur relie un port ; texte : « Assemble. » ; son : click + pop par macro.
5. 600–780 : `06-type-refuse.png`, zoom sur le toast `Aucun port d'entrée compatible disponible sur la cible` ; texte : « Il te corrige. » ; son : tick d'erreur.
6. 780–960 : `07-score-badge.png` puis `08-score-popover.png` ; zoom sur `85/100 · Expert` ; texte : « Il t'évalue. » ; son : pop.
7. 960–1230 : `09-run-1-start.png` (job créé) puis écran résultats : `100,0 %` et `98,1 %` (count-up), matrice `[[19,0,0],[0,21,0],[0,0,14]]`, `11-tsne.png` ; mention « Exécution locale du code généré · jeu wine, 178 vins » 28 px ; son : riser puis impact sur 100,0 %.
8. 1230–1350 : une ligne « Même jeu de vins. Zéro erreur. » (≤ 6 mots/ligne), 0,3 s de silence de musique.
9. 1350–1500 : logo MLBlock porté par le curseur qui clique, `9 cours guidés`, CTA « Essaie-le », logo PoC ; tenu 2,5 s.

## SOUND
Aucun fournisseur de musique garanti (pas de `heygen`, pas de MusicGen). Effets gratuits seulement sur de vraies actions : tick de frappe (beat 1–2), whoosh (beat 3), click + pop (4), tick d'erreur (5), pop (6), riser puis impact (7). Niveau : lit −16 LUFS ; effets +3 à +6 dB ; pic ≤ −1 dBTP. Si aucune musique : film muet + effets, dit dans `REVIEW.md`.

## BANNED
Défauts par défaut de `spec.md` (vide sombre avec petits éléments flottants, glow, dégradés violets, tout centré, tout fondu/glissé, trois cartes en ligne, logo dans un coin, titre sur capture assombrie) PLUS :
- tout ce que faisait la v1 : libellé qui masque du contenu, bandeau sous-titre permanent, fondu enchaîné entre les deux mondes, `Callout` rectangle rempli sur capture ;
- pastille/chips arrondis décoratifs, étiquettes `01 / 02` ;
- inventer du code « de l'étudiant » (le code montré = `avant.py`, jamais le code généré de 396 lignes).

## QA (images à relire sur le rendu)
t=0,1 s : terminal papier + ValueError (jamais noir).
t=6 s : code complet + légende « 178 vins · 3 classes · 0 modèle ».
t=9 s : écran sombre sorti du bouton `Lancer` + titre MLBlock.
t=16 s : éditeur, une macro en gros plan, texte « Assemble. ».
t=23 s : toast de refus lisible.
t=29 s : badge 85 % Expert.
t=35 s : `100,0 %`, `98,1 %`, matrice, t-SNE, mention « Exécution locale ».
t=43 s : « Même jeu de vins. Zéro erreur. ».
t=48 s : logo MLBlock, `9 cours guidés`, CTA, logo PoC.
