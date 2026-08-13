import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const apiDirectory = resolve(testDirectory, '..');
const repositoryDirectory = resolve(apiDirectory, '../..');
const composeFile = resolve(
  repositoryDirectory,
  'docker-compose.integration.yml',
);
const composeProject = `orbit-integration-tests-${process.pid}`;
const composeArgs = [
  'compose',
  '--project-name',
  composeProject,
  '-f',
  composeFile,
];

function run(command, args, options = {}) {
  const captureOutput = options.captureOutput ?? false;
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repositoryDirectory,
    env: options.env ?? process.env,
    encoding: captureOutput ? 'utf8' : undefined,
    stdio: captureOutput ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(
      `${command} ${args.join(' ')} exited with status ${result.status}`,
    );
  }

  return result;
}

function readPublishedPostgresPort() {
  const result = run(
    'docker',
    [...composeArgs, 'port', 'postgres', '5432'],
    { captureOutput: true },
  );
  const publishedAddress = result.stdout.trim();
  const portMatch = publishedAddress.match(/:(\d+)$/);

  if (!portMatch) {
    throw new Error(
      `Could not read the integration PostgreSQL port from ${publishedAddress}`,
    );
  }

  return portMatch[1];
}

let exitCode = 0;

try {
  run('docker', [
    ...composeArgs,
    'up',
    '--wait',
    '--wait-timeout',
    '60',
  ]);
  const postgresPort = readPublishedPostgresPort();
  const testEnvironment = {
    ...process.env,
    DATABASE_URL: `postgresql://orbit_test:orbit_test@127.0.0.1:${postgresPort}/orbit_test?schema=public`,
    JWT_ACCESS_SECRET: 'orbit-integration-access-secret-at-least-32-characters',
    MONITOR_ALLOW_PRIVATE_TARGETS: 'true',
    MONITOR_CHECK_TIMEOUT_MS: '1000',
    NODE_ENV: 'test',
  };

  console.log(
    `Integration PostgreSQL is ready for ${composeProject} on port ${postgresPort}`,
  );
  run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: apiDirectory,
    env: testEnvironment,
  });
  run(
    'pnpm',
    [
      'exec',
      'jest',
      '--config',
      'jest.integration.config.cjs',
      '--runInBand',
    ],
    {
      cwd: apiDirectory,
      env: testEnvironment,
    },
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  exitCode = 1;
} finally {
  const teardownStatus = run(
    'docker',
    [...composeArgs, 'down', '--volumes'],
    { allowFailure: true },
  );

  if (teardownStatus.status !== 0) {
    exitCode = 1;
  }
}

process.exitCode = exitCode;
