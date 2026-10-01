# Spec Delta: Runtime & Codegen Reliability

## Purpose

Assure la validité syntaxique et l'exécution sans crash des scripts Python autonomes générés pour tous les pipelines du catalogue MLBlock.

## ADDED Requirements

### Requirement: Emplacement canonique des imports __future__
Le générateur de code doit obligatoirement émettre `from __future__ import annotations` en toute première instruction effective du script Python généré, et ne doit jamais insérer cette déclaration de manière redondante lors de l'assemblage des fonctions de blocs.

#### Scenario: Compilation des scripts d'exercices
- **WHEN** un pipeline complet (ex: A1 CIFAR-10 ou A4 Tabulaire) est converti en code Python via `generate_code`
- **THEN** le script généré doit être compilable par `compile(code, "<string>", "exec")` sans lever de `SyntaxError` liée aux imports `__future__`.

### Requirement: Conformité des symboles PyTorch dans les blocs
Tous les blocs du catalogue invoquant des opérations PyTorch doivent utiliser des symboles et des constructeurs existants dans l'API officielle de `torch.nn`.

#### Scenario: Instanciation et exécution des couches de pooling et séquences
- **WHEN** un nœud de type `avgpool2d`, `adaptive_avgpool2d`, `adaptive_maxpool2d`, `lstm`, `gru`, `rnn` ou `multihead_attention` est exécuté
- **THEN** la fonction du bloc ne doit lever aucune exception `AttributeError` sur le module `torch.nn`.

### Requirement: Respect de l'URL du backend pour les callbacks en mode local
Le runtime local d'exécution doit transmettre au script enfant l'adresse du backend configurée dans la variable d'environnement `BACKEND_URL` lorsqu'elle est définie.

#### Scenario: Lancement d'un job avec BACKEND_URL personnalisé
- **WHEN** la variable d'environnement `BACKEND_URL` est fournie au processus serveur
- **THEN** les notifications HTTP de statut et de logs du sous-processus local doivent cibler cette URL plutôt qu'une adresse codée en dur.
