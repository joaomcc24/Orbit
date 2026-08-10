import { ConfigService } from '@nestjs/config';
import { ExpectedCheckFailure } from './check-execution.types';
import { HostnameResolverService } from './hostname-resolver.service';
import { TargetAddressPolicyService } from './target-address-policy.service';

describe('TargetAddressPolicyService', () => {
  const publicAddress = { address: '93.184.216.34', family: 4 as const };

  function createService(options?: {
    allowPrivateTargets?: boolean;
    nodeEnv?: string;
    addresses?: Array<{ address: string; family: 4 | 6 }>;
  }): {
    service: TargetAddressPolicyService;
    resolver: { resolve: jest.Mock };
  } {
    const values: Record<string, string | undefined> = {
      MONITOR_ALLOW_PRIVATE_TARGETS: options?.allowPrivateTargets
        ? 'true'
        : 'false',
      NODE_ENV:
        options && 'nodeEnv' in options ? options.nodeEnv : 'test',
    };
    const config = {
      get: jest.fn((key: string) => values[key]),
    };
    const resolver = {
      resolve: jest.fn().mockResolvedValue(options?.addresses ?? [publicAddress]),
    };

    return {
      service: new TargetAddressPolicyService(
        config as unknown as ConfigService,
        resolver as unknown as HostnameResolverService,
      ),
      resolver,
    };
  }

  it('returns a pinned public address for an HTTP target', async () => {
    const { service, resolver } = createService();

    await expect(service.resolve('https://example.com/health')).resolves.toEqual({
      url: new URL('https://example.com/health'),
      ...publicAddress,
    });
    expect(resolver.resolve).toHaveBeenCalledWith('example.com');
  });

  it.each([
    ['127.0.0.1', 4],
    ['10.0.0.8', 4],
    ['169.254.169.254', 4],
    ['::1', 6],
    ['fc00::1', 6],
    ['::ffff:127.0.0.1', 6],
  ] as const)('blocks the non-public address %s', async (address, family) => {
    const { service } = createService({
      addresses: [{ address, family }],
    });

    await expect(service.resolve('http://target.test')).rejects.toMatchObject({
      reason: 'BLOCKED_TARGET',
      message: 'Target resolves to a non-public network address',
    });
  });

  it('rejects a hostname when any DNS answer is non-public', async () => {
    const { service } = createService({
      addresses: [publicAddress, { address: '10.0.0.5', family: 4 }],
    });

    await expect(service.resolve('https://mixed.test')).rejects.toBeInstanceOf(
      ExpectedCheckFailure,
    );
  });

  it('allows a private target only with the explicit development setting', async () => {
    const { service } = createService({
      allowPrivateTargets: true,
      nodeEnv: 'development',
      addresses: [{ address: '127.0.0.1', family: 4 }],
    });

    await expect(service.resolve('http://localhost:3001/api/health')).resolves.toMatchObject({
      address: '127.0.0.1',
      family: 4,
    });
  });

  it.each(['production', undefined])(
    'refuses private targets outside an explicit development or test environment',
    (nodeEnv) => {
      expect(() =>
        createService({
          allowPrivateTargets: true,
          nodeEnv,
        }),
      ).toThrow(
        'MONITOR_ALLOW_PRIVATE_TARGETS is allowed only in development or test',
      );
    },
  );

  it('rejects target URLs containing credentials', async () => {
    const { service } = createService();

    await expect(
      service.resolve('https://user:secret@example.com/health'),
    ).rejects.toMatchObject({
      reason: 'BLOCKED_TARGET',
      message: 'Target URL cannot contain credentials',
    });
  });
});
