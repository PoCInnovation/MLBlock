export const defs = {
  load_data:    { cat: 'data',    segs: [{ t: 'text', v: 'Charger les données' }, { t: 'sel', k: 'ds', def: 'Chiffres manuscrits', opts: ['Chiffres manuscrits', 'Photos d’animaux', 'Avis de films', 'Fleurs (Iris)', 'Météo'] }] },
  keep_split:   { cat: 'data',    segs: [{ t: 'text', v: 'Garder' }, { t: 'num', k: 'tr', def: '80', w: 42 }, { t: 'text', v: '% pour l’entraînement' }] },
  shuffle:      { cat: 'data',    segs: [{ t: 'text', v: 'Mélanger les exemples' }] },
  batch:        { cat: 'data',    segs: [{ t: 'text', v: 'Paquets de' }, { t: 'num', k: 'bs', def: '64', w: 42 }, { t: 'text', v: 'exemples' }] },

  clean:        { cat: 'prep',    segs: [{ t: 'text', v: 'Nettoyer les données' }] },
  normalize:    { cat: 'prep',    segs: [{ t: 'text', v: 'Mettre à la même échelle' }] },
  resize:       { cat: 'prep',    segs: [{ t: 'text', v: 'Redimensionner les images' }, { t: 'num', k: 'w', def: '28', w: 40 }, { t: 'text', v: '×' }, { t: 'num', k: 'h', def: '28', w: 40 }] },
  tokenize:     { cat: 'prep',    segs: [{ t: 'text', v: 'Découper le texte en mots' }] },
  to_numbers:   { cat: 'prep',    segs: [{ t: 'text', v: 'Transformer les mots en nombres' }] },

  linear_reg:   { cat: 'model',   segs: [{ t: 'text', v: 'Droite de prédiction (régression)' }] },
  tree:         { cat: 'model',   segs: [{ t: 'text', v: 'Arbre de décision — profondeur' }, { t: 'num', k: 'd', def: '5', w: 36 }] },
  knn:          { cat: 'model',   segs: [{ t: 'text', v: 'Plus proches voisins — k' }, { t: 'num', k: 'k', def: '3', w: 36 }] },
  neural:       { cat: 'model',   segs: [{ t: 'text', v: 'Réseau de neurones —' }, { t: 'num', k: 'u', def: '128', w: 48 }, { t: 'text', v: 'neurones' }] },
  activation:   { cat: 'model',   segs: [{ t: 'text', v: 'Façon de réagir' }, { t: 'sel', k: 'fn', def: 'ReLU', opts: ['ReLU', 'Sigmoïde', 'Tanh'] }] },
  image_detect: { cat: 'model',   segs: [{ t: 'text', v: 'Détecteur de motifs (images) —' }, { t: 'num', k: 'f', def: '32', w: 42 }, { t: 'text', v: 'motifs' }] },
  sequence:     { cat: 'model',   segs: [{ t: 'text', v: 'Mémoire pour le texte' }] },
  flatten:      { cat: 'model',   segs: [{ t: 'text', v: 'Mettre à plat les données' }] },
  output:       { cat: 'model',   segs: [{ t: 'text', v: 'Réponse parmi' }, { t: 'num', k: 'c', def: '10', w: 40 }, { t: 'text', v: 'catégories' }] },

  fit:          { cat: 'train',   segs: [{ t: 'text', v: 'Apprendre pendant' }, { t: 'num', k: 'e', def: '10', w: 42 }, { t: 'text', v: 'tours' }] },
  lr:           { cat: 'train',   segs: [{ t: 'text', v: 'Vitesse d’apprentissage' }, { t: 'num', k: 'lr', def: '0.01', w: 52 }] },
  objective:    { cat: 'train',   segs: [{ t: 'text', v: 'But' }, { t: 'sel', k: 'obj', def: 'Bien ranger en catégories', opts: ['Bien ranger en catégories', 'Deviner un nombre'] }] },
  save:         { cat: 'train',   segs: [{ t: 'text', v: 'Sauvegarder le modèle' }] },

  evaluate:     { cat: 'eval',    segs: [{ t: 'text', v: 'Tester sur de nouveaux exemples' }] },
  show_acc:     { cat: 'eval',    segs: [{ t: 'text', v: 'Afficher la précision' }] },
  confusion:    { cat: 'eval',    segs: [{ t: 'text', v: 'Voir les erreurs (tableau)' }] },
  predict:      { cat: 'eval',    segs: [{ t: 'text', v: 'Deviner un exemple' }] },

  repeat:       { cat: 'control', segs: [{ t: 'text', v: 'Répéter' }, { t: 'num', k: 'n', def: '3', w: 36 }, { t: 'text', v: 'fois' }] },
  if_acc:       { cat: 'control', segs: [{ t: 'text', v: 'Si précision >' }, { t: 'num', k: 'thr', def: '90', w: 42 }, { t: 'text', v: '%' }] },
  wait:         { cat: 'control', segs: [{ t: 'text', v: 'Attendre' }, { t: 'num', k: 'sec', def: '1', w: 36 }, { t: 'text', v: 's' }] },
}
