import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const paths = [
  'components/evironn/cart/cart-primitives.tsx',
  'components/evironn/cart/cart-variant-a.tsx',
  'components/evironn/cart/use-cart-variant-a.ts',
  'styles/evironn/CartPrimitives.css',
  'styles/evironn/CartVariantA.css',
];

function source(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

describe('Evironn Cart Variant A source boundary', () => {
  it('contains exact cart files and CSS imports', () => {
    for (const path of paths) expect(existsSync(path), path).toBe(true);

    expect(source(paths[0])).toContain("import '../../../styles/evironn/CartPrimitives.css'");
    expect(source(paths[1])).toContain("import '../../../styles/evironn/CartVariantA.css'");
    expect(source(paths[0])).toMatch(
      /export function (Steps|QtyStepper|PromoField|SummaryRows|UndoBar|EmptyCart|SupportLink)/,
    );
    expect(source(paths[1])).toContain('cart-a__grid');
  });

  it('uses production cart state and forbids clone controllers and client checkout math', () => {
    const production = paths.map(source).join('\n');
    expect(production).toContain('useCartStore');
    expect(production).toContain('addToWishlist');
    expect(production).toContain('validateCoupon');
    expect(production).not.toMatch(/useCart\(|from ['"][^'"]*useCart|cartState|CATALOG_PRODUCTS|PROMO_CODES/);
    expect(production).not.toMatch(
      /DeliveryPicker|PaymentRow|FREE_\w*SHIPPING|SHIP_COST|DELIVERY_OPTIONS|PAYMENT_METHODS/,
    );
    expect(production).not.toContain('productVariantId');
    expect(production).toContain('href="/checkout"');
    expect(production).not.toMatch(/Math\.(round|floor|ceil)\([^)]*percent|shipping|deliveryCost/);
  });

  it('exposes canonical props/actions and server snapshot summary fields', () => {
    const variant = source('components/evironn/cart/cart-variant-a.tsx');
    const hook = source('components/evironn/cart/use-cart-variant-a.ts');
    expect(variant).toContain('related: CatalogBCard[]');
    expect(variant).toContain('initialWishlistedIds: string[]');
    for (const method of [
      'step',
      'remove',
      'clear',
      'undo',
      'saveToWishlist',
      'addRelated',
      'applyCoupon',
      'clearCoupon',
    ])
      expect(hook).toContain(`${method}`);
    const presentation = `${variant}\n${source(paths[0])}`;
    for (const field of ['compareAtSubtotal', 'saleDiscount', 'couponDiscount', 'total'])
      expect(presentation).toContain(field);
    expect(variant).toContain('canCheckout');
    expect(variant).toContain('href="/checkout"');
    for (const label of [
      'Дождитесь загрузки корзины.',
      'Не удалось загрузить корзину. Обновите страницу.',
      'В корзине есть товары, которых нет в наличии.',
      'В корзине есть устаревшие позиции. Добавьте их заново.',
      'Количество некоторых товаров превышает доступный остаток.',
      'Количество товара в одной позиции не может превышать 99.',
    ])
      expect(variant).toContain(label);
    expect(variant).not.toContain('role="radiogroup"');
    expect(variant).toContain('aria-label={`Добавить ${product.name} в корзину`}');
    const page = readFileSync('app/(shop)/cart/page.tsx', 'utf8');
    expect(`${variant}\n${page}`).toContain('relatedProductHref');
    expect(page).toContain('relatedProductHref(card)');
    expect(page).toContain('SHOWCASE_PRODUCT_SLUG');
    expect(page).toMatch(/slug:\s*SHOWCASE_PRODUCT_SLUG/);
    expect(page).not.toContain('?sku=');
  });

  it('builds related cards from canonical furniture data', () => {
    const page = readFileSync('app/(shop)/cart/page.tsx', 'utf8');
    expect(page).toContain('furnitureProductCardInclude');
    expect(page).toContain('buildFurnitureProductCardData');
    expect(page).toContain('buildCatalogBCard');
    expect(`${page}\n${source('components/evironn/cart/cart-variant-a.tsx')}`).toContain('primarySkuId');
    expect(source('components/evironn/cart/cart-variant-a.tsx')).toContain(
      'disabled={!product.primarySkuId || product.soldOut}',
    );
  });

  it('keeps display-only swatches and checkout controls clone-styled', () => {
    const variant = source('components/evironn/cart/cart-variant-a.tsx');
    const css = source('styles/evironn/CartVariantA.css');

    expect(variant).toContain('role="radio"');
    expect(variant).toContain('disabled');
    expect(css).toContain('.cart-a__swatches button');
    expect(css).toContain('.cart-a__mobile-bar a');
    expect(css).not.toContain('.cart-a__swatches span');
    expect(css).not.toContain('.cart-a__mobile-bar button');
    expect(createHash('sha256').update(css).digest('hex')).toBe(
      '8a83377e890a60e31079bda43eef5ba32cabfc853904731042258308e746c0db',
    );
  });

  it('handles rejected clear, related-add, and undo mutations at the click boundary', () => {
    const variant = source('components/evironn/cart/cart-variant-a.tsx');

    expect(variant).toContain('onClick={() => void actions.clear().catch(() => undefined)}');
    expect(variant).toMatch(
      /onClick=\{\(\) =>\s*product\.primarySkuId && void actions\.addRelated\(product\.primarySkuId\)\.catch\(\(\) => undefined\)\s*\}/,
    );
    expect(variant).toMatch(/<UndoBar[\s\S]*onUndo=\{\(\) => void actions\.undo\(\)\.catch\(\(\) => undefined\)\}/);
  });

  it('keeps the cart loading skeleton above the shared footer', () => {
    const loading = source('app/(shop)/cart/loading.tsx');
    const layout = source('app/layout.tsx');
    const css = source('styles/evironn/CartLoading.css');

    expect(loading).toContain('className="cart-loading mx-auto max-w-[1240px]');
    expect(loading).toContain('aria-hidden');
    expect(layout).toContain("import '../styles/evironn/CartLoading.css';");
    expect(css).toMatch(/\.cart-loading\s*\{[\s\S]*min-height:\s*100svh;[\s\S]*min-height:\s*100dvh;[\s\S]*\}/);
  });
});
