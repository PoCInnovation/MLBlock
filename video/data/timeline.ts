// Source unique : durées (s) et sous-titres FR par scène. FPS=30, total = 120 s.
export const FPS = 30;
export const FADE = 12; // frames de fondu entre scènes

// Valeurs d'un vrai run local de la pipeline (data/local-run/outputs.json).
export const RESULTS = { rf: 1.0, lr: 0.9814814814814815, matrix: [[19, 0, 0], [0, 21, 0], [0, 0, 14]] };

export const SCENES = [
  { id: "hook", sec: 10, sub: "MLBlock — Scratch, mais pour l'IA" },
  { id: "dashboard", sec: 15, sub: "Démarre depuis un modèle prêt, ou importe le tien" },
  { id: "build", sec: 25, sub: "Glisse des blocs, relie-les : Données → Modèle → Résultats" },
  { id: "types", sec: 15, sub: "Les ports sont typés : MLBlock t'empêche de te tromper" },
  { id: "score", sec: 20, sub: "Un prof IA évalue ta pipeline en direct" },
  { id: "run", sec: 25, sub: "Chaque bloc s'exécute et rend son résultat" },
  { id: "outro", sec: 10, sub: "Construis ta première IA, bloc par bloc" },
] as const;

export const TOTAL_FRAMES =
  SCENES.reduce((n, s) => n + s.sec * FPS, 0) - (SCENES.length - 1) * FADE;
