# Sample Data Library

## Purpose

Le système met à disposition une bibliothèque de données d'entraînement d'exemple, pré-générées en français, stockées dans un bucket Supabase public. Un sélecteur à deux volets (« Utiliser nos données / Apporter vos données ») permet d'injecter un sample dans le champ fichier d'un bloc comme un upload classique — sans changement du moteur d'exécution.

## Requirements

### Requirement: Bibliothèque de données d'exemple préfaites
Le système SHALL fournir des jeux de données d'exemple pré-générés en français, stockés dans un bucket Supabase public `sample-data`, décrits par un manifest JSON (id, nom, description, catégorie, colonnes, taille, URL), couvrant les catégories tabulaire, séries, texte et image.

#### Scenario: Catalogue des samples
- **WHEN** un utilisateur ouvre le sélecteur de données d'un bloc
- **THEN** il voit la liste des samples de la catégorie du bloc (nom, description, colonnes, taille)

#### Scenario: Données en français
- **WHEN** un sample est utilisé
- **THEN** ses valeurs et noms de colonnes sont en français (données synthétiques)

### Requirement: Utilisation d'un sample dans un bloc
Un sample sélectionné SHALL être injecté comme une URL publique dans le champ fichier du bloc, utilisable de bout en bout comme un fichier uploadé (colonnes détectées, exécution, retrait).

#### Scenario: Clic sur un sample
- **WHEN** l'utilisateur clique « Utiliser » sur un sample
- **THEN** le champ du bloc reçoit l'URL publique du sample et les colonnes sont détectées

#### Scenario: Exécution
- **WHEN** le pipeline s'exécute avec un sample
- **THEN** le code généré lit l'URL publique (bucket public) comme un fichier uploadé

### Requirement: Sélecteur de données à deux volets
Le champ fichier d'un bloc SHALL ouvrir un modal « Données d'entraînement » avec « Utiliser nos données » (samples de la catégorie du bloc) et « Apporter vos données » (import de fichier existant).

#### Scenario: Ouverture du modal
- **WHEN** l'utilisateur clique sur le bouton de champ fichier
- **THEN** le modal s'ouvre avec les deux volets

#### Scenario: Import de fichier
- **WHEN** l'utilisateur choisit « Apporter vos données »
- **THEN** le flux d'upload existant s'exécute

### Requirement: Accept de fichiers adapté au bloc
Le champ fichier SHALL accepter les extensions adaptées au bloc : CSV pour tabulaire/séries/texte, images (png/jpg) pour le bloc image.

#### Scenario: Bloc image
- **WHEN** l'utilisateur importe un fichier dans `load_image`
- **THEN** le sélecteur accepte les images (png/jpg) et non uniquement les CSV

### Requirement: Bloc de chargement de textes
Le système SHALL fournir un bloc `load_text` qui lit un CSV de textes (colonne de texte + colonne de label optionnelle) et retourne un DataFrame, branchable sur tokenisation ou classification.

#### Scenario: Chargement d'un jeu de textes
- **WHEN** l'utilisateur branche `load_text` sur un pipeline texte
- **THEN** le CSV (phrases + label optionnel) est chargé comme DataFrame

#### Scenario: Sample texte
- **WHEN** l'utilisateur sélectionne un sample texte
- **THEN** le CSV de phrases françaises (ex. avis clients) est injecté dans `load_text`
