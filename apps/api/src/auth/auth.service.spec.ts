import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordHasherService } from './password-hasher.service';

const createdAt = new Date('2026-08-07T14:00:00.000Z');
const user = {
  id: '8af8466c-dd8e-409b-99e3-8942e6dac01c',
  email: 'joao@example.com',
  name: 'Joao Cardoso',
  passwordHash: 'stored-password-hash',
  createdAt,
  updatedAt: createdAt,
};

describe('AuthService', () => {
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let passwordHasher: {
    hash: jest.Mock;
    verify: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    passwordHasher = {
      hash: jest.fn().mockResolvedValue('stored-password-hash'),
      verify: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-access-token'),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      passwordHasher as unknown as PasswordHasherService,
      jwtService as unknown as JwtService,
    );
  });

  it('registers a normalized user and returns a signed access token', async () => {
    prisma.user.create.mockResolvedValue(user);

    const response = await service.register({
      email: '  JOAO@EXAMPLE.COM  ',
      name: '  Joao Cardoso  ',
      password: 'a secure password',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('a secure password');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
    expect(response).toEqual({
      accessToken: 'signed-access-token',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: createdAt.toISOString(),
      },
    });
  });

  it('translates duplicate registration into a conflict', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.register({
        email: user.email,
        name: user.name,
        password: 'a secure password',
      }),
    ).rejects.toThrow(
      new ConflictException('An account with this email already exists'),
    );
  });

  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);

    const response = await service.login({
      email: '  JOAO@EXAMPLE.COM  ',
      password: 'a secure password',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: user.email },
    });
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'a secure password',
      user.passwordHash,
    );
    expect(response.accessToken).toBe('signed-access-token');
  });

  it('uses the same public error for a missing user or wrong password', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'some password' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    expect(passwordHasher.hash).toHaveBeenCalledWith('some password');

    prisma.user.findUnique.mockResolvedValueOnce(user);
    passwordHasher.verify.mockResolvedValueOnce(false);

    await expect(
      service.login({ email: user.email, password: 'wrong password' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
  });

  it('enforces the registration password boundary', async () => {
    await expect(
      service.register({
        email: user.email,
        name: user.name,
        password: 'too-short',
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Password must be between 12 and 128 characters',
      ),
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });
});
