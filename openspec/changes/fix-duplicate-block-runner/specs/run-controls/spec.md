## Purpose

Guarantees that the editor's run/stop/clear controls are driven by exactly one job-runner instance, eliminating duplicate job tracking and polling.

## ADDED Requirements

### Requirement: Single run-controls owner
The editor must instantiate exactly one run-controls hook, owned by the component that renders the run/stop/clear actions. No other component may instantiate the runner or receive run-control callbacks as props.

#### Scenario: Editor mounts
- **WHEN** the editor page mounts and renders the editor header
- **THEN** exactly one job-runner instance exists, and it lives in the header component

#### Scenario: Run triggered
- **WHEN** the user clicks Run and a job starts
- **THEN** exactly one job-tracking query polls the job status, and Stop/Clear act on that same job

#### Scenario: Run callback props
- **WHEN** any component other than the header is inspected for run-control props
- **THEN** it declares no such props and instantiates no runner

### Requirement: No regression of run behavior
Removing the duplicate instance must not change the observable run/stop/clear lifecycle.

#### Scenario: Run a pipeline
- **WHEN** the user runs a pipeline after the change
- **THEN** validation, build, execution, status polling, and console output behave identically to before

#### Scenario: Stop during run
- **WHEN** the user stops an active run
- **THEN** polling stops and the console shows "Arrêté" exactly once
