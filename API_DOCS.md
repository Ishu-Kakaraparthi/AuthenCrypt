# AuthenCrypt API Documentation

## Overview

AuthenCrypt provides API endpoints for authentication, document management, downloads, permission management, and audit logs.

All protected endpoints must enforce authorization on the server.

## Authentication APIs

| Method |  Endpoint       | Access             | Purpose                   |
|---     |                 |     ---            |      ---                  |
| POST   | `/api/register` | Public             | Register a user   
| POST   | `/api/login`    | Public             | Authenticate a user       |
| GET    | `/api/session`  | Authenticated user | Check the current session |
| POST   | `/api/logout`   | Authenticated user | End the current session   |

## Document APIs

| Method | Endpoint                             | Access                                  | Purpose                           |
|     ---|--                                   -|---                                      |---                                |
| POST   | `/api/upload`                        | Authenticated user                      | Upload a document                 |
| GET    | `/api/documents`                     | Authenticated user                      | List documents the user may access|
| GET    | `/api/download?id={documentId}`      | Authenticated user with document access | Download an authorized document   |

## Permission API

| Method      |                   Endpoint | Access | Purpose |
|-      --|---|---|---|
`/api/permissions` | Check the implementation for supported methods | Document owner, subject to server-side checks | Grant or revoke document permissions |

The exact request methods, request fields, permission values, and response formats must be verified against `app/api/permissions/route.ts`.

## Audit API

| Method | Endpoint     | Access                                            | Purpose            |
|--     -|---           |---                                                |--                 -|
| GET    | `/api/audit` | Administrator, subject to server-side role checks | View audit records |

## Security Requirements

- Protected endpoints must reject unauthenticated requests.
- Document operations must verify ownership or an explicit permission.
- Permission changes must be authorized on the server.
- Download requests must check current access rights.
- Relevant successful and denied actions should be recorded in audit logs.
- Never expose session secrets, password hashes, or private uploaded files through API responses.

## Verification Status

Local testing has confirmed registration, login, session checks, rejection of unauthenticated requests, basic document-list isolation, and an authenticated download.

The complete HTTP methods, permission behavior, revocation behavior, denied-access audit coverage, and automated authorization tests still require verification.

## Important Note

This document is a preliminary API reference. Confirm every endpoint's actual implementation before using it as the final assessment documentation.