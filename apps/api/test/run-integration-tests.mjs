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
const databaseUrl =
  'postgresql://orbit_test:orbit_test@127.0.0.1:5434/orbit_test?schema=public';
const testEnvironment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  JWT_ACCESS_SECRET: 'orbit-integration-access-secret-at-least-32-characters',
  NODE_ENV: 'test',
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repositoryDirectory,
    env: options.env ?? process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(
      `${command} ${args.join(' ')} exited with status ${result.status}`,
    );
  }

  return result.status ?? 1;
}

let exitCode = 0;

try {
  run('docker', [
    'compose',
    '-f',
    composeFile,
    'up',
    '--wait',
    '--wait-timeout',
    '60',
  ]);
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
    ['compose', '-f', composeFile, 'down', '--volumes'],
    { allowFailure: true },
  );

  if (teardownStatus !== 0) {
    exitCode = 1;
  }
}

process.exitCode = exitCode;
