import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, registerTestUser } from './auth-test-helpers';

const ownerInput = {
  email: 'owner@orbit.test',
  name: 'Orbit Owner',
};
const workspaceInput = {
  name: 'Orbit Integration Lab',
  slug: 'orbit-integration-lab',
};

describe('Workspace API with PostgreSQL', () => {
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

  it('creates and lists workspaces for the authenticated owner', async () => {
    const owner = await registerTestUser(app, ownerInput);
    const authorization = bearer(owner.accessToken);

    const createResponse = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', authorization)
      .send(workspaceInput)
      .expect(201);

    expect(createResponse.body.workspace).toMatchObject({
      ...workspaceInput,
      members: [
        {
          role: 'OWNER',
          user: owner.user,
        },
      ],
    });

    await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', authorization)
      .send({ name: 'Orbit Operations', slug: 'orbit-operations' })
      .expect(201);

    const outsider = await registerTestUser(app, {
      email: 'another-owner@orbit.test',
      name: 'Another Owner',
    });
    await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', bearer(outsider.accessToken))
      .send({ name: 'Another Team', slug: 'another-team' })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/api/workspaces')
      .set('Authorization', authorization)
      .expect(200);

    expect(
      listResponse.body.workspaces.map(
        (workspace: { slug: string }) => workspace.slug,
      ),
    ).toEqual([workspaceInput.slug, 'orbit-operations']);
    await expect(
      prisma.workspaceMember.count({ where: { userId: owner.user.id } }),
    ).resolves.toBe(2);
  });

  it('allows only a workspace member to read workspace details', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', bearer(owner.accessToken))
      .send(workspaceInput)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceInput.slug}`)
      .set('Authorization', bearer(owner.accessToken))
      .expect(200);

    const outsider = await registerTestUser(app, {
      email: 'outsider@orbit.test',
      name: 'Outsider',
    });
    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspaceInput.slug}`)
      .set('Authorization', bearer(outsider.accessToken))
      .expect(404);
  });

  it('enforces one membership per user and workspace', async () => {
    const owner = await registerTestUser(app, ownerInput);
    await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', bearer(owner.accessToken))
      .send(workspaceInput)
      .expect(201);

    const storedMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspace: { slug: workspaceInput.slug },
        userId: owner.user.id,
      },
    });

    if (!storedMembership) {
      throw new Error('Expected the API to create an owner membership');
    }

    await expect(
      prisma.workspaceMember.create({
        data: {
          role: 'VIEWER',
          userId: storedMembership.userId,
          workspaceId: storedMembership.workspaceId,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('enforces the unique workspace slug for authenticated users', async () => {
    const owner = await registerTestUser(app, ownerInput);
    const authorization = bearer(owner.accessToken);

    await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', authorization)
      .send(workspaceInput)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', authorization)
      .send(workspaceInput)
      .expect(409);

    expect(response.body.message).toBe('Workspace slug is already in use');
    await expect(
      prisma.workspace.count({ where: { slug: workspaceInput.slug } }),
    ).resolves.toBe(1);
  });
});
