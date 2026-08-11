# Orbit

## Testing

Run the fast unit tests, which isolate service logic with mocked dependencies:

```bash
pnpm test
```

Run the API integration tests against an isolated PostgreSQL database:

```bash
pnpm test:integration
```

No test environment file or manually exported variable is required. The runner
sets these values for the migration and Jest processes:

```text
NODE_ENV=test
DATABASE_URL=postgresql://orbit_test:orbit_test@127.0.0.1:5434/orbit_test?schema=public
JWT_ACCESS_SECRET=orbit-integration-access-secret-at-least-32-characters
MONITOR_ALLOW_PRIVATE_TARGETS=true
MONITOR_CHECK_TIMEOUT_MS=1000
```

The Compose service separately defines `POSTGRES_USER=orbit_test`,
`POSTGRES_PASSWORD=orbit_test`, and `POSTGRES_DB=orbit_test`. These are local,
ephemeral test credentials, not production secrets.

The integration command requires Docker. It starts the PostgreSQL service from
`docker-compose.integration.yml` on port `5434`, applies the real Prisma
migrations, runs the HTTP tests, and removes the container and temporary data.
It never uses Orbit's development database on port `5433`.

## Continuous Integration

GitHub Actions runs `.github/workflows/ci.yml` for every pull request and every
push to `main`. Four independent jobs provide separate, parallel feedback:

- `Static analysis` runs lint, TypeScript checks, and Prisma schema validation.
- `Unit tests` runs the fast Jest suites with mocked dependencies.
- `Production builds` compiles the Nest API and Next.js web application.
- `PostgreSQL integration tests` starts the disposable Compose database,
  applies every migration, and runs the API integration suites.

Each job starts on a fresh GitHub-hosted Ubuntu runner, installs the frozen pnpm
lockfile, and explicitly generates Prisma Client before using API types. The
workflow grants its GitHub token read-only repository access and cancels an
older run when a newer commit supersedes it on the same branch.

The same commands can be run locally before pushing:

```bash
pnpm lint
pnpm typecheck
pnpm prisma:validate
pnpm test
pnpm build
pnpm test:integration
```

## Authentication

Register or log in to receive a signed, 15-minute access token:

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Orbit Owner",
  "email": "owner@example.com",
  "password": "a-long-development-password"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "a-long-development-password"
}
```

Passwords must contain between 12 and 128 characters. Orbit stores a salted
`scrypt` hash, never the original password. Protected requests send the access
token as a bearer token:

```http
Authorization: Bearer <accessToken>
```

`GET /api/auth/me` verifies the token and returns its current user. The web app
keeps the access token in memory. Refresh tokens, persistent sessions, email
verification, and server-side logout/revocation are not implemented yet.

## Monitor API

The first monitor slice stores HTTP monitor configuration for a workspace. The
authenticated user must be a member of the workspace identified by `slug`.

Create a monitor:

```http
POST /api/workspaces/orbit-cloud-lab/monitors
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Orbit API",
  "targetUrl": "https://api.example.com/health",
  "interval": 60
}
```

List the workspace's monitors:

```http
GET /api/workspaces/orbit-cloud-lab/monitors
Authorization: Bearer <accessToken>
```

`interval` must be `30`, `60`, or `300` seconds, and `targetUrl` must use HTTP
or HTTPS. The API assigns the workspace, timestamps, and the initial `PENDING`
status.

Workspace detail is protected by the same authenticated membership mechanism:

```http
GET /api/workspaces/orbit-cloud-lab
Authorization: Bearer <accessToken>
```

## Manual monitor checks

Run one real check for a configured monitor:

```http
POST /api/workspaces/orbit-cloud-lab/monitors/<monitorId>/checks
Authorization: Bearer <accessToken>
```

List its newest check results, with a default limit of 20 and a maximum of 100:

```http
GET /api/workspaces/orbit-cloud-lab/monitors/<monitorId>/checks?limit=20
Authorization: Bearer <accessToken>
```

Checks use `GET`, follow at most five redirects, and apply one total timeout
across DNS resolution, redirects, and the final response. A final HTTP status
from 200 through 399 is `UP`; other completed or expected network outcomes are
`DOWN` with a structured failure reason. Orbit measures time to final response
headers and never stores response bodies.

Every hostname and redirect is resolved and pinned before connection. By
default, loopback, private, link-local, metadata, and other non-public address
ranges are blocked to prevent SSRF. Local development may explicitly set:

```text
MONITOR_ALLOW_PRIVATE_TARGETS=true
MONITOR_CHECK_TIMEOUT_MS=10000
```

Private targets cannot be enabled when `NODE_ENV=production`. Automatic
scheduling, retries, and distributed workers remain deliberately out of scope;
the API executes a check only when the authenticated manual endpoint is called.
