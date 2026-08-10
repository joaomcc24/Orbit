import type { AuthUserSummary } from '@orbit/types';

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type AuthenticatedUser = AuthUserSummary;
