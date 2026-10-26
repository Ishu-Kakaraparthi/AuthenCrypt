# AuthenCrypt — Secure Document Sharing

AuthenCrypt is a secure document-sharing web application built to help users upload, manage, and share documents while enforcing authentication, ownership checks, access permissions, and audit logging.

The project focuses on a core security principle: **users should access only the documents and actions they are authorized to use.**

## Features

### Authentication and Sessions
- User registration and login
- Password hashing with `bcryptjs`
- JWT-based session validation
- Protected dashboard access
- Logout and session-cookie handling
- Authentication checks on protected API routes

### Document Management
- Document uploads with file-type and file-size validation
- Document metadata stored in the database
- Document listing with ownership-based filtering
- Protected document downloads
- Document permission and sharing workflows
- Document management through the application dashboard

### Security and Auditing
- Server-side authentication and authorization checks
- Ownership checks for document access
- Admin-restricted audit API
- Audit records for document-related activity, including downloads
- Separation of user-facing document access and administrator audit access

### Application Interface
- Authenticated dashboard
- Login and registration interfaces
- Document management interface
- Access Control, Audit Trail, and Settings sections
- Evaluator welcome page at `/evaluator`

> **Security status:** These features have been implemented to varying degrees, but implementation alone does not prove that every security scenario is safe. Comprehensive security testing is still required before production use.

## Technology Stack

- **Framework:** Next.js
- **UI:** React and TypeScript
- **Styling:** Tailwind CSS
- **ORM:** Prisma
- **Authentication:** JWT using `jose`
- **Password hashing:** `bcryptjs`
- **Database:** SQLite for local development; Turso is used for the deployed database configuration
- **File storage:** Local private storage during development; Supabase private storage is part of the deployment configuration
- **Deployment:** Netlify
- **Version control:** Git and GitHub

The exact environment variables and storage configuration may differ between local development and deployment. Refer to the project configuration and deployment environment settings.

## Project Structure

Important application areas include:

- `app/page.tsx` — main dashboard
- `app/login/page.tsx` — login interface
- `app/evaluator/page.tsx` — evaluator welcome page
- `app/api/register/route.ts` — user registration
- `app/api/login/route.ts` — login
- `app/api/session/route.ts` — session validation
- `app/api/logout/route.ts` — logout
- `app/api/upload/route.ts` — document upload
- `app/api/documents/route.ts` — document listing
- `app/api/download/route.ts` — protected document download
- `app/api/audit/route.ts` — audit API with administrator access restrictions
- `prisma/schema.prisma` — Prisma data models

Some routes or filenames may vary as the project evolves.

## Prerequisites

- Node.js and npm
- Git
- Access to the required database and storage services for the selected environment

## Getting Started — Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Ishu-Kakaraparthi/AuthenCrypt.git
cd authencrypt
```

If the cloned repository directory has a different name, change into that directory instead.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

Configure all environment variables required by the application, including:

- `SESSION_SECRET`
- Database connection settings
- Any storage credentials and configuration required by the selected storage implementation

Use the exact variable names and formats referenced in the source code, `prisma.config.ts`, and storage configuration.

**Never commit `.env` files, passwords, JWT secrets, database credentials, or private storage keys to GitHub.**

### 4. Set up the database

For a fresh local database using the project's SQLite migration setup, run:

```bash
npx prisma migrate deploy
npx prisma generate
```

Make sure the database URL points to the intended database. Local SQLite setup and the deployed Turso database may require different configuration.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The project has a deployed application at netlify app:

The deployed environment must have the correct database connection, session secret, and private storage configuration. Configure these values through the deployment platform's environment settings rather than committing them to the repository.

After deployment, verify that:

- Registration and login work against the production database.
- Session validation and logout work correctly.
- Uploads persist as expected.
- Users cannot access documents belonging to other users without permission.
- Download and sharing permissions are enforced server-side.
- Administrator-only routes reject non-administrator accounts.
- Private files are not exposed through public URLs or static directories.

A successful deployment does not by itself confirm that all security requirements have been satisfied.

## Security Considerations

AuthenCrypt is designed around the following security requirements:

1. **Authentication:** Protected APIs must reject unauthenticated requests.
2. **Authorization:** Every sensitive operation must verify the current user's permission.
3. **Document isolation:** Users must not be able to read, download, modify, share, or delete documents belonging to other users unless explicitly authorized.
4. **Private storage:** Uploaded documents should remain private and be served only after server-side authorization.
5. **Session security:** Session secrets must remain confidential, and cookies must use appropriate security settings.
6. **Auditability:** Relevant access, sharing, permission changes, and denied operations should be logged where required.
7. **Administrator access:** Audit information must be available only to authorized administrator accounts.
8. **Input validation:** File types, file sizes, identifiers, and request data must be validated on the server.

Audit records should avoid unnecessarily storing passwords, session tokens, or document contents.

## Testing Status

The following areas have been tested during development:

- User registration
- Duplicate-registration rejection
- Login and session validation
- Logout
- Rejection of unauthenticated protected API requests
- Document upload and metadata recording
- Authenticated document downloads
- Document listing and ownership-related checks
- Audit record creation for document activity

The extent of testing varies by feature. These checks do not establish that all attack scenarios have been covered.

### Remaining Security Tests

Further testing is needed for:

- Cross-user access attempts against every document API
- Sharing permissions and access revocation
- Unauthorized document modification or deletion
- Expired, invalid, or tampered session tokens
- Administrator role enforcement in the deployed environment
- Audit logging for denied access and permission changes
- Private storage access and file URL exposure
- Production database and file-storage persistence
- Automated tests for security-sensitive API routes

## Known Limitations

- Local development and production use different infrastructure configurations.
- Security behavior must be verified for every sensitive API route.
- Audit logging coverage and completeness require further validation.
- Permission revocation and cross-user isolation require comprehensive testing.
- Production readiness has not been fully security-verified.

## Documentation

- `PROMPTS.md` — AI assistance and development log
- `THREATS.md` — identified threats, mitigations, and remaining risks
- `API_DOCS.md` — API endpoint documentation

## Project Goal

AuthenCrypt aims to demonstrate how secure document-sharing workflows can combine authentication, ownership-based authorization, private file storage, permission management, and auditability.

The goal is not merely to upload and download files, but to build a system in which access decisions are enforced on the server and security-relevant activity can be investigated.
