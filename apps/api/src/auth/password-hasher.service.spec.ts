import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  const service = new PasswordHasherService();

  it('creates a salted hash that does not contain the password', async () => {
    const password = 'correct horse battery staple';

    const hash = await service.hash(password);

    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain(password);
    await expect(service.verify(password, hash)).resolves.toBe(true);
  });

  it('uses a different salt for the same password', async () => {
    const password = 'correct horse battery staple';

    const firstHash = await service.hash(password);
    const secondHash = await service.hash(password);

    expect(firstHash).not.toBe(secondHash);
  });

  it('rejects an incorrect password and malformed hash', async () => {
    const hash = await service.hash('correct horse battery staple');

    await expect(service.verify('wrong password', hash)).resolves.toBe(false);
    await expect(service.verify('password', 'invalid')).resolves.toBe(false);
  });
});
