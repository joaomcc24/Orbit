import * as http from 'node:http';
import * as https from 'node:https';
import type { LookupFunction } from 'node:net';
import { Injectable } from '@nestjs/common';
import { ExpectedCheckFailure } from './check-execution.types';
import type { ResolvedTarget } from './target-address-policy.service';

export type HeaderResponse = {
  statusCode: number;
  location: string | undefined;
};

@Injectable()
export class HttpHeaderClientService {
  request(
    target: ResolvedTarget,
    timeoutMs: number,
    configuredTimeoutMs: number,
  ): Promise<HeaderResponse> {
    const lookup: LookupFunction = (_hostname, _options, callback) => {
      callback(null, target.address, target.family);
    };
    const transport = target.url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      let settled = false;
      const request = transport.request(
        target.url,
        {
          method: 'GET',
          agent: false,
          lookup,
          headers: {
            accept: '*/*',
            'user-agent': 'Orbit-Monitor/0.1',
          },
        },
        (response) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          response.destroy();

          if (response.statusCode === undefined) {
            reject(
              new ExpectedCheckFailure(
                'CONNECTION',
                'Response did not include an HTTP status',
              ),
            );
            return;
          }

          resolve({
            statusCode: response.statusCode,
            location: response.headers.location,
          });
        },
      );
      const timeout = setTimeout(() => {
        request.destroy(
          new ExpectedCheckFailure(
            'TIMEOUT',
            `Check timed out after ${configuredTimeoutMs} ms`,
          ),
        );
      }, timeoutMs);

      request.once('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(this.classifyRequestError(error));
      });
      request.end();
    });
  }

  private classifyRequestError(error: Error): ExpectedCheckFailure {
    if (error instanceof ExpectedCheckFailure) return error;

    const code = (error as NodeJS.ErrnoException).code ?? '';
    const tlsError =
      code.startsWith('ERR_TLS') ||
      code.startsWith('ERR_SSL') ||
      code.includes('CERT') ||
      code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      code === 'SELF_SIGNED_CERT_IN_CHAIN';

    if (tlsError) {
      return new ExpectedCheckFailure('TLS', 'TLS negotiation failed');
    }

    return new ExpectedCheckFailure('CONNECTION', 'Connection failed');
  }
}
