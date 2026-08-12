# Run Error Handling

## Purpose

Une exécution de pipeline échouée (ex. location GPU refusée faute de budget) est toujours reflétée par un job sérialisé complet (`id`, `status`, `error`) dans la réponse d'execute, affichée immédiatement par le frontend — sans faux succès ni polling sur un identifiant fantôme. Le polling s'arrête sur les erreurs permanentes.

## Requirements

### Requirement: Exécution retourne un job sérialisé complet
Le backend SHALL retourner le job complet (id, status, error, vast_instance_id…) dans la réponse de `POST /api/pipelines/{id}/execute`, y compris quand l'exécution échoue (ex. location GPU refusée).

#### Scenario: Échec de la location GPU
- **WHEN** le rent Vast échoue (crédit insuffisant, offre introuvable) et que le job passe en `error`
- **THEN** la réponse de execute contient `id` (UUID non vide), `status: "error"` et le message d'erreur français

#### Scenario: Exécution locale
- **WHEN** le pipeline s'exécute en mode local
- **THEN** la réponse de execute contient l'`id` du job et `status` (queued/dispatched)

### Requirement: Le frontend affiche l'erreur d'exécution immédiatement
Le frontend SHALL afficher l'erreur du job (message `job.error`) dans la console et passer en état d'échec sans lancer le polling, quand le job retourné par execute est déjà en `error` ou n'a pas d'`id` valide.

#### Scenario: Job en erreur dès le retour
- **WHEN** `executePipeline` retourne un job avec `status: "error"` (ex. location GPU refusée)
- **THEN** la console affiche « Exécution en erreur : {job.error} » et l'UI passe en état d'échec, sans polling

#### Scenario: Job sans identifiant
- **WHEN** `executePipeline` retourne un objet sans `id` valide
- **THEN** la console indique que le statut est indisponible et l'UI passe en état d'échec, sans polling

#### Scenario: Job en cours
- **WHEN** `executePipeline` retourne un job valide non terminé
- **THEN** le polling du job démarre normalement

### Requirement: Le polling s'arrête sur erreur permanente
Le polling de job (`pollJob`) SHALL s'arrêter sur une erreur HTTP 4xx (hors 429) — un job invalide ou inexistant ne se résoudra jamais — et SHALL continuer sur les erreurs réseau/5xx (reprise du backend) jusqu'à la limite existante.

#### Scenario: Job invalide (422)
- **WHEN** le polling reçoit une réponse 4xx (hors 429) pour le job
- **THEN** le polling s'arrête et un message de statut indisponible est affiché

#### Scenario: Backend en veille (5xx/réseau)
- **WHEN** le polling reçoit une erreur réseau ou 5xx (backend Render en réveil)
- **THEN** le polling continue jusqu'à la limite de tentatives existante
