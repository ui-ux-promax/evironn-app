import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '..');

function readApplicationFile(path: string) {
  return readFileSync(resolve(repositoryRoot, path), 'utf8');
}

describe('approved storefront application', () => {
  it('exports only the approved public routes', async () => {
    const { publicRoutes } = await import('../src/routes');

    expect(publicRoutes).toEqual(['/', '/product']);
  });

  it('uses the route manifest to select home, product, and not-found views', () => {
    const source = readApplicationFile('src/App.tsx');

    expect(source).toMatch(
      /import\s*\{\s*publicRoutes\s*\}\s*from\s*['"]\.\/routes['"]/,
    );
    expect(source).toContain('publicRoutes');
    expect(source).toContain('<HomePage');
    expect(source).toContain('<ProductPage');
    expect(source).toContain('<NotFoundPage');
  });

  it('composes the approved home from semantic storefront sections', () => {
    const source = readApplicationFile('src/pages/HomePage.tsx');

    for (const section of [
      'Hero',
      'CategoryShowcase',
      'FeaturedProducts',
      'EditorialStatement',
      'InteriorStory',
      'InspirationGallery',
      'SiteFooter',
    ]) {
      expect(source).toContain(`<${section}`);
    }
  });

  it('composes the approved product experience', () => {
    const page = readApplicationFile('src/pages/ProductPage.tsx');
    const source = readApplicationFile('src/components/ProductExperience.tsx');

    for (const shellPart of ['SiteHeader', 'ProductExperience', 'SiteFooter']) {
      expect(page).toContain(`<${shellPart}`);
    }
    for (const feature of [
      'UPHOLSTERY_OPTIONS',
      'WOOD_OPTIONS',
      'product-page__accordions',
      'is360Active',
      'document.documentElement',
      '<FeaturedProducts',
    ]) {
      expect(source).toContain(feature);
    }
    expect(source).toContain('cartCount');
  });

  it('ships semantic replacements for inherited implementation names', () => {
    for (const path of [
      'src/components/CategoryShowcase.tsx',
      'src/components/SiteFooter.tsx',
      'src/hooks/useRevealAnimation.ts',
    ]) {
      expect(existsSync(resolve(repositoryRoot, path)), path).toBe(true);
    }
    expect(
      readApplicationFile('src/components/CategoryShowcase.tsx'),
    ).toContain('export function InteriorStory');
  });

  it('does not ship experimental page modules or unused components', () => {
    for (const path of [
      'src/pages/Product3DPage.tsx',
      'src/pages/Product360OptionsPage.tsx',
      'src/components/Benefits.tsx',
      'src/components/HeroFontSelector.tsx',
    ]) {
      expect(existsSync(resolve(repositoryRoot, path)), path).toBe(false);
    }
  });
});
