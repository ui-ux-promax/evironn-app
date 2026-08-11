import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth/providers/google', () => ({ default: vi.fn(() => ({})) }));
vi.mock('next-auth/providers/credentials', () => ({ default: vi.fn(() => ({})) }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('auth configuration', () => {
  it('does not trust an incoming Host header unless explicitly enabled', async () => {
    vi.stubEnv('AUTH_TRUST_HOST', '');
    const { default: config } = await import('@/auth.config');

    expect(config.trustHost).toBe(false);
  });

  it('allows host trust only when deployment configuration opts in', async () => {
    vi.stubEnv('AUTH_TRUST_HOST', 'true');
    const { default: config } = await import('@/auth.config');

    expect(config.trustHost).toBe(true);
  });
});
