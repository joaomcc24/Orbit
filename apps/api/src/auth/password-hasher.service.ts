import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const COST = 32_768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

@Injectable()
export class PasswordHasherService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await this.derive(password, salt);

    return [
      'scrypt',
      COST,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, cost, blockSize, parallelization, salt, hash] =
      storedHash.split('$');

    if (
      algorithm !== 'scrypt' ||
      Number(cost) !== COST ||
      Number(blockSize) !== BLOCK_SIZE ||
      Number(parallelization) !== PARALLELIZATION ||
      !salt ||
      !hash
    ) {
      return false;
    }

    const storedKey = Buffer.from(hash, 'base64url');
    if (storedKey.length !== KEY_LENGTH) {
      return false;
    }

    const derivedKey = await this.derive(
      password,
      Buffer.from(salt, 'base64url'),
    );

    return timingSafeEqual(storedKey, derivedKey);
  }

  private derive(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        KEY_LENGTH,
        {
          N: COST,
          r: BLOCK_SIZE,
          p: PARALLELIZATION,
          maxmem: MAX_MEMORY,
        },
        (error, derivedKey) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(derivedKey);
        },
      );
    });
  }
}
