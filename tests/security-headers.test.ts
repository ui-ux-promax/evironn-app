import { afterEach, describe, it, expect, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('security headers', () => {
  it('includes CSP and production HSTS', async () => {
    const { buildSecurityHeaders } = await import('../lib/security/headers.mjs');
    const headers = buildSecurityHeaders({ includeHsts: true });

    expect(headers).toContainEqual(expect.objectContaining({ key: 'Content-Security-Policy' }));
    expect(headers).toContainEqual(
      expect.objectContaining({
        key: 'Strict-Transport-Security',
        value: expect.stringContaining('max-age=31536000'),
      }),
    );
  });

  it('allows required preview tooling and regional Sentry ingest endpoints', async () => {
    const { buildContentSecurityPolicy } = await import('../lib/security/headers.mjs');
    const csp = buildContentSecurityPolicy({ allowVercelLive: true });

    expect(csp).toContain('script-src');
    expect(csp).toContain('https://vercel.live');
    expect(csp).toContain('connect-src');
    expect(csp).toContain('https://*.ingest.de.sentry.io');
  });

  it('keeps required external sources and browser boundary directives', async () => {
    const { buildContentSecurityPolicy, buildSecurityHeaders } = await import('../lib/security/headers.mjs');
    const csp = buildContentSecurityPolicy({ allowVercelLive: false });
    const headers = buildSecurityHeaders({ includeHsts: true, allowVercelLive: false });

    expect(csp).toContain("img-src 'self' data: blob: https://res.cloudinary.com");
    expect(csp).toContain("frame-src 'self' https://yoomoney.ru https://*.yookassa.ru");
    expect(csp).toContain('https://suggestions.dadata.ru');
    expect(csp).toContain('https://*.ingest.sentry.io');
    expect(csp).toContain('https://*.ingest.de.sentry.io');
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(headers).toContainEqual({ key: 'X-Frame-Options', value: 'DENY' });
    expect(csp).not.toContain('https://vercel.live');
  });

  it('omits HTTPS upgrade only for explicit local HTTP E2E process', async () => {
    vi.stubEnv('E2E_HTTP_LOCAL', 'true');
    const { buildContentSecurityPolicy } = await import('../lib/security/headers.mjs');
    const csp = buildContentSecurityPolicy({ allowVercelLive: false });

    expect(csp).not.toContain('upgrade-insecure-requests');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it.each([
    ['preview', true],
    ['production', false],
  ])('adds exact Blob media source in %s CSP without changing other directives', async (_name, allowVercelLive) => {
    const { buildContentSecurityPolicy } = await import('../lib/security/headers.mjs');
    const csp = buildContentSecurityPolicy({ allowVercelLive });
    const directives = csp.split('; ');

    expect(directives).toContain("media-src 'self' blob:");
    expect(directives.filter((directive) => !directive.startsWith('media-src '))).toEqual(
      allowVercelLive
        ? [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://res.cloudinary.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://suggestions.dadata.ru https://api.cloudinary.com https://vercel.live wss://vercel.live",
            "frame-src 'self' https://yoomoney.ru https://*.yookassa.ru https://vercel.live",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            'upgrade-insecure-requests',
          ]
        : [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://res.cloudinary.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://suggestions.dadata.ru https://api.cloudinary.com",
            "frame-src 'self' https://yoomoney.ru https://*.yookassa.ru",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            'upgrade-insecure-requests',
          ],
    );
  });
});
