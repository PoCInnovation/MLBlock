# Projets

## Purpose

Les pipelines de l'utilisateur sont persistés comme projets nommés, listables et rouvrables, avec une limite de 20 projets par utilisateur, une cascade de suppression et un modèle de brouillon pour les runs non sauvegardés.

## ADDED Requirements

### Requirement: Page « Mes projets »
The system MUST expose a page listing the user's saved projects (non-draft pipelines) with their name and last modification date, and MUST provide actions to open, export, delete, and create a project from that page.

#### Scenario: Lister les projets
- **WHEN** l'utilisateur ouvre la page « Mes projets »
- **THEN** seuls les projets sauvegardés (non-brouillons) de l'utilisateur sont affichés, avec nom et date de modification

#### Scenario: Ouvrir un projet
- **WHEN** l'utilisateur clique « Ouvrir » sur une carte projet
- **THEN** le pipeline est chargé dans l'éditeur (canvas linéaire et avancé restaurés) et l'éditeur est affiché

#### Scenario: Supprimer un projet
- **WHEN** l'utilisateur confirme la suppression d'un projet
- **THEN** le projet et ses dépendances (jobs, job_outputs, fichiers CSV en storage) sont supprimés, et la liste est mise à jour

### Requirement: Limite de 20 projets par utilisateur
The system MUST limit each user to 20 saved projects. Creating beyond the limit MUST fail with a 409 and a user-facing message in French.

#### Scenario: Plafond atteint
- **WHEN** un utilisateur avec 20 projets sauvegardés tente d'en créer un nouveau
- **THEN** la création est rejetée avec une erreur 409 « Limite de 20 projets atteinte » et le bouton de création est désactivé côté UI

### Requirement: Brouillons invisibles pour les runs non sauvegardés
Running a pipeline without an open project MUST create an invisible draft (not listed in « Mes projets »). Saving MUST formalize the draft into a visible named project. The system MUST keep at most one draft per user.

#### Scenario: Run sans projet ouvert
- **WHEN** l'utilisateur lance un pipeline sans projet ouvert
- **THEN** un brouillon invisible est créé (1 seul par utilisateur, les plus anciens sont supprimés) et l'exécution se déroule normalement

#### Scenario: Sauvegarde formalise le projet
- **WHEN** l'utilisateur clique « Sauvegarder » sur un canvas avec brouillon actif
- **THEN** le brouillon devient un projet visible, nommé, et apparaît dans « Mes projets »

### Requirement: Suppression en cascade
Deleting a user account MUST cascade to their pipelines, jobs, and job outputs. Deleting a project MUST delete its jobs, job outputs, and stored CSV files.

#### Scenario: Suppression d'un compte utilisateur
- **WHEN** le compte d'un utilisateur est supprimé
- **THEN** tous ses pipelines, jobs et job_outputs sont supprimés en cascade
