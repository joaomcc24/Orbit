const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
