import { createHash, randomUUID } from 'node:crypto';

function safePart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'test'
  );
}

export function phase4Namespace(testInfoTitle: string): string {
  const runId = createHash('sha256')
    .update(`${testInfoTitle}:${Date.now()}:${randomUUID()}`)
    .digest('hex')
    .slice(0, 20);
  return `phase4-e2e-${safePart(testInfoTitle)}-${runId}`.slice(0, 80);
}
