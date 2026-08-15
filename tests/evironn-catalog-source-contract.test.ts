import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync('app/(shop)/catalog/page.tsx', 'utf8');
const shellSource = readFileSync('components/evironn/catalog/catalog-variant-b.tsx', 'utf8');
const adapterSource = readFileSync('components/evironn/catalog/catalog-variant-b-adapter.ts', 'utf8');
const cardSource = readFileSync('components/evironn/catalog/catalog-card.tsx', 'utf8');
const primitiveSource = readFileSync('components/evironn/catalog/catalog-primitives.tsx', 'utf8');
const productionSource = [routeSource, shellSource, adapterSource, cardSource, primitiveSource].join('\n');
const legacyCatalogRoutes = ['a', 'b', 'c'].map((suffix) => ['catalog', suffix].join('-'));
const legacyCatalogRouteSourcePattern = new RegExp(`["'\`]\\/(${legacyCatalogRoutes.join('|')})(?:[/?"'\`])`);
const legacyCatalogPathPattern = new RegExp(`(^|\\/)(${legacyCatalogRoutes.join('|')})(\\/|\\.|$)`);

function productionFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? productionFiles(path) : [path.replaceAll('\\', '/')];
  });
}

function assertImport(source: string, imported: string, modulePath: string): void {
  const escapedModule = modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedImport = imported.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  expect(source).toMatch(
    new RegExp(`import\\s+(?:type\\s+)?\\{[^}]*\\b${escapedImport}\\b[^}]*\\}\\s+from\\s+['"]${escapedModule}['"]`),
  );
}

describe('Evironn catalog source boundary', () => {
  it('keeps catalog route on canonical server data and Variant B files', () => {
    assertImport(routeSource, 'findProducts', '@/lib/find-products');
    assertImport(routeSource, 'getWishlistProductIds', '@/lib/wishlist');
    assertImport(routeSource, 'wishlistCookieName', '@/lib/wishlist-cookie');
    assertImport(routeSource, 'auth', '@/auth');
    assertImport(routeSource, 'cookies', 'next/headers');
    assertImport(routeSource, 'buildCatalogBModel', '@/components/evironn/catalog/catalog-variant-b-adapter');
    assertImport(routeSource, 'CatalogVariantB', '@/components/evironn/catalog/catalog-variant-b');
    assertImport(shellSource, 'CatalogCard', '@/components/evironn/catalog/catalog-card');
    assertImport(shellSource, 'CheckRow', '@/components/evironn/catalog/catalog-primitives');
    assertImport(shellSource, 'CatalogBModel', '@/components/evironn/catalog/catalog-variant-b-adapter');
    assertImport(cardSource, 'CatalogBCard', '@/components/evironn/catalog/catalog-variant-b-adapter');
    expect(shellSource).toContain('initialWishlistedIds');
    expect(shellSource).toContain('toggleWishlist');
    expect(cardSource).toContain('wishlisted');
    expect(cardSource).toContain('onWishlistToggle');
    expect(adapterSource).toContain('buildCatalogBCard');
  });

  it('binds each required symbol to its canonical module in one import statement', () => {
    expect(() =>
      assertImport("import { findProducts } from 'wrong-module';", 'findProducts', '@/lib/find-products'),
    ).toThrow();
  });

  it('forbids mock data, legacy catalog presentation, and variant routes', () => {
    expect(productionSource).not.toMatch(
      new RegExp(
        `CATALOG_PRODUCTS|CatalogVariantA|CatalogVariantC|${legacyCatalogRouteSourcePattern.source}|CatalogProductCard|FilterSidebar|MobileFilterDrawer|CatalogHero|EmptyCatalog`,
      ),
    );
    expect(productionFiles('app').filter((path) => legacyCatalogPathPattern.test(path))).toEqual([]);
  });

  it('routes every catalog card through the single showcase destination', () => {
    expect(adapterSource).toContain('import { SHOWCASE_DEFAULT_PRODUCT_PATH }');
    expect(adapterSource).toMatch(/href:\s*SHOWCASE_DEFAULT_PRODUCT_PATH/);
    expect(adapterSource).toMatch(/href:\s*SHOWCASE_DEFAULT_PRODUCT_PATH,\s*media:/s);
    expect(cardSource).toContain('href={product.href}');
    expect(cardSource).not.toMatch(/href=\{[^}]*product\.slug/);
  });
});
