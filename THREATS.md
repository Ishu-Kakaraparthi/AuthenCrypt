# AuthenCrypt — Security Threat Model

## Project Overview
AuthenCrypt is a secure document-sharing application designed to restrict document access to authorized users and maintain an audit trail of document activity.

## Assets to Protect
- Uploaded documents and their contents
- User accounts and password hashes
- Authentication session cookies
- Document ownership and access permissions
- Audit logs and document metadata
- Environment variables and database credentials

## Threats and Mitigations

### 1. Unauthorized Document Access
**Threat:** A user attempts to access another user's private document.

**Mitigation:** Verify authentication and document ownership or explicit permission on the server for every document request.

**Verification status:** Basic cross-user document-list isolation was tested. All access routes require further systematic testing.

### 2. Stolen or Reused Sessions
**Threat:** An attacker uses a stolen session cookie to access protected resources.

**Mitigation:** Use secure cookie settings, validate sessions on the server, and provide logout functionality.

**Verification status:** Login, session validation, logout, and unauthenticated API rejection were tested locally. Production cookie settings require review.

### 3. Unauthorized Downloads
**Threat:** A user attempts to download a document without permission.

**Mitigation:** Check authentication and document access rights in the download API before returning file contents.

**Verification status:** Authenticated and unauthenticated download requests were tested. Shared-access and revoked-access scenarios need further testing.

### 4. Malicious or Oversized Uploads
**Threat:** An attacker uploads an unsupported file type or an excessively large file.

**Mitigation:** Validate permitted file types and enforce a file-size limit on the server.

**Verification status:** The upload API includes file-type and size checks. Additional security testing is required.

### 5. Unauthorized Permission Changes
**Threat:** A user attempts to grant, modify, or revoke access to a document they do not own.

**Mitigation:** Enforce owner authorization on the server for every permission change and validate the requested permission level.

**Verification status:** The permissions API exists. Negative tests for unauthorized grants, edits, and revocations are still required.

### 6. Audit Log Gaps or Tampering
**Threat:** Important document activity is not recorded, or audit records are modified or deleted.

**Mitigation:** Record relevant actions on the server and restrict audit-log access to authorized administrators.

**Verification status:** Basic audit logging and an admin-only audit API exist. Complete event coverage and tamper resistance have not yet been established.

### 7. Secret or Private File Exposure
**Threat:** Environment secrets, local database files, or uploaded documents are accidentally committed to version control.

**Mitigation:** Exclude `.env`, database files, and the private upload directory through `.gitignore`; review staged files before committing.

**Verification status:** Git ignore rules were checked locally. Review every commit before pushing.

## Remaining Security Work
- Test access isolation across all API endpoints.
- Test READ and EDIT permissions independently.
- Confirm that revoking access immediately blocks subsequent requests.
- Verify that denied access attempts are audited.
- Add automated authorization and cross-user isolation tests.
- Review deployment storage, database, and cookie security before production use.

## Limitations
This document describes identified threats and planned or partially verified mitigations. It is not a claim that AuthenCrypt has passed a complete security audit.