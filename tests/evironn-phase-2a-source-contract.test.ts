import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();

function readSource(relativePath: string): string {
  const absolutePath = path.join(repositoryRoot, relativePath);

  expect(fs.existsSync(absolutePath), `Expected source file to exist: ${relativePath}`).toBe(true);
  return fs.readFileSync(absolutePath, 'utf8');
}

function readExistingEvironnSources(): string {
  const directory = path.join(repositoryRoot, 'components/evironn');

  if (!fs.existsSync(directory)) {
    return '';
  }

  return fs
    .readdirSync(directory, { recursive: true })
    .filter((entry): entry is string => typeof entry === 'string' && /\.(?:css|tsx?|jsx?)$/.test(entry))
    .map((entry) => fs.readFileSync(path.join(directory, entry), 'utf8'))
    .join('\n');
}

describe('Evironn Phase 2A migration source contract', () => {
  it('preserves the storefront services and replaces the inherited shell', () => {
    const layout = readSource('app/(shop)/layout.tsx');

    expect(layout).toMatch(/import\s+\{[^}]*buildStorefrontJsonLd[^}]*\}\s+from\s+['"]@\/lib\/seo['"]/);
    expect(layout.match(/buildStorefrontJsonLd\(\)/g)).toHaveLength(1);
    expect(layout).toMatch(
      /import\s+\{[^}]*VerificationGateHost[^}]*\}\s+from\s+['"]@\/components\/shared\/auth\/verification-gate-host['"]/,
    );
    expect(layout.match(/<VerificationGateHost\s*\/?/g)).toHaveLength(1);
    expect(layout).toContain('StorefrontHeader');
    expect(layout).toContain('StorefrontFooter');
    expect(layout).not.toMatch(/SiteHeader|SiteFooter|ritm-logo\.svg/);
  });

  it('keeps the future Evironn home section order and removes inherited reads', () => {
    const home = readSource('app/(shop)/page.tsx');
    const sectionNames = [
      'Hero',
      'FurnitureCategorySection',
      'InteractiveFurnitureCards',
      'EditorialStatement',
      'NatureSection',
      'BenefitsShowcaseSection',
      'FurnitureWorksParallax',
      'InstagramFollowSection',
    ];

    let previousIndex = -1;
    for (const name of sectionNames) {
      const currentIndex = home.indexOf(name);
      expect(currentIndex, `Expected ${name} in app/(shop)/page.tsx`).toBeGreaterThan(previousIndex);
      previousIndex = currentIndex;
    }

    expect(home).not.toMatch(/prisma|auth|wishlist|findProducts|force-dynamic|cart-store/);
  });

  it('keeps Evironn sources free of browser/archive and placeholder route references', () => {
    const source = [
      readSource('app/(shop)/layout.tsx'),
      readSource('app/(shop)/page.tsx'),
      readExistingEvironnSources(),
    ].join('\n');

    expect(source).not.toMatch(/window\.location|import\.meta\.url|href="#"/);
    expect(source).not.toMatch(/\/catalog-a|\/catalog-c|\/login-variants/);
    expect(source).not.toContain('D:\\Новая папка (2)\\evironn-clone');
  });
});
