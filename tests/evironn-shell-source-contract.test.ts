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
    expect(header).toMatch(
      /@supports\s*\(background-image:\s*-moz-element\(#od-header-backdrop\)\)[\s\S]*?background-image:\s*-moz-element\(#od-header-backdrop\)[\s\S]*?filter:\s*url\(#od-nav-liquid-glass\)\s+blur\(7px\)\s+saturate\(1\.4\)/,
    );
    expect(header).toMatch(
      /data-gecko-glass-density=['"]dense['"][\s\S]*?filter:\s*url\(#od-nav-liquid-glass\)\s+blur\(14px\)[\s\S]*?opacity:\s*0\.42/,
    );
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

  it('keeps the existing Next font variables and imports Evironn CSS after Tailwind directives', () => {
    const rootLayout = read('app/layout.tsx');
    const globals = read('app/globals.css');
    const header = read('styles/evironn/header.css');

    expect(rootLayout).toContain("from 'next/font/google'");
    expect(rootLayout).toMatch(/variable:\s*'--font-manrope'/);
    expect(rootLayout).toMatch(/variable:\s*'--font-unbounded'/);
    expect(rootLayout).toMatch(/variable:\s*'--font-anybody'/);
    expect(rootLayout).toMatch(
      /className=\{`\$\{manrope\.variable\} \$\{unbounded\.variable\} \$\{anybody\.variable\}`\}/,
    );
    expect(rootLayout.indexOf("import './globals.css';")).toBeLessThan(
      rootLayout.indexOf("import '../styles/evironn/tokens.css';"),
    );
    expect(rootLayout.indexOf("import '../styles/evironn/tokens.css';")).toBeLessThan(
      rootLayout.indexOf("import '../styles/evironn/header.css';"),
    );
    expect(rootLayout.indexOf("import '../styles/evironn/header.css';")).toBeLessThan(
      rootLayout.indexOf("import '../styles/evironn/footer.css';"),
    );
    expect(rootLayout.indexOf("import '../styles/evironn/footer.css';")).toBeLessThan(
      rootLayout.indexOf("import '../styles/evironn/not-found.css';"),
    );
    expect(globals).not.toContain("@import '../styles/evironn/");
    expect(globals).not.toContain('.od-mobile-menu');
    expect(header).toContain('.od-mobile-menu');

    const drawerBlocks = [...header.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)]
      .map((match) => match[1].trim())
      .filter((prelude) => prelude.includes('.od-mobile-menu'));
    expect(drawerBlocks.length).toBeGreaterThan(0);
    for (const prelude of drawerBlocks) {
      for (const selector of prelude.split(',')) {
        expect(selector.trim()).toMatch(/^#evironn-header\s+\.od-mobile-menu(?:\s|$)/);
      }
    }
  });

  it('composes one not-found header, view, and footer without RITM chrome', () => {
    const notFound = read('app/not-found.tsx');
    const footer = read('components/evironn/storefront-footer.tsx');
    expect(notFound.match(/<StorefrontHeader\b/g)).toHaveLength(1);
    expect(notFound.match(/<NotFoundView\s*\/>/g)).toHaveLength(1);
    expect(notFound.match(/<StorefrontFooter\s*\/>/g)).toHaveLength(1);
    expect(notFound).not.toMatch(/SiteHeader|SiteFooter|RITM|<Header\b|<Footer15\b/);
    expect(footer.startsWith("'use client';")).toBe(true);
  });

  it('records the original shell commit and complete source/target asset pairs', () => {
    const report = read('.superpowers/sdd/phase-2a-task-2-report.md');
    expect(report).toContain(
      '- Initial shell commit: `696e1f063ee9bbb7bcd30c0408ec3dd037ba6a5d` — initial Task 2 shell implementation.',
    );
    expect(report).toContain(
      '- Remediation commit: `20dc7f20866bd5c112ea45bdacc526e9b277e40f` — restored integration contracts and build-safe client boundary.',
    );
    expect((report.match(/`src\/assets\//g) ?? []).length).toBe(7);
    expect((report.match(/`public\/assets\//g) ?? []).length).toBe(9);
    expect(report).toContain('source/target pairs matched SHA-256 and size');
  });

  it('rejects multiline mobile drawer selectors that escape the header root', () => {
    const multilineFixture = `#evironn-header\n  .od-mobile-menu a,\n.od-mobile-menu .escape { color: red; }`;
    const drawerBlocks = [...multilineFixture.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)]
      .map((match) => match[1].trim())
      .filter((prelude) => prelude.includes('.od-mobile-menu'));

    expect(() => {
      for (const prelude of drawerBlocks) {
        for (const selector of prelude.split(',')) {
          expect(selector.trim()).toMatch(/^#evironn-header\s+\.od-mobile-menu(?:\s|$)/);
        }
      }
    }).toThrow();
  });
});
