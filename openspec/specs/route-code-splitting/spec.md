# Route Code Splitting

## Purpose

The editor route loads asynchronously so reactflow-heavy code is only downloaded by users who actually open the editor.

## Requirements

### Requirement: Editor route lazy loading
The editor page must be loaded asynchronously on navigation rather than eagerly at app startup. While its module loads, a loading fallback must be shown.

#### Scenario: Navigate to editor
- **WHEN** the user navigates to `/editor`
- **THEN** the editor module is fetched on demand, a loading fallback is displayed while it loads, and the editor renders once loaded

#### Scenario: Visit landing page
- **WHEN** the user visits a non-editor route (home, login, about, how-it-works, projects)
- **THEN** the initial bundle served does not include the editor page module or reactflow

### Requirement: Editor behavior unchanged after lazy load
Lazy loading must not alter editor functionality, routing, or state restoration.

#### Scenario: Deep link with pipeline id
- **WHEN** the user opens `/editor?pipeline=<uuid>&view=grid` directly
- **THEN** the editor loads the pipeline and view exactly as before

#### Scenario: Unsaved changes guard
- **WHEN** the user attempts to leave the editor with unsaved changes
- **THEN** the navigation guard still intercepts and prompts, with the same stash/restore behavior
