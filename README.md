# AuthenCrypt — Secure Document Sharing

AuthenCrypt is a document-sharing web application designed to protect private files through user authentication, document ownership, access permissions, and audit logging.

## Features

- User registration and login
- Session-based authentication
- Document upload with file-type and size validation
- Document listing with ownership-based access
- Protected document downloads
- Document permission management
- Audit logging for document activity
- Admin-restricted audit API

*Note: Some features and security scenarios still require further testing.*

## Technology Stack

- Next.js
- React
- TypeScript
- Prisma ORM
- SQLite (local development database)
- JSON Web Tokens (JWT)
- bcryptjs for password hashing

## Prerequisites

Install the following before running the application:

- Node.js and npm
- Git

## Getting Started

### 1. Clone the repository

After the repository URL is confirmed and the project is pushed:

```bash
git clone YOUR_REPOSITORY_URL
cd authencrypt
```

Replace `https://github.com/Ishu-Kakaraparthi/AuthenCrypt` with the actual repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. Add the environment variables required by the application, including `SESSION_SECRET` and the database configuration.

Use the exact variable names and formats referenced by the project code and `prisma.config.ts`. Do not commit `.env` or real secrets to GitHub.

### 4. Set up the database

Apply the project's Prisma migrations using the configured database:

```bash
npx prisma migrate deploy
npx prisma generate
```

For a fresh local development database, follow the project's Prisma configuration and migration setup.

### 5. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security Notes

- Protected APIs must enforce authentication and authorization on the server.
- Users should only access documents they own or have explicit permission to access.
- Uploaded files should remain in private storage and should not be publicly served.
- Audit records should capture relevant document and permission activity.
- Review environment variables, database persistence, file storage, and cookie settings before production deployment.

## Testing Status

Local tests have been performed for registration, login, session validation, unauthenticated API rejection, document listing isolation, and authenticated downloads.

Comprehensive automated tests for permission enforcement, revocation, denied-access auditing, and all cross-user access scenarios remain to be completed.

## Limitations

The current implementation uses SQLite and local file storage for development. Production deployment requires a suitable persistent database and secure persistent file storage. Deployment readiness and all security requirements have not yet been fully verified.

## Documentation

- `PROMPTS.md` — AI assistance and development log
- `THREATS.md` — security threats, mitigations, and remaining work

