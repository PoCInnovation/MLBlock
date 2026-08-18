/**
 * Garde tap-vs-drag des items de la palette : un pointerdown suivi d'un click
 * est un tap (ajout de bloc) tant que le pointeur n'a pas parcouru plus de
 * TAP_MAX_DRAG_PX — au-delà, c'était un drag (DnD) et le click post-drag
 * (émis par certains navigateurs) ne doit pas créer de doublon.
 */

/** Distance (px) au-delà de laquelle un pointerdown + click est un drag. */
export const TAP_MAX_DRAG_PX = 8

/**
 * true si le click ne doit PAS déclencher l'ajout :
 * - press null → click synthétique (clavier/assistif) sans pointerdown ;
 * - déplacement > TAP_MAX_DRAG_PX → le geste était un drag, pas un tap.
 */
export function shouldIgnoreTap(
  press: { x: number; y: number } | null,
  clickX: number,
  clickY: number,
): boolean {
  if (!press) return true
  return Math.hypot(clickX - press.x, clickY - press.y) > TAP_MAX_DRAG_PX
}
