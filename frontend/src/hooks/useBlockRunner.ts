import { useRef, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import type { Block } from '../utils/blockHelpers'
import type { ConsoleLine } from '../store/useAppStore'

type Step = { id: string; logs: ConsoleLine[] }

function logsFor(b: Block): ConsoleLine[] {
  const f = b.fields
  switch (b.type) {
    case 'load_data':    return [{ k: 'info', t: `Données « ${f.ds} » chargées` }]
    case 'keep_split':   return [{ k: 'info', t: `On garde ${f.tr}% pour apprendre, le reste pour tester` }]
    case 'shuffle':      return [{ k: 'info', t: 'Exemples mélangés' }]
    case 'batch':        return [{ k: 'info', t: `Exemples groupés par ${f.bs}` }]
    case 'clean':        return [{ k: 'info', t: 'Données nettoyées' }]
    case 'normalize':    return [{ k: 'info', t: 'Tout mis à la même échelle' }]
    case 'resize':       return [{ k: 'info', t: `Images redimensionnées en ${f.w}×${f.h}` }]
    case 'tokenize':     return [{ k: 'info', t: 'Texte découpé en mots' }]
    case 'to_numbers':   return [{ k: 'info', t: 'Mots transformés en nombres' }]
    case 'linear_reg':   return [{ k: 'info', t: 'Modèle : droite de prédiction' }]
    case 'tree':         return [{ k: 'info', t: `Modèle : arbre de décision (profondeur ${f.d})` }]
    case 'knn':          return [{ k: 'info', t: `Modèle : plus proches voisins (k=${f.k})` }]
    case 'neural':       return [{ k: 'info', t: `Couche de ${f.u} neurones ajoutée` }]
    case 'activation':   return [{ k: 'info', t: `Façon de réagir : ${f.fn}` }]
    case 'image_detect': return [{ k: 'info', t: `Détecteur de motifs : ${f.f} motifs` }]
    case 'sequence':     return [{ k: 'info', t: 'Mémoire pour le texte activée' }]
    case 'flatten':      return [{ k: 'info', t: 'Données mises à plat' }]
    case 'output':       return [{ k: 'info', t: `Réponse parmi ${f.c} catégories` }]
    case 'lr':           return [{ k: 'info', t: `Vitesse d'apprentissage : ${f.lr}` }]
    case 'objective':    return [{ k: 'info', t: `But : ${f.obj}` }]
    case 'fit': {
      const ep = Math.max(1, Math.min(50, Number(f.e) || 10))
      let err = 0.95, acc = 58
      return Array.from({ length: ep }, (_, idx) => {
        err *= 0.74
        acc = acc + (99.2 - acc) * 0.42
        return { k: 'epoch', t: `Tour ${idx + 1}/${ep}   erreur ${err.toFixed(3)}   précision ${acc.toFixed(1)}%` }
      })
    }
    case 'save':         return [{ k: 'info', t: 'Modèle sauvegardé ✓' }]
    case 'evaluate':     return [{ k: 'ok',   t: `Test sur de nouveaux exemples — précision ${(96 + Math.random() * 3).toFixed(1)}%` }]
    case 'show_acc':     return [{ k: 'info', t: 'Précision affichée' }]
    case 'confusion':    return [{ k: 'info', t: 'Tableau des erreurs généré' }]
    case 'predict':      return [{ k: 'info', t: 'Réponse devinée : catégorie 7 (sûr à 98%)' }]
    case 'repeat':       return [{ k: 'info', t: `Répéter ${f.n} fois` }]
    case 'if_acc':       return [{ k: 'info', t: `Si précision > ${f.thr}%` }]
    case 'wait':         return [{ k: 'info', t: `Attendre ${f.sec} s` }]
    default:             return [{ k: 'info', t: b.type }]
  }
}

export function useBlockRunner() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepsRef = useRef<Step[]>([])

  const playStep = useCallback((i: number) => {
    if (!useAppStore.getState().running && i > 0) return
    if (i >= stepsRef.current.length) {
      const acc = (96 + Math.random() * 3).toFixed(1)
      useAppStore.getState().finishRun(acc)
      return
    }
    const st = stepsRef.current[i]
    useAppStore.getState().setRunningId(st.id)
    useAppStore.getState().appendConsoleLines(st.logs)
    timerRef.current = setTimeout(() => playStep(i + 1), st.logs.length > 1 ? 1500 : 620)
  }, [])

  const onRun = useCallback(() => {
    const { script, running, startRun } = useAppStore.getState()
    if (running) return
    if (timerRef.current) clearTimeout(timerRef.current)
    stepsRef.current = script.map(b => ({ id: b.id, logs: logsFor(b) }))
    if (stepsRef.current.length === 0) {
      useAppStore.getState().appendConsoleLines([{ k: 'sys', t: '⚠ Aucun bloc à exécuter.' }])
      return
    }
    startRun()
    playStep(0)
  }, [playStep])

  const onStop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!useAppStore.getState().running) return
    useAppStore.getState().stopRun()
  }, [])

  const onClear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    useAppStore.getState().clearAll()
  }, [])

  return { onRun, onStop, onClear }
}
