import type { RegisterRequest } from '@orbit/types';

export class RegisterDto implements RegisterRequest {
  email!: string;
  name!: string;
  password!: string;
}
