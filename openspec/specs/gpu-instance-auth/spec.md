# GPU Instance Auth

## Purpose

Les callbacks GPU → backend sont authentifiés par la clé d'instance Vast (`instance_api_key`, injectée dans le container comme `CONTAINER_API_KEY`) au lieu d'un secret partagé : chaque job n'accepte que les callbacks de sa propre instance, sans synchronisation de clé entre environnements. Le script généré détruit son instance en fin de run (filet anti-orpheline si le backend est injoignable).

## Requirements

### Requirement: Authentification des callbacks GPU par instance
Le backend SHALL authentifier les callbacks GPU (`POST /api/jobs/{id}/status|output|error` et `GET /api/jobs/{id}/instance`) avec le Bearer de l'instance du job (`job.instance_api_key`, stockée au create Vast). En l'absence de clé d'instance sur le job (jobs legacy, mode local), le Bearer est comparé au `GPU_API_KEY` global.

#### Scenario: Callback avec la clé de l'instance
- **WHEN** une instance GPU envoie un callback avec `Authorization: Bearer <instance_api_key>` et que `job.instance_api_key` == cette clé
- **THEN** le callback est accepté

#### Scenario: Callback avec une clé étrangère
- **WHEN** une instance GPU envoie un callback avec un Bearer différent de `job.instance_api_key` et du `GPU_API_KEY` global
- **THEN** le backend répond 403 et le callback est rejeté

#### Scenario: Job legacy sans clé d'instance
- **WHEN** un job a `instance_api_key` vide et un callback arrive avec `Authorization: Bearer <GPU_API_KEY global>`
- **THEN** le callback est accepté (repli sur la clé globale)

#### Scenario: Callback en mode local
- **WHEN** le pipeline s'exécute en subprocess local (pas de `CONTAINER_API_KEY` dans l'env)
- **THEN** le code généré utilise le `GPU_API_KEY` (mock par défaut) et le backend l'accepte

### Requirement: Le code généré utilise la clé du container
Le script généré par `generator.py` SHALL lire sa clé de callbacks dans `CONTAINER_API_KEY` (env injecté par Vast au boot de l'instance) avec repli sur `GPU_API_KEY`.

#### Scenario: Instance GPU
- **WHEN** le script s'exécute sur une instance Vast avec `CONTAINER_API_KEY` défini
- **THEN** les callbacks utilisent `Authorization: Bearer <CONTAINER_API_KEY>`

#### Scenario: Exécution locale
- **WHEN** le script s'exécute en subprocess local sans `CONTAINER_API_KEY`
- **THEN** les callbacks utilisent `Authorization: Bearer <GPU_API_KEY>`

### Requirement: Stockage de la clé d'instance sur le job
Le job SHALL stocker la clé d'instance retournée par le create Vast (`instance_api_key` de la réponse `PUT /api/v0/asks/{id}`).

#### Scenario: Location GPU réussie
- **WHEN** `launch_instance` réussit (réponse avec `instance_api_key`)
- **THEN** `job.instance_api_key` est remplie et `job.vast_instance_id` aussi

#### Scenario: Rent échoué
- **WHEN** le rent échoue (aucune offre, erreur API)
- **THEN** le job passe en `error` avec le message FR existant et aucune clé n'est stockée

### Requirement: Auto-destroy de l'instance en fin de run
Le script généré SHALL détruire son instance Vast à la fin du run (succès ou erreur), en présence de `CONTAINER_API_KEY`, via `DELETE /api/v0/instances/{id}` avec sa clé de container. L'id de l'instance est obtenu au boot via `GET /api/jobs/{id}/instance`.

#### Scenario: Run GPU réussi
- **WHEN** le pipeline termine sans erreur sur une instance Vast
- **THEN** le script détruit l'instance après le dernier callback (le backend a déjà reçu les sorties)

#### Scenario: Erreur pendant le run
- **WHEN** le pipeline lève une exception sur une instance Vast
- **THEN** le script notifie l'erreur puis détruit l'instance dans le `finally`

#### Scenario: Exécution locale
- **WHEN** le script s'exécute sans `CONTAINER_API_KEY`
- **THEN** aucune tentative de destroy n'est faite

### Requirement: Endpoint d'identité d'instance
Le backend SHALL exposer `GET /api/jobs/{id}/instance` (authentifié comme les callbacks) qui retourne `{"instance_id": job.vast_instance_id}`.

#### Scenario: Instance du job
- **WHEN** une instance authentifiée appelle `GET /api/jobs/{id}/instance`
- **THEN** le backend retourne `{"instance_id": <vast_instance_id du job>}`

#### Scenario: Job inexistant
- **WHEN** l'id du job n'existe pas
- **THEN** le backend répond 404
