import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, registerTestUser } from './auth-test-helpers';

const workspaceInput = {
  name: 'Orbit Monitor Lab',
  slug: 'orbit-monitor-lab',
};
const ownerInput = {
  email: 'monitor-owner@orbit.test',
  name: 'Monitor Owner',
};

const monitorInput = {
  name: 'Orbit API',
  targetUrl: 'https://api.orbit.test/health',
  interval: 60,
};

describe('Monitor API with PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let targetServer: Server;
  let targetBaseUrl: string;

  beforeAll(async () => {
    targetServer = createServer((request, response) => {
      if (request.url === '/redirect') {
        response.writeHead(302, { location: '/healthy' });
        response.end();
        return;
      }

      if (request.url === '/healthy') {
        response.writeHead(204);
        response.end();
        return;
      }

      if (request.url === '/down') {
        response.writeHead(503);
        response.end();
        return;
      }

      if (request.url === '/slow') return;

      response.writeHead(404);
      response.end();
    });
    await new Promise<void>((resolve, reject) => {
      targetServer.once('error', reject);
      targetServer.listen(0, '127.0.0.1', resolve);
    });
    const targetAddress = targetServer.address() as AddressInfo;
    targetBaseUrl = `http://127.0.0.1:${targetAddress.port}`;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.monitorCheck.deleteMany();
    await prisma.monitor.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve, reject) => {
      targetServer.close((error) => (error ? reject(error) : resolve()));
    });
  });

  async function createWorkspace(accessToken: string): Promise<void> {
    await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', bearer(accessToken))
      .send(workspaceInput)
      .expect(201);
  }

  async function createMonitor(
    accessToken: string,
    targetUrl: string,
  ): Promise<{ id: string }> {
    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceInput.slug}/monitors`)
      .set('Authorization', bearer(accessToken))
      .send({ ...monitorInput, targetUrl })
      .expect(201);

    return response.body.monitor as { id: string };
  }

  it('creates, persists, and lists pending monitor configuration', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await createWorkspace(owner.accessToken);

    const createResponse = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceInput.slug}/monitors`)
      .set('Authorization', bearer(owner.accessToken))
      .send(monitorInput)
      .expect(201);

    expect(createResponse.body.monitor).toMatchObject({
      ...monitorInput,
      status: 'PENDING',
    });
    expect(createResponse.body.monitor.id).toEqual(expect.any(String));
    expect(createResponse.body.monitor.workspaceId).toEqual(expect.any(String));
    expect(createResponse.body.monitor.createdAt).toEqual(expect.any(String));
    expect(createResponse.body.monitor.updatedAt).toEqual(expect.any(String));

    const storedMonitor = await prisma.monitor.findUnique({
      where: { id: createResponse.body.monitor.id },
      include: { workspace: true },
    });

    expect(storedMonitor).toMatchObject({
      ...monitorInput,
      status: 'PENDING',
      workspace: {
        slug: workspaceInput.slug,
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceInput.slug}/monitors`)
      .set('Authorization', bearer(owner.accessToken))
      .expect(200);

    expect(listResponse.body.monitors).toEqual([createResponse.body.monitor]);
  });

  it('prevents a non-member from reading or creating workspace monitors', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await createWorkspace(owner.accessToken);
    const outsider = await registerTestUser(app, {
      email: 'outsider@orbit.test',
      name: 'Outsider',
    });

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceInput.slug}/monitors`)
      .set('Authorization', bearer(outsider.accessToken))
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceInput.slug}/monitors`)
      .set('Authorization', bearer(outsider.accessToken))
      .send(monitorInput)
      .expect(404);

    await expect(prisma.monitor.count()).resolves.toBe(0);
  });

  it('executes a redirect, persists an up check, and exposes its history', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await createWorkspace(owner.accessToken);
    const targetUrl = `${targetBaseUrl}/redirect`;
    const monitor = await createMonitor(owner.accessToken, targetUrl);

    const runResponse = await request(app.getHttpServer())
      .post(
        `/api/workspaces/${workspaceInput.slug}/monitors/${monitor.id}/checks`,
      )
      .set('Authorization', bearer(owner.accessToken))
      .expect(201);

    expect(runResponse.body.check).toMatchObject({
      monitorId: monitor.id,
      result: 'UP',
      failureReason: null,
      targetUrl,
      httpStatusCode: 204,
      errorMessage: null,
    });
    expect(runResponse.body.check.responseTimeMs).toEqual(expect.any(Number));
    expect(runResponse.body.monitor).toMatchObject({
      id: monitor.id,
      status: 'UP',
      lastCheckedAt: runResponse.body.check.checkedAt,
    });

    const storedCheck = await prisma.monitorCheck.findUnique({
      where: { id: runResponse.body.check.id },
    });
    expect(storedCheck).toMatchObject({
      monitorId: monitor.id,
      result: 'UP',
      targetUrl,
      httpStatusCode: 204,
    });

    const historyResponse = await request(app.getHttpServer())
      .get(
        `/api/workspaces/${workspaceInput.slug}/monitors/${monitor.id}/checks?limit=1`,
      )
      .set('Authorization', bearer(owner.accessToken))
      .expect(200);

    expect(historyResponse.body.checks).toEqual([runResponse.body.check]);
  });

  it('persists HTTP and timeout failures as down checks', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await createWorkspace(owner.accessToken);
    const downMonitor = await createMonitor(
      owner.accessToken,
      `${targetBaseUrl}/down`,
    );
    const slowMonitor = await createMonitor(
      owner.accessToken,
      `${targetBaseUrl}/slow`,
    );

    const downResponse = await request(app.getHttpServer())
      .post(
        `/api/workspaces/${workspaceInput.slug}/monitors/${downMonitor.id}/checks`,
      )
      .set('Authorization', bearer(owner.accessToken))
      .expect(201);
    expect(downResponse.body.check).toMatchObject({
      result: 'DOWN',
      failureReason: 'HTTP_STATUS',
      httpStatusCode: 503,
      errorMessage: 'HTTP 503',
    });

    const timeoutResponse = await request(app.getHttpServer())
      .post(
        `/api/workspaces/${workspaceInput.slug}/monitors/${slowMonitor.id}/checks`,
      )
      .set('Authorization', bearer(owner.accessToken))
      .expect(201);
    expect(timeoutResponse.body.check).toMatchObject({
      result: 'DOWN',
      failureReason: 'TIMEOUT',
      httpStatusCode: null,
      errorMessage: 'Check timed out after 1000 ms',
    });
  });

  it('prevents a non-member from triggering or reading monitor checks', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await createWorkspace(owner.accessToken);
    const monitor = await createMonitor(
      owner.accessToken,
      `${targetBaseUrl}/healthy`,
    );
    const outsider = await registerTestUser(app, {
      email: 'check-outsider@orbit.test',
      name: 'Check Outsider',
    });
    const checksPath = `/api/workspaces/${workspaceInput.slug}/monitors/${monitor.id}/checks`;

    await request(app.getHttpServer())
      .post(checksPath)
      .set('Authorization', bearer(outsider.accessToken))
      .expect(404);
    await request(app.getHttpServer())
      .get(checksPath)
      .set('Authorization', bearer(outsider.accessToken))
      .expect(404);
    await expect(prisma.monitorCheck.count()).resolves.toBe(0);
  });

  it('rejects inconsistent monitor checks at the database layer', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await createWorkspace(owner.accessToken);
    const monitor = await createMonitor(
      owner.accessToken,
      `${targetBaseUrl}/healthy`,
    );

    await expect(
      prisma.monitorCheck.create({
        data: {
          monitorId: monitor.id,
          result: 'UP',
          failureReason: 'TIMEOUT',
          targetUrl: `${targetBaseUrl}/healthy`,
          httpStatusCode: 200,
          responseTimeMs: 10,
          checkedAt: new Date(),
        },
      }),
    ).rejects.toBeDefined();
    await expect(prisma.monitorCheck.count()).resolves.toBe(0);
  });

  it('rejects an unsupported interval at both the API and database layers', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await createWorkspace(owner.accessToken);

    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceInput.slug}/monitors`)
      .set('Authorization', bearer(owner.accessToken))
      .send({
        ...monitorInput,
        interval: 45,
      })
      .expect(400);

    expect(response.body.message).toBe(
      'Monitor interval must be 30, 60, or 300 seconds',
    );

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceInput.slug },
    });

    if (!workspace) {
      throw new Error('Expected the API to create the test workspace');
    }

    await expect(
      prisma.monitor.create({
        data: {
          ...monitorInput,
          interval: 45,
          workspaceId: workspace.id,
        },
      }),
    ).rejects.toBeDefined();
    await expect(prisma.monitor.count()).resolves.toBe(0);
  });
});
