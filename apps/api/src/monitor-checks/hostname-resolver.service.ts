import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Injectable } from '@nestjs/common';
import { ExpectedCheckFailure } from './check-execution.types';

export type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

@Injectable()
export class HostnameResolverService {
  async resolve(hostname: string): Promise<ResolvedAddress[]> {
    const literalFamily = isIP(hostname);

    if (literalFamily === 4 || literalFamily === 6) {
      return [{ address: hostname, family: literalFamily }];
    }

    try {
      const addresses = await lookup(hostname, {
        all: true,
        verbatim: true,
      });
      const uniqueAddresses = new Map<string, ResolvedAddress>();

      for (const resolved of addresses) {
        if (resolved.family !== 4 && resolved.family !== 6) continue;

        uniqueAddresses.set(`${resolved.family}:${resolved.address}`, {
          address: resolved.address,
          family: resolved.family,
        });
      }

      if (uniqueAddresses.size === 0) {
        throw new ExpectedCheckFailure('DNS', 'DNS lookup returned no addresses');
      }

      return [...uniqueAddresses.values()];
    } catch (error) {
      if (error instanceof ExpectedCheckFailure) throw error;

      throw new ExpectedCheckFailure('DNS', 'DNS lookup failed');
    }
  }
}
