## ADDED Requirements

### Requirement: Supabase Storage bucket with RLS

The system SHALL create a public-read bucket for user file uploads.

#### Scenario: Bucket exists with correct RLS
- **WHEN** a user is authenticated
- **AND** uploads a file to `user-uploads/`
- **THEN** the insert succeeds
- **WHEN** any client (authenticated or not) reads from `user-uploads/`
- **THEN** the read succeeds
- **WHEN** the backend (service_role) deletes from `user-uploads/`
- **THEN** the delete succeeds

### Requirement: Frontend uploads CSV to Supabase Storage

The frontend SHALL allow users to upload a CSV file from their computer.

#### Scenario: File picker triggers upload
- **WHEN** user clicks on a file-type block param
- **AND** selects a `.csv` file
- **THEN** the file is uploaded to `user-uploads/{user_id}/{block_id}_{timestamp}.csv`
- **AND** the block param value is set to the public URL of the uploaded file

#### Scenario: Upload progress and error
- **WHEN** the upload is in progress
- **THEN** a loading indicator is shown
- **WHEN** the upload fails
- **THEN** an error message is displayed

### Requirement: Block param type `"file"`

The block registry SHALL support a `"file"` param type.

#### Scenario: File param in block definition
- **WHEN** a block has a param with `type: "file"`
- **THEN** the frontend renders a file picker instead of a text/number input
- **AND** the value stored is the Supabase Storage URL

### Requirement: Generated code reads CSV from public URL

The generated pipeline script SHALL use `pd.read_csv(url)` to load CSV files.

#### Scenario: URL param passed to load_csv
- **WHEN** a pipeline with a `load_csv` block is executed
- **AND** the CSV param is a Supabase Storage URL
- **THEN** the generated code calls `pd.read_csv(url)` directly

### Requirement: Backend cleans up files after job

The backend SHALL delete uploaded files from Supabase Storage when a job completes or errors.

#### Scenario: Files deleted on job done
- **WHEN** the GPU sends `POST /jobs/{id}/status` with `status: "done"`
- **THEN** the backend deletes all files referenced in the pipeline's block params from Supabase Storage

#### Scenario: Files deleted on job error
- **WHEN** the GPU sends `POST /jobs/{id}/error`
- **THEN** the backend deletes all files referenced in the pipeline's block params from Supabase Storage

#### Scenario: Files deleted on dev timeout
- **WHEN** the 60s dev timeout fires
- **THEN** the backend deletes all files referenced in the pipeline's block params from Supabase Storage
