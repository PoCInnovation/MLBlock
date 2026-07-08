# MLBlock — Marketing & Business Model

**Le Scratch de l'IA.** Plateforme visuelle par blocs pour apprendre et expérimenter le machine learning.

---

## Positionnement

### Qu'est-ce que MLBlock ?

MLBlock est un éditeur visuel de pipelines ML, pensé pour l'éducation. L'utilisateur assemble des blocs-fonctions Python dans une interface DAG, le backend génère le code et l'exécute sur un GPU loué à la seconde. Aucune installation, aucune configuration serveur — un navigateur suffit.

### Concurrents

| Plateforme | Type | Public | Force | Limite |
|---|---|---|---|---|
| **Teachable Machine** (Google) | Web, no-code | Débutants, K-12 | Gratuit, zéro install, rapide | Modèles pré-entraînés uniquement (image/son/pose) |
| **Machine Learning for Kids** | Web + Scratch | Enfants (8-14 ans) | Pédagogique, connecté à IBM Watson | Pas de GPU, pas de PyTorch, limité à IBM |
| **PictoBlox** | Desktop, blocs | Écoles, STEM/Robotique | Robotique + IA | Payant (~11€/user), pas de pipelines complexes |
| **MIT App Inventor** | Web, blocs | K-12, cours | Gratuit, curriculum CSTA | Mobile uniquement, extensions IA limitées |
| **Lobe** (Microsoft) | Desktop | Débutants | Gratuit, local | Image classification uniquement, macOS/Windows |
| **Create ML** (Apple) | macOS/Xcode | Développeurs Apple | Gratuit, natif Apple | Apple uniquement, nécessite Xcode |
| **MLBlock** | Web + GPU cloud | Écoles, particuliers | Blocs Python réels, GPU T4, tout modèle | Version MVP en développement |

### Différenciation

MLBlock est le seul outil qui :
- Exécute du vrai code Python (PyTorch, sklearn, pandas) — pas un simulateur
- Utilise un GPU à la seconde via Vast.ai — coût < $0.53 par utilisateur / mois
- Laisse l'utilisateur tout construire — pas limité à des modèles préfabriqués
- S'intègre à Supabase — auth OAuth, realtime, base de données incluse

---

## Modèle de coûts — 500 utilisateurs

### Hypothèses

| Paramètre | Valeur |
|---|---|
| Utilisateurs (étudiants + particuliers) | 500 |
| Sessions par utilisateur / **semaine** | 1 |
| Sessions par utilisateur / mois | 4 |
| Durée d'une session (connexion totale) | 2h |
| Temps GPU actif par session | 30 min |
| Temps GPU actif par mois | 2h (4 × 30 min) |
| GPU | NVIDIA T4 via Vast.ai |
| Tarif GPU compute | $0.25 / h |
| Tarif storage (instance existante) | $0.001 / h |

### Coûts mensuels

| Poste | Détail | Coût |
|---|---|---|
| Frontend (Vercel/Netlify Free) | 500 users, bande passante gratuite | $0 |
| Backend (VPS Hetzner / Scaleway) | 1 vCPU, 2 Go RAM | ~$10 |
| Supabase (Free Tier) | Jusqu'à 50k users, 2 Go DB | $0 |
| GPU compute | 500 × 2h × $0.25/h | $250 |
| Storage GPU | 500 × 8h × $0.001/h | $4 |
| **TOTAL** | | **~$264/mois** |

### Coût par utilisateur

| Élément | Coût |
|---|---|
| GPU compute (2h × $0.25) | $0.50 / user |
| Storage (8h × $0.001) | $0.008 / user |
| Backend + infra (amorti 500) | $0.02 / user |
| **Total** | **~$0.53 / user / mois** |

---

## Modèle de revenus

### Marché écoles

| Tarif | Revenue 500 users | Coût | Marge |
|---|---|---|---|
| **1€ / étudiant / mois** | 500€ | ~244€ | **~51%** |

L'abonnement écoles couvre la classe entière. L'enseignant gère les comptes, les étudiants ont chacun 4 sessions/mois de 2h avec 30min de GPU par session.

### Marché particuliers

| Tarif | Revenue 500 users | Coût | Marge |
|---|---|---|---|
| **5€ / utilisateur / mois** | 2 500€ | ~244€ | **~90%** |

### Contrainte de marge minimale (particuliers)

Pour garantir **25% de marge minimale** sur le marché particuliers :

```
Prix max                   = 5€
Marge min                  = 25%
Coût max autorisé          = 5€ × 0.75 = 3.75€/user
Coût actuel                = ~0.53€/user
Marge réelle               = ~89%
```

La marge reste très large. Le goulot d'étranglement n'est pas le prix mais la capacité GPU concurrente.

### Seuil de rentabilité

| Marché | Prix/user | Coût total | Seuil |
|---|---|---|---|
| Particuliers | 5€ | ~244€ | **49 utilisateurs** |
| Écoles | 1€ | ~244€ | **244 étudiants** |

Avec 500 users répartis 50/50 écoles/particuliers :
- Revenue : 250 × 1€ + 250 × 5€ = **1 500€ / mois**
- Coût : **~264€ / mois**
- Marge nette : **82%**

### Upsell et évolutions

- Stockage supplémentaire : garder les pipelines et résultats (1€/mois)
- GPU plus puissant : A100 (3x plus rapide) pour $0.80/h (option premium 10€/mois)
- Sessions plus longues : 4h au lieu de 2h (+2€/mois)
- Export du code : téléchargement du `.py` généré (inclus)
- Collaboration : partage de pipelines entre utilisateurs (2€/mois par membre)
- Limite de sessions : au-delà de 4 sessions/mois, 0.25€/session supplémentaire

---

## Projection 12 mois

| Mois | Users | Revenue (50/50) | Coûts | Marge |
|---|---|---|---|---|
| M1 | 50 | 150€ | 37€ | 113€ |
| M3 | 150 | 450€ | 90€ | 360€ |
| M6 | 300 | 900€ | 168€ | 732€ |
| M9 | 500 | 1 500€ | 264€ | 1 236€ |
| M12 | 800 | 2 400€ | 420€ | 1 980€ |

---

## Markstrat

```
MLBlock
├─ Ecole (1€/user/mois)
│   ├─ Collèges & lycées (SNT, NSI)
│   ├─ Universités (licences MIASHS, info)
│   └─ Formations privées (data science bootcamps)
│
├─ Particuliers (5€/user/mois)
│   ├─ Étudiants en autodidacte
│   ├─ Curieux techniques (devs, data analysts juniors)
│   └─ Hobbyistes ML
│
└─ Options premium
    ├─ GPU A100 (+10€/mois)
    ├─ Sessions 4h (+2€/mois)
    └─ Collaboration (+2€/membre)
```

---

## Sources

- [Vast.ai Pricing](https://vast.ai/pricing) — GPU à $0.20-0.30/h T4
- [Supabase Free Tier](https://supabase.com/pricing) — Jusqu'à 50k users
- [Vercel Free Tier](https://vercel.com/pricing) — 100 Go bande passante
- [Hetzner Cloud Pricing](https://www.hetzner.com/cloud) — VPS à partir de 3€/mois
- [Teachable Machine](https://teachablemachine.withgoogle.com/) — Google
- [Machine Learning for Kids](https://machinelearningforkids.co.uk/) — Dale Lane / IBM
- [PictoBlox Pricing](https://pictoblox.ai/) — ~11€/user
- [MIT App Inventor](https://appinventor.mit.edu/) — MIT
