## ADDED Requirements

### Requirement: Forms use React Hook Form with Zod resolver

Login and register forms SHALL use `useForm` with `zodResolver` and the existing Zod schemas.

#### Scenario: Form initialized with schema
- **WHEN** the login form loads
- **THEN** it uses `useForm` with `zodResolver(loginSchema)`
- **AND** default values are empty email and password

#### Scenario: Register uses registerSchema
- **WHEN** the register form loads
- **THEN** it uses `useForm` with `zodResolver(registerSchema)`
- **AND** includes email, password, and confirm

### Requirement: Forms submit natively

Forms SHALL use `<form onSubmit>` so Enter submits.

#### Scenario: Enter submits login
- **WHEN** user presses Enter in the password field
- **THEN** the login form submits

#### Scenario: Invalid data prevents submit
- **WHEN** user submits invalid data
- **THEN** Zod errors are shown next to fields
- **AND** the submit handler is not called

### Requirement: Errors shown near each field

Validation errors SHALL appear next to the corresponding field with `aria-invalid` on the input.

#### Scenario: Email error near email field
- **WHEN** user submits an invalid email
- **THEN** the email input has `aria-invalid="true"`
- **AND** an error message is displayed below the email field

#### Scenario: Confirm mismatch error near confirm field
- **WHEN** password and confirm differ on register
- **THEN** the confirm input has `aria-invalid="true"`
- **AND** "Les mots de passe ne correspondent pas" is shown below it

### Requirement: Inputs have visible labels

Form inputs SHALL have `<label>` elements linked via `htmlFor`/`id`.

#### Scenario: Label linked to email input
- **WHEN** the login form renders
- **THEN** the email input has a `<label htmlFor="login-email">`
- **AND** the input has `id="login-email"`

### Requirement: Browser validation disabled

Forms SHALL use `noValidate` to let Zod handle validation.

#### Scenario: Zod controls validation
- **WHEN** a form submits
- **THEN** browser native validation is disabled
- **AND** Zod messages are the ones shown
