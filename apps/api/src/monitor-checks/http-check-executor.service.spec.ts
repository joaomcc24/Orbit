import { ConfigService } from '@nestjs/config';
import { ExpectedCheckFailure } from './check-execution.types';
import { HttpCheckExecutorService } from './http-check-executor.service';
import { HttpHeaderClientService } from './http-header-client.service';
import { TargetAddressPolicyService } from './target-address-policy.service';

describe('HttpCheckExecutorService', () => {
  let targetPolicy: { resolve: jest.Mock };
  let headerClient: { request: jest.Mock };
  let service: HttpCheckExecutorService;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string) =>
        key === 'MONITOR_CHECK_TIMEOUT_MS' ? '10000' : undefined,
      ),
    };
    targetPolicy = {
      resolve: jest.fn(async (rawUrl: string) => ({
        url: new URL(rawUrl),
        address: '93.184.216.34',
        family: 4 as const,
      })),
    };
    headerClient = {
      request: jest.fn(),
    };
    service = new HttpCheckExecutorService(
      config as unknown as ConfigService,
      targetPolicy as unknown as TargetAddressPolicyService,
      headerClient as unknown as HttpHeaderClientService,
    );
  });

  it('classifies a successful HTTP response as up', async () => {
    headerClient.request.mockResolvedValue({
      statusCode: 204,
      location: undefined,
    });

    const result = await service.execute('https://example.com/health');

    expect(result).toMatchObject({
      result: 'UP',
      failureReason: null,
      httpStatusCode: 204,
      errorMessage: null,
    });
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.checkedAt).toBeInstanceOf(Date);
  });

  it('classifies an unhealthy HTTP response as down', async () => {
    headerClient.request.mockResolvedValue({
      statusCode: 503,
      location: undefined,
    });

    await expect(service.execute('https://example.com/health')).resolves.toMatchObject({
      result: 'DOWN',
      failureReason: 'HTTP_STATUS',
      httpStatusCode: 503,
      errorMessage: 'HTTP 503',
    });
  });

  it('does not pass a nonstandard status code to database persistence', async () => {
    headerClient.request.mockResolvedValue({
      statusCode: 700,
      location: undefined,
    });

    await expect(service.execute('https://example.com/health')).resolves.toMatchObject({
      result: 'DOWN',
      failureReason: 'CONNECTION',
      httpStatusCode: null,
      errorMessage: 'Response included an invalid final HTTP status',
    });
  });

  it('follows and revalidates redirects before classifying the final response', async () => {
    headerClient.request
      .mockResolvedValueOnce({ statusCode: 301, location: '/ready' })
      .mockResolvedValueOnce({ statusCode: 200, location: undefined });

    const result = await service.execute('http://example.com/health');

    expect(result.result).toBe('UP');
    expect(targetPolicy.resolve).toHaveBeenNthCalledWith(
      1,
      'http://example.com/health',
    );
    expect(targetPolicy.resolve).toHaveBeenNthCalledWith(
      2,
      'http://example.com/ready',
    );
  });

  it('records an expected target-policy failure as down', async () => {
    targetPolicy.resolve.mockRejectedValue(
      new ExpectedCheckFailure(
        'BLOCKED_TARGET',
        'Target resolves to a non-public network address',
      ),
    );

    await expect(service.execute('http://localhost')).resolves.toMatchObject({
      result: 'DOWN',
      failureReason: 'BLOCKED_TARGET',
      httpStatusCode: null,
      errorMessage: 'Target resolves to a non-public network address',
    });
  });

  it('detects a redirect loop', async () => {
    headerClient.request.mockResolvedValue({
      statusCode: 302,
      location: '/health',
    });

    await expect(service.execute('https://example.com/health')).resolves.toMatchObject({
      result: 'DOWN',
      failureReason: 'REDIRECT',
      errorMessage: 'Redirect loop detected',
    });
  });

  it('does not convert unexpected Orbit errors into target downtime', async () => {
    headerClient.request.mockRejectedValue(new Error('programming error'));

    await expect(service.execute('https://example.com')).rejects.toThrow(
      'programming error',
    );
  });
});
