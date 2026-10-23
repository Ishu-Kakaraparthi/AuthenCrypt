# AuthenCrypt — Secure Document Sharing with Access Control and Audit Logging

# AI Prompt Log
This file records how AI assistance was used while building AuthenCrypt. Entries describe the development work, observed issues, and verification status honestly.

## Entry 1 — 2026-10-20 — Project Setup and Upload

**Prompt / request:** Help me build a secure document-sharing application with a beginner-friendly Next.js implementation.

**AI output:** Guidance for project setup, upload API structure, file-type validation, file-size limits, and local file storage.

**What needed checking or correction:** The upload flow needed to be tested to confirm that file metadata was saved and that uploaded files were stored in the intended local directory.

**What I did:** Set up the Next.js project, implemented the upload flow, and tested that a file was saved and its metadata recorded successfully.

**Verification:** Local upload and metadata recording were observed.

**Commit:** Pending — add the actual commit hash after committing this work.

## Entry 2 — 2026-10-21 — Authentication

**Prompt / request:** Help implement registration, login, logout, and protected API endpoints.

**AI output:** Guidance for password hashing, session cookies, session validation, and authentication checks.

**What needed checking or correction:** Authentication needed to be verified through actual requests, including unauthenticated access attempts and duplicate registration.

**What I did:** Implemented and tested registration, login, session validation, logout, and authentication checks on protected endpoints.

**Verification:** Registration, duplicate-email rejection, login, session checks, and unauthenticated API rejection were observed locally.

**Commit:** Pending — add the actual commit hash after committing this work.

## Entry 3 — 2026-10-21 — Document Ownership and Isolation

**Prompt / request:** Help ensure users can access only documents they own or are authorized to access.

**AI output:** Guidance for associating documents with owners and checking ownership in document APIs.

**What needed checking or correction:** It was necessary to test with separate accounts rather than assume that authentication alone provided document isolation.

**What I did:** Tested document listing with two accounts and checked that one account did not see the other account's unshared documents.

**Verification:** Cross-account document listing isolation was observed locally. All permission combinations still require systematic testing.

**Commit:** Pending — add the actual commit hash after committing this work.

## Entry 4 — 2026-10-22 — Audit Logging and Downloads

**Prompt / request:** Help record document access activity and protect download endpoints.

**AI output:** Guidance for audit records and authenticated download handling.

**What needed checking or correction:** The download route needed testing both with an authenticated session and without one.

**What I did:** Tested an authenticated download and an unauthenticated download request.

**Verification:** An authenticated download succeeded, and an unauthenticated request was rejected. Complete audit coverage and denied-access logging require further verification.

**Commit:** Pending — add the actual commit hash after committing this work.

## Entry 5 — 2026-10-22 — Git Safety and Repository Preparation

**Prompt / request:** Help prepare the project for version control without committing secrets, local database files, or private uploads.

**AI output:** Guidance for Git identity configuration, staging review, and `.gitignore` rules.

**What needed checking or correction:** A Git author identity error occurred, and local test and backup files needed to remain outside the staged project files.

**What I did:** Configured Git name and email, checked the staging status, and verified ignore rules for `.env`, `dev.db`, `private_uploads`, `download-test.txt`, and `prisma/schema.backup.prisma`.

**Verification:** `git check-ignore -v` confirmed that the listed paths are ignored. No commit has been created yet.

**Commit:** Pending — add the actual commit hash after committing this work.

## Notes

- This log records work and tests observed so far; it does not claim that every security requirement is complete.
- Update this file as development continues.
- Replace pending commit references with real commit hashes when commits are created.
- Add further entries for permission changes, authorization tests, deployment, and any bugs or corrections encountered.
