/**
 * Dictionnaire enfant : un mot simple + une astuce par type de bloc.
 * Utilise pour la palette Junior, les bannieres du watcher et les toasts.
 * Type absent -> on garde le label du catalogue (filet existant).
 * Tout en ASCII (pas d'accents).
 */
export type KidEntry = { label: string; astuce: string }

export const KID_LABELS: Record<string, KidEntry> = {
  load_csv: { label: 'Charger un tableau', astuce: 'Lis un fichier de donnees.' },
  load_sklearn_dataset: { label: 'Prendre un jeu tout pret', astuce: 'Un jeu de donnees fourni, sans fichier.' },
  load_image: { label: 'Charger des photos', astuce: 'Lis des images depuis un dossier.' },
  load_torch_dataset: { label: 'Charger des images MNIST', astuce: 'Des chiffres ecrits a la main, prets a l emploi.' },
  load_text: { label: 'Charger un texte', astuce: 'Lis un fichier texte.' },
  normalize: { label: 'Normaliser', astuce: 'Remet les nombres a la meme echelle.' },
  resize: { label: 'Redimensionner', astuce: 'Donne la meme taille a toutes les images.' },
  to_tensor: { label: 'Convertir en tenseur', astuce: 'Transforme les donnees pour le modele.' },
  tokenize: { label: 'Decouper en mots', astuce: 'Coupe un texte en petits morceaux.' },
  build_vocab: { label: 'Faire le dictionnaire', astuce: 'Donne un numero a chaque mot.' },
  encode_text: { label: 'Coder le texte', astuce: 'Remplace les mots par des numeros.' },
  embedding: { label: 'Plonger les mots', astuce: 'Donne du sens aux numeros.' },
  multihead_attention: { label: 'Faire attention', astuce: 'Le modele regarde les mots importants.' },
  layernorm: { label: 'Stabiliser', astuce: 'Calme les nombres pour mieux apprendre.' },
  train_test_split: { label: 'Couper en 2', astuce: 'Une partie pour apprendre, une pour tester.' },
  random_split: { label: 'Couper en 2 (images)', astuce: 'Separe les images : apprendre / tester.' },
  standard_scaler: { label: 'Centrer reduire', astuce: 'Harmonise les echelles avant de comparer.' },
  polynomial_features: { label: 'Ajouter des courbes', astuce: 'Cree des combinaisons pour deviner mieux.' },
  kmeans: { label: 'Regrouper', astuce: 'Range les points en groupes qui se ressemblent.' },
  pca: { label: 'Aplatir en 2D', astuce: 'Resume les donnees en 2 nombres pour voir.' },
  tsne: { label: 'Voir les groupes', astuce: 'Dessine les points pour voir les paquets.' },
  logistic_regression: { label: 'Deviner oui/non', astuce: 'Apprend a predire une categorie.' },
  linear_regression: { label: 'Deviner un nombre', astuce: 'Apprend a predire une valeur.' },
  decision_tree: { label: 'Deviner avec un arbre', astuce: 'Un arbre de questions oui/non.' },
  random_forest: { label: 'Deviner avec une foret', astuce: 'Plusieurs arbres votent ensemble.' },
  knn: { label: 'Deviner avec les voisins', astuce: 'Regarde les exemples les plus proches.' },
  svm: { label: 'Deviner avec une frontiere', astuce: 'Trace la meilleure separation.' },
  silhouette: { label: 'Noter les groupes', astuce: 'Dit si les groupes sont bien formes.' },
  confusion_matrix: { label: 'Voir les erreurs', astuce: 'Montre ou le modele se trompe.' },
  evaluate: { label: 'Evaluer', astuce: 'Verifie si le modele devine juste.' },
  train_model: { label: 'Entrainer', astuce: 'Fait apprendre le modele.' },
  adam: { label: 'Regler la vitesse', astuce: "L'outil qui fait apprendre petit a petit." },
  sgd: { label: 'Regler la vitesse (simple)', astuce: 'Une autre facon de faire apprendre.' },
  cross_entropy_loss: { label: 'Compter les erreurs', astuce: "Mesure a quel point le modele se trompe." },
  mse_loss: { label: 'Compter les ecarts', astuce: 'Mesure la distance aux bonnes reponses.' },
  conv2d_layer: { label: 'Voir les formes', astuce: 'Repere les lignes et les coins des images.' },
  relu_layer: { label: 'Garder le positif', astuce: 'Ne garde que ce qui compte.' },
  maxpool2d_layer: { label: 'Zoomer', astuce: 'Resume chaque petite zone en un point.' },
  flatten_layer: { label: 'Aplatir', astuce: 'Deroule l image en une seule ligne.' },
  linear_layer: { label: 'Melanger et deviner', astuce: 'Combine tout pour donner une reponse.' },
  plot_predictions: { label: 'Voir en image', astuce: 'Dessine les resultats.' },
}

/** Label enfant, ou le label du catalogue si le type est inconnu. */
export function kidLabel(type: string, fallback: string): string {
  return KID_LABELS[type]?.label ?? fallback
}

/** Astuce enfant, ou chaine vide si inconnue. */
export function kidAstuce(type: string): string {
  return KID_LABELS[type]?.astuce ?? ''
}
