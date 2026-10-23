# AuthenCrypt API Documentation

## Overview

AuthenCrypt provides API endpoints for authentication, document management, downloads, permission management, and audit logging.

All protected endpoints must enforce authentication and authorization on the server.

## Authentication APIs

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/register` | Public | Register a user |
| POST | `/api/login` | Public | Authenticate a user |
| GET | `/api/session` | Authenticated user | Check the current session |
| POST | `/api/logout` | Authenticated user | End the current session |

## Document APIs

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/upload` | Authenticated user | Upload a document |
| GET | `/api/documents` | Authenticated user | List documents the user may access |
| GET | `/api/download?id={documentId}` | Authenticated user with document access | Download an authorized document |

## Permission API

| Endpoint | Purpose | Verification status |
|---|---|---|
| `/api/permissions` | Grant or revoke document permissions | Check `app/api/permissions/route.ts` for supported methods, request fields, and authorization rules |

Do not assume a permission change is secure until owner authorization and invalid requests have been tested.

## Audit API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/audit` | Administrator, subject to server-side role checks | View audit records |

## Security Requirements

- Protected endpoints must reject unauthenticated requests.
- Document operations must verify ownership or explicit permission.
- Permission changes must be authorized on the server.
- Download requests must check current access rights.
- Relevant successful and denied actions should be recorded in audit logs.
- Never expose session secrets, password hashes, or private uploaded files through API responses.

## Verification Status

Local testing has confirmed registration, login, session checks, rejection of unauthenticated requests, basic document-list isolation, and an authenticated download.

Complete permission enforcement, revocation behavior, denied-access audit coverage, and automated authorization tests still require verification.

## Important Note

This is a preliminary API reference. Confirm each endpoint's actual implementation before treating this document as final assessment documentation.
