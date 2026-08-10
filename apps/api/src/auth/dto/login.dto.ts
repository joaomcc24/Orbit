import type { LoginRequest } from '@orbit/types';

export class LoginDto implements LoginRequest {
  email!: string;
  password!: string;
}
