import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type {
  AuthResponse,
  AuthUserSummary,
  LoginRequest,
  RegisterRequest,
} from '@orbit/types';
import { isValidEmail } from '../common/validation';
import { PrismaService } from '../prisma/prisma.service';
import type { AccessTokenPayload } from './auth.types';
import { PasswordHasherService } from './password-hasher.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    input: Partial<RegisterRequest> | undefined,
  ): Promise<AuthResponse> {
    const data = this.normalizeRegisterInput(input);
    const passwordHash = await this.passwordHasher.hash(data.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
        },
      });

      return this.createAuthResponse(user);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  async login(input: Partial<LoginRequest> | undefined): Promise<AuthResponse> {
    const data = this.normalizeLoginInput(input);
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user?.passwordHash) {
      await this.passwordHasher.hash(data.password);
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.passwordHasher.verify(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  private normalizeRegisterInput(
    input: Partial<RegisterRequest> | undefined,
  ): RegisterRequest {
    const email =
      typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    const password =
      typeof input?.password === 'string' ? input.password : '';

    if (!email || !name || !password) {
      throw new BadRequestException('email, name, and password are required');
    }

    if (!isValidEmail(email) || email.length > 254) {
      throw new BadRequestException('Email must be a valid email address');
    }

    if (name.length > 80) {
      throw new BadRequestException('Name must be 80 characters or less');
    }

    this.assertPasswordLength(password);

    return { email, name, password };
  }

  private normalizeLoginInput(
    input: Partial<LoginRequest> | undefined,
  ): LoginRequest {
    const email =
      typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password =
      typeof input?.password === 'string' ? input.password : '';

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    if (!isValidEmail(email) || email.length > 254) {
      throw new BadRequestException('Email must be a valid email address');
    }

    return { email, password };
  }

  private assertPasswordLength(password: string): void {
    if (password.length < 12 || password.length > 128) {
      throw new BadRequestException(
        'Password must be between 12 and 128 characters',
      );
    }
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      user: this.toUserSummary(user),
    };
  }

  private toUserSummary(user: User): AuthUserSummary {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
