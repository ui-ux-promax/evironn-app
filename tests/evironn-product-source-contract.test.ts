import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const routePath = join(root, 'app/(shop)/product/[slug]/page.tsx');
const handoffPath = join(root, 'components/evironn/product/product-page-handoff.tsx');
const temporaryPdpFiles = [
  'components/shared/product/product-view.tsx',
  'components/shared/product/purchase-panel.tsx',
  'components/shared/product/product-media-stage.tsx',
  'components/shared/product/product-media-stage.module.css',
];

function filesUnder(directory: string): string[] {
  if (!statSync(directory).isDirectory()) return [directory];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe('Evironn product route source contract', () => {
  it('keeps product route boundary on canonical server DTO and clone ProductPage handoff', () => {
    const source = readFileSync(routePath, 'utf8');
    const handoffSource = readFileSync(handoffPath, 'utf8');
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);

    expect(imports).toContain('@/lib/get-furniture-product');
    expect(imports).toContain('@/lib/showcase-product');
    expect(imports).toContain('@/components/evironn/product/product-page-handoff');
    expect(imports).toContain('next/navigation');
    expect(imports).toContain('@/lib/seo');
    expect(source).toContain('SHOWCASE_PRODUCT_SLUG');
    expect(source).toContain('buildShowcaseProductPageDto');
    expect(source).toContain('redirect');
    expect(source).toContain('notFound');
    expect(source).not.toMatch(
      /ProductView|PurchasePanel|ProductMediaStage|useCartStore|setCartCount|addProductToCart|@\/auth|wishlist|review|checkout|axios|fashion/i,
    );
    expect(source).not.toContain('@/components/shared/product');
    expect(handoffSource).toContain("import ProductPage from './ProductPage'");
    expect(handoffSource).toContain("from './product-page-loading-fallback'");
  });

  it('keeps clone ProductPage and its scoped CSS imports present', () => {
    const productPageSource = readFileSync(join(root, 'components/evironn/product/ProductPage.tsx'), 'utf8');
    const layoutSource = readFileSync(join(root, 'app/layout.tsx'), 'utf8');

    expect(productPageSource).toContain("from './productPageState'");
    expect(productPageSource).toContain("from './productVideo360'");
    expect(statSync(join(root, 'components/evironn/product/ProductPage.tsx')).isFile()).toBe(true);
    expect(statSync(join(root, 'styles/evironn/ProductPage.css')).isFile()).toBe(true);
    expect(statSync(join(root, 'styles/evironn/ProductPage.next.css')).isFile()).toBe(true);
    expect(layoutSource).toContain("'../styles/evironn/ProductPage.css'");
    expect(layoutSource).toContain("'../styles/evironn/ProductPage.next.css'");
    expect(productPageSource).toContain('addCartItem({ skuId: currentCombination.sku.id, quantity: 1 })');
    expect(productPageSource).not.toContain('product-page-phase-3-notice');
    expect(productPageSource).not.toContain('Добавление в корзину будет доступно после завершения пилота');
  });

  it('has no product variant or demo routes under App Router', () => {
    const productRoutes = filesUnder(join(root, 'app'))
      .map((path) => relative(join(root, 'app'), path).replaceAll('\\', '/'))
      .filter((path) => /^\(shop\)\/product\//i.test(path));

    expect(productRoutes).toEqual(['(shop)/product/[slug]/loading.tsx', '(shop)/product/[slug]/page.tsx']);
  });

  it('has no production references to temporary inherited PDP presentation', () => {
    const productionFiles = ['app', 'components', 'lib', 'services']
      .map((directory) => filesUnder(join(root, directory)))
      .flat()
      .filter((path) => !path.includes(`${join(root, 'tests')}${relative(root, root)}`));
    const forbiddenImports = temporaryPdpFiles.map((path) =>
      path.replaceAll('\\', '/').replace(/\.tsx$|\.module\.css$/, ''),
    );
    const references = productionFiles.flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      return forbiddenImports
        .filter((forbiddenImport) => source.includes(forbiddenImport))
        .map(() => relative(root, path));
    });

    expect(references).toEqual([]);
  });
});
