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
DATABASE_URL=postgresql://orbit_test:orbit_test@127.0.0.1:<assigned-port>/orbit_test?schema=public
JWT_ACCESS_SECRET=orbit-integration-access-secret-at-least-32-characters
MONITOR_ALLOW_PRIVATE_TARGETS=true
MONITOR_CHECK_TIMEOUT_MS=1000
```

The Compose service separately defines `POSTGRES_USER=orbit_test`,
`POSTGRES_PASSWORD=orbit_test`, and `POSTGRES_DB=orbit_test`. These are local,
ephemeral test credentials, not production secrets.

The integration command requires Docker. It gives each invocation a unique
Compose project and a Docker-assigned localhost port, starts PostgreSQL from
`docker-compose.integration.yml`, applies the real Prisma migrations, runs the
HTTP tests, and removes only that invocation's container and temporary data.
Parallel test runs therefore cannot share or tear down one another's database,
and the runner never uses Orbit's development database on port `5433`.

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
older run when a newer commit supersedes it on the same branch. Every external
action is pinned to an immutable commit SHA, with the readable release version in
a comment, so an upstream tag cannot silently change the code CI executes.
Dependabot checks those GitHub Actions pins weekly and proposes upgrades as
reviewable pull requests instead of changing executable CI dependencies silently.

The same commands can be run locally before pushing:

```bash
pnpm lint
pnpm typecheck
pnpm prisma:validate
pnpm test
pnpm build
pnpm test:integration
```

## Production-like containers

Build and start the application runtime locally:

```bash
docker compose -f docker-compose.runtime.yml up --build --wait
```

This stack is separate from the development and integration-test databases. It
starts four roles in dependency order:

1. `database` starts PostgreSQL and becomes healthy.
2. `migration` applies committed Prisma migrations once, then exits successfully.
3. `api` starts only after the migration job succeeds.
4. `web` starts only after the API health check succeeds.

The application is available at `http://localhost:3000`. The API exposes
dependency-free liveness at `http://localhost:3001/api/health/live` and
database-backed readiness at `http://localhost:3001/api/health/ready`.
`/api/health` remains a compatibility alias for readiness. The image's default
health check uses liveness, while this Compose stack overrides it with readiness
so the web service starts only after the API can use PostgreSQL.

The web server proxies browser API requests from `/api/orbit/*` to the API
container using the private Compose service name. `ORBIT_API_URL` is therefore
runtime configuration; a web image can move between environments without being
rebuilt for each API address.

Stop the stack while preserving its database volume:

```bash
docker compose -f docker-compose.runtime.yml down
```

To also delete this stack's local database data, add `--volumes`. The Compose
defaults for `ORBIT_POSTGRES_PASSWORD` and `JWT_ACCESS_SECRET` are development
conveniences only. A shared or hosted environment must inject strong values
through its secret manager.

The serving images run as a non-root user, drop Linux capabilities, prevent
privilege escalation, and expose only the web and API ports on the host's
loopback interface. PostgreSQL has no host port in this stack.

This is a cloud-ready container foundation, not a cloud deployment. A real
deployment still needs a container registry, a managed PostgreSQL service, a
hosting platform, managed secrets, public HTTPS ingress, infrastructure as
code, and a CD workflow. Those decisions should be made for one selected cloud
provider rather than simulated inside this Compose file.

## Container image pipeline

`.github/workflows/container-images.yml` gives the runtime images an automated
release path. Pull requests that change application or container inputs build
the `api`, `web`, and `migration` targets without publishing them. This proves
that a proposed change remains containerizable without giving pull-request code
registry write access.

After a merge to `main`, the workflow publishes these packages to GitHub
Container Registry:

```text
ghcr.io/joaomcc24/orbit-api
ghcr.io/joaomcc24/orbit-web
ghcr.io/joaomcc24/orbit-migration
```

Each image receives a full Git commit SHA tag. `main` also updates the
convenience tag `latest`; a tag such as `v1.2.3` additionally publishes `1.2.3`
and `1.2`. Deployments should pin the full SHA tag or image digest instead of
`latest`, so the exact artifact can be identified and rolled back.

Only the publication job receives `packages: write`, and it authenticates with
GitHub's short-lived workflow token rather than a stored registry password.
The published images include OCI source/revision labels, an SBOM, and build
provenance. The Docker build cache is separated by image target so one image
does not overwrite another image's cache.

This is the artifact-publication part of CD, not application deployment. The
next provider-specific workflow will promote an already-published digest into a
staging environment; it must not rebuild different bytes during deployment.
The provider-neutral requirements for that environment are defined in
[`docs/cloud-deployment-contract.md`](docs/cloud-deployment-contract.md).

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
