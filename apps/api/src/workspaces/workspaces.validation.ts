import { BadRequestException } from '@nestjs/common';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeWorkspaceSlug(slug: string | undefined): string {
  const normalizedSlug = slug?.trim().toLowerCase();

  if (!normalizedSlug || !SLUG_PATTERN.test(normalizedSlug)) {
    throw new BadRequestException(
      'Workspace slug must use lowercase letters, numbers, and hyphens',
    );
  }

  if (normalizedSlug.length > 48) {
    throw new BadRequestException(
      'Workspace slug must be 48 characters or less',
    );
  }

  return normalizedSlug;
}
