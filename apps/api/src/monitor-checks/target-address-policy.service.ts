import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ipaddr from 'ipaddr.js';
import { ExpectedCheckFailure } from './check-execution.types';
import {
  HostnameResolverService,
  type ResolvedAddress,
} from './hostname-resolver.service';

export type ResolvedTarget = ResolvedAddress & {
  url: URL;
};

@Injectable()
export class TargetAddressPolicyService {
  private readonly allowPrivateTargets: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly resolver: HostnameResolverService,
  ) {
    this.allowPrivateTargets =
      this.config.get<string>('MONITOR_ALLOW_PRIVATE_TARGETS') === 'true';

    const nodeEnvironment = this.config.get<string>('NODE_ENV');

    if (
      this.allowPrivateTargets &&
      nodeEnvironment !== 'development' &&
      nodeEnvironment !== 'test'
    ) {
      throw new Error(
        'MONITOR_ALLOW_PRIVATE_TARGETS is allowed only in development or test',
      );
    }
  }

  async resolve(rawUrl: string): Promise<ResolvedTarget> {
    const url = this.parseUrl(rawUrl);
    const hostname = this.unbracketHostname(url.hostname);
    const addresses = await this.resolver.resolve(hostname);

    if (
      !this.allowPrivateTargets &&
      addresses.some(({ address }) => !this.isPublicAddress(address))
    ) {
      throw new ExpectedCheckFailure(
        'BLOCKED_TARGET',
        'Target resolves to a non-public network address',
      );
    }

    return {
      url,
      ...addresses[0],
    };
  }

  private parseUrl(rawUrl: string): URL {
    if (rawUrl.length > 2048) {
      throw new ExpectedCheckFailure(
        'BLOCKED_TARGET',
        'Target URL must be 2048 characters or less',
      );
    }

    let url: URL;

    try {
      url = new URL(rawUrl);
    } catch {
      throw new ExpectedCheckFailure(
        'BLOCKED_TARGET',
        'Target is not a valid URL',
      );
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new ExpectedCheckFailure(
        'BLOCKED_TARGET',
        'Target must use HTTP or HTTPS',
      );
    }

    if (url.username || url.password) {
      throw new ExpectedCheckFailure(
        'BLOCKED_TARGET',
        'Target URL cannot contain credentials',
      );
    }

    return url;
  }

  private unbracketHostname(hostname: string): string {
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      return hostname.slice(1, -1);
    }

    return hostname;
  }

  private isPublicAddress(address: string): boolean {
    let parsedAddress = ipaddr.parse(address);

    if (
      parsedAddress instanceof ipaddr.IPv6 &&
      parsedAddress.isIPv4MappedAddress()
    ) {
      parsedAddress = parsedAddress.toIPv4Address();
    }

    return parsedAddress.range() === 'unicast';
  }
}
