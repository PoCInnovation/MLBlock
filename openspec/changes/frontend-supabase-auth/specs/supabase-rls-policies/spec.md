## ADDED Requirements

### Requirement: RLS policy on profiles table

The `profiles` table SHALL have RLS policies allowing users to read and update their own profile.

#### Scenario: User reads own profile
- **WHEN** an authenticated user selects from `profiles`
- **AND** `auth.uid() = id`
- **THEN** the row is returned

#### Scenario: User cannot read other profiles
- **WHEN** an authenticated user selects from `profiles`
- **AND** `auth.uid() != id`
- **THEN** no rows are returned

### Requirement: RLS policy on pipelines table

The `pipelines` table SHALL have RLS policies for SELECT, INSERT, UPDATE, DELETE filtered by `user_id = auth.uid()`.

#### Scenario: User creates pipeline
- **WHEN** an authenticated user inserts into `pipelines`
- **AND** sets `user_id = auth.uid()`
- **THEN** the insert succeeds

#### Scenario: User cannot see other users' pipelines
- **WHEN** an authenticated user selects from `pipelines`
- **THEN** only rows where `user_id = auth.uid()` are returned

### Requirement: RLS policy on jobs table

The `jobs` table SHALL have a SELECT policy filtered by `user_id = auth.uid()`.

#### Scenario: User sees own jobs
- **WHEN** an authenticated user selects from `jobs`
- **THEN** only rows where `user_id = auth.uid()` are returned

### Requirement: RLS policy on job_outputs table

The `job_outputs` table SHALL have a SELECT policy using a subquery on jobs.

#### Scenario: User sees own job outputs
- **WHEN** an authenticated user selects from `job_outputs`
- **THEN** only rows where `job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid())` are returned

### Requirement: Trigger creates profile on signup

The system SHALL create a `profiles` row when a new user signs up via Supabase Auth.

#### Scenario: Profile created on signup
- **WHEN** a new user registers via Supabase Auth
- **THEN** a row is inserted into `profiles` with `id = NEW.id`
- **AND** `display_name` is set to the user's email
- **AND** `avatar_url` is set to empty string
