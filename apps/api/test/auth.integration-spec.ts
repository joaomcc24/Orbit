import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  registerTestUser,
  TEST_PASSWORD,
} from './auth-test-helpers';

const userInput = {
  email: 'auth-owner@orbit.test',
  name: 'Auth Owner',
};

describe('Authentication API with PostgreSQL', () => {
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

  it('registers a user, stores only a hash, and authenticates the token', async () => {
    const auth = await registerTestUser(app, userInput);

    expect(auth).toMatchObject({
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      user: userInput,
    });
    expect(auth.accessToken).toEqual(expect.any(String));

    const storedUser = await prisma.user.findUnique({
      where: { email: userInput.email },
    });

    expect(storedUser?.passwordHash).toMatch(/^scrypt\$/);
    expect(storedUser?.passwordHash).not.toContain(TEST_PASSWORD);

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', bearer(auth.accessToken))
      .expect(200);

    expect(meResponse.body.user).toEqual(auth.user);
  });

  it('logs in with valid credentials and rejects an invalid password', async () => {
    await registerTestUser(app, userInput);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userInput.email.toUpperCase(),
        password: TEST_PASSWORD,
      })
      .expect(200);

    expect(loginResponse.body).toMatchObject({
      tokenType: 'Bearer',
      user: userInput,
    });

    const invalidResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userInput.email,
        password: 'incorrect-password',
      })
      .expect(401);

    expect(invalidResponse.body.message).toBe('Invalid email or password');
  });

  it('rejects duplicate registration and protected requests without a token', async () => {
    await registerTestUser(app, userInput);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...userInput, password: TEST_PASSWORD })
      .expect(409);

    await request(app.getHttpServer()).get('/api/workspaces').expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-token')
      .expect(401);
  });
});
