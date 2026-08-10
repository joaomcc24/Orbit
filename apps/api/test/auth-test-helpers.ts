import type { INestApplication } from '@nestjs/common';
import type { AuthResponse, RegisterRequest } from '@orbit/types';
import request from 'supertest';

export const TEST_PASSWORD = 'orbit-test-password';

export async function registerTestUser(
  app: INestApplication,
  input: Omit<RegisterRequest, 'password'> & { password?: string },
): Promise<AuthResponse> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      ...input,
      password: input.password ?? TEST_PASSWORD,
    })
    .expect(201);

  return response.body as AuthResponse;
}

export function bearer(accessToken: string): string {
  return `Bearer ${accessToken}`;
}
