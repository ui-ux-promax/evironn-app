import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('Evironn shell source contract', () => {
  it('keeps the exact Evironn token aliases, local font faces, and focus/reduced-motion rules', () => {
    const tokens = read('styles/evironn/tokens.css');

    for (const token of [
      '--ev-text:',
      '--ev-bg:',
      '--ev-surface:',
      '--ev-border-subtle:',
      '--ev-focus-ring:',
      '--ev-radius-lg:',
      '--ev-container-width:',
      '--ev-page-gutter:',
      '--ev-section-gap:',
    ]) {
      expect(tokens).toContain(token);
    }

    expect(tokens).toMatch(/font-family:\s*'Sentient Reference'/);
    expect(tokens).toMatch(/font-family:\s*'Nature Sentient Reference'/);
    expect(tokens).toMatch(/font-family:\s*'Benefits Sentient Reference'/);
    expect(tokens).toMatch(/font-family:\s*'Open Design Albert Sans'/);
    expect(tokens).toMatch(/button:focus-visible\s*\{[\s\S]*box-shadow:\s*var\(--ev-focus-ring\)/);
    expect(tokens).toMatch(/a:focus-visible\s*\{[\s\S]*box-shadow:\s*var\(--ev-focus-ring\)/);
    expect(tokens).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('keeps shell styles scoped to the clone roots and includes the liquid glass contract', () => {
    const header = read('styles/evironn/header.css');
    const footer = read('styles/evironn/footer.css');
    const notFound = read('styles/evironn/not-found.css');

    expect(header).toMatch(/#evironn-header\s+\.od-header-inner/);
    expect(header).toMatch(/backdrop-filter:\s*url\(#od-nav-liquid-glass\)/);
    expect(header).toMatch(/#evironn-header\s+\.od-menu-toggle/);
    expect(footer).toMatch(/\.footer-15\s*\{/);
    expect(footer).toMatch(/\.footer-15-nav\s+a:focus-visible/);
    expect(notFound).toMatch(/\.not-found-page\s*\{/);
    expect(notFound).toMatch(/padding:\s*calc\(85px \+ clamp\(2\.5rem, 7vw, 6rem\)\)/);
  });

  it('retains the App Router services while replacing only the shop shell', () => {
    const shopLayout = read('app/(shop)/layout.tsx');
    const rootLayout = read('app/layout.tsx');
    const notFound = read('app/not-found.tsx');

    expect(shopLayout).toContain('buildStorefrontJsonLd');
    expect(shopLayout).toContain('VerificationGateHost');
    expect(shopLayout).toContain('StorefrontHeader');
    expect(shopLayout).toContain('StorefrontFooter');
    expect(shopLayout).not.toMatch(/SiteHeader|SiteFooter/);
    expect(rootLayout).toContain("import './globals.css'");
    expect(existsSync(path.join(root, 'app/not-found.tsx'))).toBe(true);
    expect(notFound).toContain('NotFoundView');
    expect(notFound).toContain('StorefrontHeader');
    expect(notFound).toContain('StorefrontFooter');
  });
});
