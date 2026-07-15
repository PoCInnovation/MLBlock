## ADDED Requirements

### Requirement: Database structure
The database schema SHALL define tables for profiles, pipelines, jobs, and job outputs using SQLModel, mapped to PostgreSQL/Supabase.

#### Scenario: Pipeline table definition
- **WHEN** the database is initialized
- **THEN** the system SHALL create a `pipelines` table with `id` (UUID, primary key), `user_id` (UUID), `name` (text), `description` (text), `nodes` (JSONB), `edges` (JSONB), and `created_at` / `updated_at` (TIMESTAMPTZ)

#### Scenario: Job table definition
- **WHEN** the database is initialized
- **THEN** the system SHALL create a `jobs` table with `id` (UUID, primary key), `user_id` (UUID), `pipeline_id` (UUID), `status` (text: queued/running/done/error), `vast_instance_id` (text), `output` (text), `error` (text), and execution timestamps

#### Scenario: Job output table definition
- **WHEN** the database is initialized
- **THEN** the system SHALL create a `job_outputs` table with `id` (UUID, primary key), `job_id` (UUID), `block_name` (text), `output` (text), and `created_at` (TIMESTAMPTZ)
