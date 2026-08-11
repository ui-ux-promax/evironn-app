const REDACTED = '[redacted]';
const SENSITIVE_KEY = /(email|phone|address|password|token|secret|authorization|cookie|card|full.?name)/i;

function redact(key: string, value: unknown): string {
  if (typeof value !== 'string') return REDACTED;
  if (/email/i.test(key) && value.includes('@')) return `[redacted-${value.split('@')[1]}]`;
  if (/phone/i.test(key)) return value.length >= 4 ? `***${value.slice(-4)}` : REDACTED;
  return REDACTED;
}

export function scrubPii<T>(value: T): T {
  if (Array.isArray(value)) return value.map(scrubPii) as T;
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? redact(key, item) : scrubPii(item),
    ]),
  ) as T;
}
