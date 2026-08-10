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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.monitor.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createWorkspace(accessToken: string): Promise<void> {
    await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', bearer(accessToken))
      .send(workspaceInput)
      .expect(201);
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
