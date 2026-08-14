import React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCombinationKey } from '@/lib/furniture-sku';
import type { FurnitureProductForSelection } from '@/lib/product-selection';

const REDIRECT = 'NEXT_REDIRECT_TEST';
const AUDITED_POSTER = '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png';

const mocks = vi.hoisted(() => ({
  getFurnitureProductBySlug: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT_TEST:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('@/lib/get-furniture-product', () => ({
  getFurnitureProductBySlug: mocks.getFurnitureProductBySlug,
}));
vi.mock('@/components/evironn/product/ProductPage', () => ({
  default: () => React.createElement('div', { 'data-testid': 'product-page-mock' }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));

const selection = (groupSlug: string, valueSlug: string, sortOrder: number) => ({
  optionGroup: { id: `group-${groupSlug}`, name: groupSlug, slug: groupSlug, sortOrder },
  optionValue: {
    id: `value-${valueSlug}`,
    optionGroupId: `group-${groupSlug}`,
    name: valueSlug,
    slug: valueSlug,
    swatchHex: null,
    sortOrder: 0,
  },
});

const canonicalPairs = [
  ['ivory-boucle', 'oak', 'EV-NWL-OAK', 'sku-ivory-pine'],
  ['ivory-boucle', 'walnut', 'EV-NWL-WAL', 'sku-ivory-walnut'],
  ['graphite', 'oak', 'EV-NWL-GPH-OAK', 'sku-charcoal-pine'],
  ['graphite', 'walnut', 'EV-NWL-GPH-WAL', 'sku-charcoal-walnut'],
  ['terracotta', 'oak', 'EV-NWL-TER-OAK', 'sku-terracotta-pine'],
  ['terracotta', 'walnut', 'EV-NWL-TER-WAL', 'sku-terracotta-walnut'],
] as const;

const nomaProduct = {
  id: 'product-noma',
  name: 'Noma Woven Lounge',
  description: 'Noma lounge chair description',
  category: { name: 'Armchairs', slug: 'armchairs' },
  optionGroups: [
    {
      optionGroup: { id: 'group-finish', name: 'Finish', slug: 'finish', sortOrder: 1 },
      values: ['oak', 'walnut'].map((slug, sortOrder) => ({
        optionValue: {
          id: `value-${slug}`,
          optionGroupId: 'group-finish',
          name: slug,
          slug,
          swatchHex: null,
          sortOrder,
        },
      })),
    },
    {
      optionGroup: { id: 'group-upholstery', name: 'Upholstery', slug: 'upholstery', sortOrder: 2 },
      values: ['ivory-boucle', 'graphite', 'terracotta'].map((slug, sortOrder) => ({
        optionValue: {
          id: `value-${slug}`,
          optionGroupId: 'group-upholstery',
          name: slug,
          slug,
          swatchHex: null,
          sortOrder,
        },
      })),
    },
  ],
  media: [
    { id: 'noma-image', kind: 'IMAGE' as const, url: AUDITED_POSTER, alt: 'Noma Woven Lounge', sortOrder: 0 },
    {
      id: 'noma-video',
      kind: 'TURN_TABLE_VIDEO' as const,
      url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
      alt: 'Noma 360',
      sortOrder: 0,
    },
    { id: 'noma-poster', kind: 'TURN_TABLE_POSTER' as const, url: AUDITED_POSTER, alt: 'Noma poster', sortOrder: 0 },
    {
      id: 'noma-fallback',
      kind: 'TURN_TABLE_FALLBACK' as const,
      url: AUDITED_POSTER,
      alt: 'Noma fallback',
      sortOrder: 0,
    },
  ],
  skus: canonicalPairs.map(([upholstery, finish, articleNumber, id]) => ({
    id,
    productId: 'product-noma',
    articleNumber,
    combinationKey: buildCombinationKey([
      { groupSlug: 'finish', valueSlug: finish },
      { groupSlug: 'upholstery', valueSlug: upholstery },
    ]),
    price: 89990,
    oldPrice: 109990,
    stock: 3,
    active: true,
    media: [],
    selections: [selection('finish', finish, 1), selection('upholstery', upholstery, 2)],
  })),
} satisfies FurnitureProductForSelection & {
  description: string;
  category: { name: string; slug: string };
};

let ProductPage: typeof import('@/app/(shop)/product/[slug]/page').default;
let generateMetadata: typeof import('@/app/(shop)/product/[slug]/page').generateMetadata;

beforeAll(async () => {
  const pageModule = await import('@/app/(shop)/product/[slug]/page');
  ProductPage = pageModule.default;
  generateMetadata = pageModule.generateMetadata;
});

beforeEach(() => {
  mocks.getFurnitureProductBySlug.mockReset();
  mocks.getFurnitureProductBySlug.mockResolvedValue(nomaProduct);
  mocks.redirect.mockClear();
  mocks.notFound.mockClear();
});

const pageInput = (slug = 'noma-woven-lounge', option?: string | string[]) => ({
  params: Promise.resolve({ slug }),
  searchParams: Promise.resolve(option === undefined ? {} : { option }),
});

async function expectRedirect(promise: Promise<unknown>, path: string) {
  await expect(promise).rejects.toThrow(`${REDIRECT}:${path}`);
  expect(mocks.redirect).toHaveBeenCalledWith(path);
}

function readPageChildren(page: React.JSX.Element): React.ReactElement[] {
  return React.Children.toArray(page.props.children) as React.ReactElement[];
}

describe('canonical showcase furniture product page', () => {
  it('redirects showcase route without option to default canonical option', async () => {
    await expectRedirect(
      ProductPage(pageInput()),
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
  });

  it.each([
    ['finish:oak', 'finish%3Aoak%2Cupholstery%3Aivory-boucle'],
    ['finish:walnut,upholstery:unknown', 'finish%3Awalnut%2Cupholstery%3Aivory-boucle'],
  ])('redirects partial or invalid option %s to %s', async (option, encodedOption) => {
    await expectRedirect(
      ProductPage(pageInput('noma-woven-lounge', option)),
      `/product/noma-woven-lounge?option=${encodedOption}`,
    );
  });

  it('renders ProductPage for canonical six-combination URL with matching DTO selection', async () => {
    const page = await ProductPage(pageInput('noma-woven-lounge', 'finish:walnut,upholstery:graphite'));
    const productPage = readPageChildren(page).find((child) => child.props && 'model' in child.props);
    const model = productPage?.props.model;

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(model.selected).toMatchObject({
      upholstery: 'charcoal',
      wood: 'walnut',
      canonicalOption: 'finish:walnut,upholstery:graphite',
      sku: { id: 'sku-charcoal-walnut', articleNumber: 'EV-NWL-GPH-WAL' },
    });
    expect(model.combinations).toHaveLength(6);
  });

  it('redirects every non-showcase slug to default showcase canonical URL', async () => {
    await expectRedirect(
      ProductPage(pageInput('other-chair')),
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
    expect(mocks.getFurnitureProductBySlug).toHaveBeenCalledWith('noma-woven-lounge');
  });

  it('redirects non-showcase slug with non-default option to showcase default canonical URL', async () => {
    await expectRedirect(
      ProductPage(pageInput('other-chair', 'finish:oak,upholstery:graphite')),
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
  });

  it('redirects unsupported option group to invalid-option default canonical URL', async () => {
    await expectRedirect(
      ProductPage(pageInput('noma-woven-lounge', 'color:red')),
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it.each([
    ['missing showcase product', null],
    ['incomplete six-SKU contract', { ...nomaProduct, skus: nomaProduct.skus.slice(1) }],
    ['incomplete turntable contract', { ...nomaProduct, media: nomaProduct.media.slice(0, 1) }],
  ])('calls notFound for %s', async (_label, product) => {
    mocks.getFurnitureProductBySlug.mockResolvedValueOnce(product);
    await expect(ProductPage(pageInput())).rejects.toThrow('NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalled();
  });

  it('builds canonical metadata from DTO with audited poster and no redirect', async () => {
    const metadata = await generateMetadata(pageInput('other-chair', 'finish:walnut,upholstery:graphite'));

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(metadata.title).toBe('\u041a\u0440\u0435\u0441\u043b\u043e Graphite');
    expect(metadata.description).toBe(nomaProduct.description);
    expect(metadata.alternates?.canonical).toBe(
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Agraphite',
    );
    expect(metadata.openGraph).toMatchObject({
      url: '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Agraphite',
      images: [{ url: expect.stringContaining(AUDITED_POSTER) }],
    });
    expect(metadata.twitter).toMatchObject({ images: [expect.stringContaining(AUDITED_POSTER)] });
  });

  it('emits real Product JSON-LD with six offers and canonical BreadcrumbList URLs', async () => {
    const page = await ProductPage(pageInput('noma-woven-lounge', 'finish:walnut,upholstery:graphite'));
    const children = readPageChildren(page);
    const scripts = children.filter((child) => child.type === 'script');
    const jsonLd = scripts.map((script) => JSON.parse(script.props.dangerouslySetInnerHTML.__html));
    const productJsonLd = jsonLd.find((item) => item['@type'] === 'Product');
    const breadcrumbJsonLd = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
    const productPage = children.find((child) => child.props && 'model' in child.props);
    const model = productPage?.props.model;

    expect(productJsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '\u041a\u0440\u0435\u0441\u043b\u043e Graphite',
      image: [`http://localhost:3000${AUDITED_POSTER}`],
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'RUB',
        lowPrice: 89990,
        highPrice: 89990,
        offerCount: 6,
        availability: 'https://schema.org/InStock',
        url: 'http://localhost:3000/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Agraphite',
      },
    });
    expect(breadcrumbJsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { item: 'http://localhost:3000/' },
        { item: 'http://localhost:3000/catalog' },
        { item: 'http://localhost:3000/catalog?category=armchairs' },
        {
          item: 'http://localhost:3000/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Agraphite',
        },
      ],
    });
    expect(model.combinations).toHaveLength(6);
    expect(model.combinations).toEqual(
      expect.arrayContaining(
        nomaProduct.skus.map((sku) =>
          expect.objectContaining({ sku: expect.objectContaining({ price: sku.price, oldPrice: sku.oldPrice }) }),
        ),
      ),
    );
  });
});
