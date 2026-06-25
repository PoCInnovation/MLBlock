export type Category = { id: string; name: string; color: string }

export const categories: Category[] = [
  { id: 'data',    name: 'Données',   color: '#E59060' },
  { id: 'prep',    name: 'Préparer',  color: '#66C7B0' },
  { id: 'model',   name: 'Modèle',    color: '#B6A0E3' },
  { id: 'train',   name: 'Entraîner', color: '#7DAFEA' },
  { id: 'eval',    name: 'Tester',    color: '#EA9CC0' },
  { id: 'control', name: 'Contrôle',  color: '#E6C766' },
]
