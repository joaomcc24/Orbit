# Orbit Decisions

## 2026-07-08 - Use native UUIDs and workspace role enum

We store primary keys and foreign keys as native PostgreSQL UUID columns with @db.Uuid, while Prisma still exposes them as TypeScript strings. This gives the database a stricter type than plain text and prevents invalid UUID-shaped values from being stored.

Workspace membership roles use a Prisma enum named WorkspaceRole instead of a free-form string. This makes invalid roles such as owner, ADMINN, or arbitrary text impossible at the schema level.

When Prisma generated the migration, it chose to drop and recreate the changed columns. That is acceptable for this empty Phase 0 local database, but it would be risky with real data. In production-like migrations, inspect the SQL and prefer safe casts such as ALTER COLUMN id TYPE UUID USING id::uuid when converting valid text UUIDs to native UUID columns.

## 2026-07-13 - Workspace API as the tenant and IAM foundation

Orbit is now being treated as both a production SaaS project and a cloud analyst learning path. The first API boundary after health checks is the workspace boundary because it maps directly to cloud account/project/subscription concepts.

A workspace is the tenant, a user is an identity, and `WorkspaceMember.role` is the local version of IAM-style access control. We are intentionally creating the workspace and owner membership before implementing full login so the authorization model has a concrete resource boundary to protect.

## 2026-08-02 - Isolate PostgreSQL integration tests from development

Workspace service unit tests continue to mock Prisma because they should be fast, deterministic, and able to exercise error paths without infrastructure. A separate API integration suite now starts the complete Nest application and uses Supertest, the real Prisma PostgreSQL adapter, and the real migration history.

The integration database runs in its own Docker Compose project as `orbit_test` on host port `5434`; development remains `orbit` on `5433`. Its PostgreSQL data directory is a `tmpfs`, and the runner always tears the Compose project down after the suite. This makes test data ephemeral and prevents automated cleanup from touching development data.

The workspace list endpoint is membership-scoped rather than a global tenant listing. Until authentication exists, it accepts `memberEmail` as a temporary lookup input; this is not an identity guarantee and must be replaced by the authenticated request principal before production.

The first integration test verifies API creation, membership-scoped listing, and one identity holding memberships in multiple workspaces. The second proves PostgreSQL rejects duplicate membership rows for the same user-workspace pair. The third verifies PostgreSQL's unique slug constraint, Orbit's `409 Conflict` translation, and transaction rollback by proving that the second owner is not persisted after the workspace insert fails.

## 2026-08-07 - Persist monitor configuration before scheduling

The first monitor vertical slice is HTTP-only and stores configuration rather than pretending that checks are already running. A monitor has a name, an HTTP or HTTPS target URL, one of the supported intervals (30, 60, or 300 seconds), a workspace owner, timestamps, and the initial `PENDING` status. No scheduler, check history, synthetic result, or status transition is part of this slice.

Monitor routes reuse `WorkspaceAccessService`, the same membership boundary now used by workspace detail. Both an unknown workspace and a workspace the supplied `memberEmail` cannot access return `404 Not Found`, so callers cannot use the API to discover another tenant's workspace. The query parameter remains temporary and does not prove identity.

The API validates the allowed intervals and HTTP URL scheme before writing. The reviewed PostgreSQL migration also adds a check constraint for the three interval values, because data may eventually be written by paths other than this Nest service. Monitor rows use a workspace foreign key and index; no join table is needed because each monitor belongs to exactly one workspace.

Unit tests isolate validation and service behavior with mocks. PostgreSQL integration tests exercise the Nest HTTP routes, real Prisma queries, full migration history, monitor persistence, `PENDING` defaults, and non-member read/create denial against the ephemeral `orbit_test` database.

## 2026-08-07 - Replace email impersonation with signed user identity

The temporary `memberEmail` query mechanism is removed. Registration stores a salted `scrypt` password hash, and login issues a signed JWT access token that expires after 15 minutes. Passport extracts and verifies the bearer token; `JwtStrategy` then loads the current user from PostgreSQL so a valid token for a deleted or changed identity is not accepted blindly.

JWT claims identify the user, not a selected workspace. A person may belong to several workspaces, so the workspace slug remains in the route and `WorkspaceAccessService` checks the authenticated user UUID against `WorkspaceMember`. Missing and unauthorized workspaces both return `404 Not Found` to avoid tenant discovery. Workspace creation also uses the authenticated user UUID and no longer accepts owner identity fields from the request body.

Passwords use Node's built-in `scrypt` with a random 16-byte salt, a 64-byte derived key, and constant-time comparison. The encoded record includes its algorithm and cost parameters so a later password migration can identify old hashes. `passwordHash` is nullable only as a migration bridge for users already present in the development database; legacy rows without a hash cannot log in.

The browser keeps the short-lived access token in React memory rather than local storage. This reduces token exposure to persistent browser storage, but it means a reload requires login until the planned seven-day, Redis-tracked refresh token is delivered through an httpOnly cookie. Email verification, refresh rotation, rate limiting, and server-side logout/revocation remain explicit follow-up authentication slices.
