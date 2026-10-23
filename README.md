# AuthenCrypt — Secure Document Sharing

AuthenCrypt is a document-sharing web application designed to protect private files through user authentication, document ownership, access permissions, and audit logging.

## Features

- User registration and login
- Session-based authentication
- Document uploads with file-type and size validation
- Document listing with ownership-based access
- Protected document downloads
- Document permission management
- Audit logging for document activity
- Admin-restricted audit API

**Note:** Some features and security scenarios still require further testing. The project is not yet fully security-verified for production use.

## Technology Stack

- Next.js
- React
- TypeScript
- Prisma ORM
- SQLite for local development
- JSON Web Tokens (JWT)
- bcryptjs for password hashing

## Prerequisites

- Node.js and npm
- Git

## Getting Started

### 1. Clone the repository

After the repository is pushed and its visibility is confirmed, replace `https://github.com/Ishu-Kakaraparthi/AuthenCrypt` with the actual repository URL.

```bash
git clone YOUR_REPOSITORY_URL
cd authencrypt
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. Configure the environment variables required by the application, including `SESSION_SECRET` and the database configuration.

Use the exact variable names and formats referenced in the project code and `prisma.config.ts`. Never commit `.env` files or real secrets.

### 4. Set up the database

```bash
npx prisma migrate deploy
npx prisma generate
```

Ensure the configured database location is writable and matches the Prisma configuration.

### 5. Run the application

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Security Notes

- Enforce authentication and authorization on the server for every protected endpoint.
- Users should access only documents they own or have explicit permission to access.
- Keep uploaded files in private storage; do not expose the upload directory publicly.
- Record relevant document and permission activity in the audit log.
- Review session-cookie settings, environment variables, database persistence, and file storage before production deployment.

## Testing Status

Local tests have been performed for registration, login, session validation, unauthenticated API rejection, document listing isolation, and authenticated downloads.

The automated tests currently cover unauthenticated document and audit API access. Comprehensive automated tests for permission enforcement, revocation, denied-access auditing, and other cross-user access scenarios remain to be completed.

## Limitations

The current implementation uses SQLite and local file storage for development. Production deployment requires suitable persistent database and file storage services. Deployment readiness and all security requirements have not yet been fully verified.

## Documentation

- `PROMPTS.md` — AI assistance and development log
- `THREATS.md` — security threats, mitigations, and remaining work
- `API_DOCS.md` — API endpoint documentation
