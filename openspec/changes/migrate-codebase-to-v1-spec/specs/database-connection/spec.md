## ADDED Requirements

### Requirement: Database Connection Configuration
The system SHALL connect to the hosted Supabase PostgreSQL instance using a connection string loaded from the `DATABASE_URL` environment variable.

#### Scenario: Valid Database Connection String
- **WHEN** the system reads `DATABASE_URL`
- **THEN** it SHALL use a string matching the pattern `postgresql://postgres:airbaG42%3F133@db.hrvbsbkcbtgephuntgqd.supabase.co:5432/postgres` (where the password `airbaG42?133` has its `?` character percent-encoded as `%3F`)

### Requirement: Load Environment Variables
The application SHALL load the database credentials from a `.env` file during startup.

#### Scenario: Parse Environment Variables
- **WHEN** the application starts
- **THEN** the system SHALL load configuration from the local `.env` file using the `python-dotenv` library and read `DATABASE_URL`

### Requirement: Developer Tooling Setup
The project setup instructions SHALL document the option to install the Supabase agent skills for AI-assisted operations.

#### Scenario: Install Agent Skills
- **WHEN** a developer runs the setup command
- **THEN** the developer SHALL execute `npx skills add supabase/agent-skills`
