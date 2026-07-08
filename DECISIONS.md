# Orbit Decisions

## 2026-07-08 - Use native UUIDs and workspace role enum

We store primary keys and foreign keys as native PostgreSQL UUID columns with @db.Uuid, while Prisma still exposes them as TypeScript strings. This gives the database a stricter type than plain text and prevents invalid UUID-shaped values from being stored.

Workspace membership roles use a Prisma enum named WorkspaceRole instead of a free-form string. This makes invalid roles such as owner, ADMINN, or arbitrary text impossible at the schema level.

When Prisma generated the migration, it chose to drop and recreate the changed columns. That is acceptable for this empty Phase 0 local database, but it would be risky with real data. In production-like migrations, inspect the SQL and prefer safe casts such as ALTER COLUMN id TYPE UUID USING id::uuid when converting valid text UUIDs to native UUID columns.
