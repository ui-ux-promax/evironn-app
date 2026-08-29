import { describe, it, expect } from 'vitest';

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
});
