import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '..');

function readApplicationFile(path: string) {
  return readFileSync(resolve(repositoryRoot, path), 'utf8');
}

describe('approved storefront application', () => {
  it('does not retain inherited hero provenance markers in product source', () => {
    const forbiddenMarker = ['furni', '-hero'].join('');
    const sourceRoot = resolve(repositoryRoot, 'src');
    const files: string[] = [];

    const collectFiles = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) {
          collectFiles(path);
        } else {
          files.push(path);
        }
      }
    };

    collectFiles(sourceRoot);

    for (const path of files) {
      const relativePath = path.slice(sourceRoot.length + 1);
      expect(relativePath.toLowerCase()).not.toContain(forbiddenMarker);
      expect(readFileSync(path).toString('utf8')).not.toContain(
        forbiddenMarker,
      );
    }
  });

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

  it('does not retain styles for the removed hero font selector', () => {
    const heroStyles = readApplicationFile('src/components/Hero.css');
    const removedSelector = ['furni', '-hero-font-selector'].join('');

    expect(heroStyles).not.toContain(removedSelector);
  });

  it('loads the approved local Golos Text family', () => {
    const styles = readApplicationFile('src/index.css');

    for (const asset of [
      'src/assets/golos-text-cyrillic.woff2',
      'src/assets/golos-text-latin.woff2',
    ]) {
      expect(existsSync(resolve(repositoryRoot, asset)), asset).toBe(true);
    }
    expect(styles).toContain("font-family: 'Golos Text'");
    expect(styles).toContain('assets/golos-text-cyrillic.woff2');
    expect(styles).toContain('assets/golos-text-latin.woff2');
    expect(styles).toContain("--ev-font-body: 'Golos Text'");
    expect(styles).not.toContain("--ev-font-body: 'Evironn Header Sans'");
  });

  it('ships the local Fraunces face used by the footer wordmark', () => {
    const styles = readApplicationFile('src/index.css');

    expect(
      existsSync(resolve(repositoryRoot, 'src/assets/fraunces-latin.woff2')),
    ).toBe(true);
    expect(styles).toContain("font-family: 'Fraunces'");
    expect(styles).toContain('assets/fraunces-latin.woff2');
  });
});
