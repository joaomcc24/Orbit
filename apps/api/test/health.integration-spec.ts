import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health API with PostgreSQL', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes a dependency-free liveness response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health/live')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });

  it('checks PostgreSQL on the explicit and compatible readiness routes', async () => {
    for (const route of ['/api/health/ready', '/api/health']) {
      const response = await request(app.getHttpServer())
        .get(route)
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        database: 'ok',
        timestamp: expect.any(String),
      });
    }
  });
});
