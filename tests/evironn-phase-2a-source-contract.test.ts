import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

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

function readNamedImports(source: string): Array<{ name: string; module: string }> {
  const sourceFile = ts.createSourceFile('evironn-source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports: Array<{ name: string; module: string }> = [];

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !node.importClause?.namedBindings) {
      return;
    }

    if (!ts.isNamedImports(node.importClause.namedBindings)) {
      return;
    }

    const module = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : '';
    for (const element of node.importClause.namedBindings.elements) {
      imports.push({
        name: element.name.text,
        module,
      });
    }
  });

  return imports;
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

    const importedSections = readNamedImports(home)
      .filter(({ name }) => sectionNames.includes(name))
      .map(({ name }) => name);

    expect(importedSections).toEqual(sectionNames);
    expect(
      readNamedImports(home)
        .filter(({ name }) => sectionNames.includes(name))
        .every(({ module }) => module.startsWith('@/components/evironn/')),
    ).toBe(true);

    expect(home).not.toMatch(/prisma|auth|wishlist|findProducts|force-dynamic|cart-store/);

    const renderOrder = sectionNames.map((name) => {
      const match = home.match(new RegExp(`<${name}\\b`));
      return match?.index ?? -1;
    });
    expect(renderOrder.every((index) => index >= 0)).toBe(true);
    expect(renderOrder).toEqual([...renderOrder].sort((left, right) => left - right));
    expect(home).toMatch(/<main\s+id=["']main-content["']/);
    expect(home.match(/<main\s+id=["']main-content["']/g)).toHaveLength(1);
    expect(home).toContain('<Hero />');
    expect(home).toContain('<FurnitureCategorySection />');
    expect(home).toContain('<InteractiveFurnitureCards />');
    expect(home).toContain('<EditorialStatement />');
    expect(home).toContain('<NatureSection />');
    expect(home).toContain('<BenefitsShowcaseSection />');
    expect(home).toContain('<FurnitureWorksParallax />');
    expect(home).toContain('<InstagramFollowSection />');
  });

  it('imports each Task 4 stylesheet exactly once at the root integration point', () => {
    const layout = readSource('app/layout.tsx');
    const homeStyles = [
      'furniture-editorial-sections',
      'interactive-furniture-cards',
      'editorial-statement',
      'nature-section',
      'benefits-showcase-section',
      'instagram-follow-section',
    ];

    for (const style of homeStyles) {
      expect(layout.match(new RegExp(`styles/evironn/home/${style}\\.css`, 'g'))).toHaveLength(1);
    }
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
