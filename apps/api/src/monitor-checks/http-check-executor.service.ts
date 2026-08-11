import { performance } from 'node:perf_hooks';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type CheckExecutionResult,
  ExpectedCheckFailure,
} from './check-execution.types';
import {
  TargetAddressPolicyService,
} from './target-address-policy.service';
import {
  type HeaderResponse,
  HttpHeaderClientService,
} from './http-header-client.service';

const maxRedirects = 5;
const defaultTimeoutMs = 10_000;

@Injectable()
export class HttpCheckExecutorService {
  private readonly timeoutMs: number;

  constructor(
    private readonly config: ConfigService,
    private readonly targetPolicy: TargetAddressPolicyService,
    private readonly headerClient: HttpHeaderClientService,
  ) {
    this.timeoutMs = this.readTimeout();
  }

  async execute(targetUrl: string): Promise<CheckExecutionResult> {
    const startedAt = performance.now();
    const deadline = Date.now() + this.timeoutMs;

    try {
      const response = await this.followRedirects(targetUrl, deadline);
      const responseTimeMs = this.elapsedMilliseconds(startedAt);
      const checkedAt = new Date();

      if (response.statusCode < 200 || response.statusCode > 599) {
        throw new ExpectedCheckFailure(
          'CONNECTION',
          'Response included an invalid final HTTP status',
        );
      }

      if (response.statusCode >= 200 && response.statusCode <= 399) {
        return {
          result: 'UP',
          failureReason: null,
          httpStatusCode: response.statusCode,
          responseTimeMs,
          checkedAt,
          errorMessage: null,
        };
      }

      return {
        result: 'DOWN',
        failureReason: 'HTTP_STATUS',
        httpStatusCode: response.statusCode,
        responseTimeMs,
        checkedAt,
        errorMessage: `HTTP ${response.statusCode}`,
      };
    } catch (error) {
      if (!(error instanceof ExpectedCheckFailure)) throw error;

      return {
        result: 'DOWN',
        failureReason: error.reason,
        httpStatusCode: error.httpStatusCode,
        responseTimeMs: this.elapsedMilliseconds(startedAt),
        checkedAt: new Date(),
        errorMessage: error.message,
      };
    }
  }

  private async followRedirects(
    initialUrl: string,
    deadline: number,
  ): Promise<HeaderResponse> {
    let currentUrl = initialUrl;
    const visitedUrls = new Set<string>();

    for (let redirectCount = 0; ; redirectCount += 1) {
      this.assertTimeRemaining(deadline);
      const target = await this.withDeadline(
        this.targetPolicy.resolve(currentUrl),
        deadline,
      );
      const normalizedUrl = target.url.href;

      if (visitedUrls.has(normalizedUrl)) {
        throw new ExpectedCheckFailure('REDIRECT', 'Redirect loop detected');
      }

      visitedUrls.add(normalizedUrl);
      const response = await this.headerClient.request(
        target,
        this.remainingMilliseconds(deadline),
        this.timeoutMs,
      );

      if (!this.isRedirect(response.statusCode) || !response.location) {
        return response;
      }

      if (redirectCount >= maxRedirects) {
        throw new ExpectedCheckFailure(
          'REDIRECT',
          `Redirect limit of ${maxRedirects} exceeded`,
          response.statusCode,
        );
      }

      try {
        currentUrl = new URL(response.location, target.url).href;
      } catch {
        throw new ExpectedCheckFailure(
          'REDIRECT',
          'Redirect location is invalid',
          response.statusCode,
        );
      }
    }
  }

  private async withDeadline<T>(
    operation: Promise<T>,
    deadline: number,
  ): Promise<T> {
    const remainingMs = this.remainingMilliseconds(deadline);
    let timeout: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        operation,
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => {
            reject(
              new ExpectedCheckFailure(
                'TIMEOUT',
                `Check timed out after ${this.timeoutMs} ms`,
              ),
            );
          }, remainingMs);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private isRedirect(statusCode: number): boolean {
    return statusCode >= 300 && statusCode <= 399;
  }

  private readTimeout(): number {
    const configuredTimeout = this.config.get<string>('MONITOR_CHECK_TIMEOUT_MS');
    const timeout = configuredTimeout
      ? Number(configuredTimeout)
      : defaultTimeoutMs;

    if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
      throw new Error(
        'MONITOR_CHECK_TIMEOUT_MS must be an integer between 1000 and 30000',
      );
    }

    return timeout;
  }

  private assertTimeRemaining(deadline: number): void {
    this.remainingMilliseconds(deadline);
  }

  private remainingMilliseconds(deadline: number): number {
    const remainingMs = deadline - Date.now();

    if (remainingMs <= 0) {
      throw new ExpectedCheckFailure(
        'TIMEOUT',
        `Check timed out after ${this.timeoutMs} ms`,
      );
    }

    return remainingMs;
  }

  private elapsedMilliseconds(startedAt: number): number {
    return Math.max(0, Math.round(performance.now() - startedAt));
  }
}
