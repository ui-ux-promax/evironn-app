import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getFurnitureProductBySlug: vi.fn(),
  capturedProps: null as any,
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  prisma: {},
  auth: vi.fn(),
}));

vi.mock('@/lib/get-furniture-product', () => ({
  getFurnitureProductBySlug: mocks.getFurnitureProductBySlug,
}));
vi.mock('@/components/shared/product/product-view', () => ({
  ProductView: (props: any) => {
    mocks.capturedProps = props;
    return React.createElement('div', { 'data-testid': 'product-view-mock' });
  },
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma-client', () => ({ prisma: mocks.prisma }));

type OptionValue = {
  optionValue: {
    id: string;
    optionGroupId: string;
    name: string;
    slug: string;
    swatchHex: string;
    sortOrder: number;
  };
};

const optionGroup = (id: string, slug: string, name: string, sortOrder: number) => ({
  optionGroup: { id, name, slug, sortOrder },
  values: [] as OptionValue[],
});

const oakOptionGroup = optionGroup('finish-id', 'finish', 'Отделка', 0);
oakOptionGroup.values = [
  {
    optionValue: {
      id: 'oak-id',
      optionGroupId: 'finish-id',
      name: 'Натуральный дуб',
      slug: 'oak',
      swatchHex: '#c8a97e',
      sortOrder: 0,
    },
  },
  {
    optionValue: {
      id: 'walnut-id',
      optionGroupId: 'finish-id',
      name: 'Орех',
      slug: 'walnut',
      swatchHex: '#6b4a30',
      sortOrder: 1,
    },
  },
];
const upholsteryOptionGroup = optionGroup('upholstery-id', 'upholstery', 'Обивка', 1);
upholsteryOptionGroup.values = [
  {
    optionValue: {
      id: 'ivory-id',
      optionGroupId: 'upholstery-id',
      name: 'Кремовая букле',
      slug: 'ivory-boucle',
      swatchHex: '#efe7d8',
      sortOrder: 0,
    },
  },
];

const optionGroupRef = (group: typeof oakOptionGroup) => group.optionGroup;
const optionValueRef = (group: typeof oakOptionGroup, index: number) => group.values[index].optionValue;
const sku = (id: string, articleNumber: string, finish: string, price: number, stock: number) => ({
  id,
  productId: 'noma-id',
  articleNumber,
  combinationKey: `finish=${finish}|upholstery=ivory-boucle`,
  price,
  oldPrice: finish === 'oak' ? 139000 : null,
  stock,
  active: true,
  selections: [
    {
      optionGroup: optionGroupRef(oakOptionGroup),
      optionValue: finish === 'oak' ? optionValueRef(oakOptionGroup, 0) : optionValueRef(oakOptionGroup, 1),
    },
    { optionGroup: optionGroupRef(upholsteryOptionGroup), optionValue: optionValueRef(upholsteryOptionGroup, 0) },
  ],
  media: [],
});

const nomaProduct = {
  id: 'noma-id',
  name: 'Noma Woven Lounge',
  slug: 'noma-woven-lounge',
  description: 'Глубокое lounge-кресло с объёмной букле и съёмным чехлом.',
  specs: { Материал: 'Букле, дуб', Ширина: '84 см' },
  active: true,
  category: { name: 'Кресла', slug: 'armchairs' },
  rooms: [],
  optionGroups: [oakOptionGroup, upholsteryOptionGroup],
  skus: [sku('sku-oak', 'EV-NWL-OAK', 'oak', 124000, 3), sku('sku-wal', 'EV-NWL-WAL', 'walnut', 129000, 2)],
  media: [
    {
      id: 'image-id',
      kind: 'IMAGE',
      url: '/assets/products/03-ivory-lounge-idle.webp',
      alt: 'Noma Woven Lounge',
      sortOrder: 0,
    },
    {
      id: 'video-id',
      kind: 'TURN_TABLE_VIDEO',
      url: '/assets/products/03-ivory-lounge-turntable.mp4',
      alt: 'Noma Woven Lounge 360',
      sortOrder: 0,
    },
    {
      id: 'poster-id',
      kind: 'TURN_TABLE_POSTER',
      url: '/assets/products/03-ivory-lounge-turntable-alpha-poster.png',
      alt: 'Noma Woven Lounge 360 poster',
      sortOrder: 0,
    },
    {
      id: 'fallback-id',
      kind: 'TURN_TABLE_FALLBACK',
      url: '/assets/products/03-ivory-lounge-cutout.png',
      alt: 'Noma Woven Lounge static view',
      sortOrder: 0,
    },
  ],
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
  mocks.capturedProps = null;
  mocks.notFound.mockClear();
});

function captureProductViewProps(page: React.JSX.Element) {
  const children = React.Children.toArray(page.props.children) as React.ReactElement[];
  const productView = children.find((child) => child.props && 'selection' in child.props);
  mocks.capturedProps = productView?.props ?? null;
}

describe('canonical furniture product page', () => {
  it('removes legacy product and cross-scope dependencies from the page boundary', () => {
    const source = [
      'app/(shop)/product/[slug]/page.tsx',
      'components/shared/product/product-view.tsx',
      'components/shared/product/purchase-panel.tsx',
    ]
      .map((file) => readFileSync(join(process.cwd(), file), 'utf8'))
      .join('\n');

    expect(source).not.toMatch(
      /getProductBySlug|productCardInclude|buildProductCardData|colorways|ProductVariant|ProductColorway|ProductImage|@\/auth|wishlist|review|useCartStore|axios|\/checkout/,
    );
  });

  it('resolves the requested canonical SKU and preserves product-level turntable media', async () => {
    const page = await ProductPage({
      params: Promise.resolve({ slug: 'noma-woven-lounge' }),
      searchParams: Promise.resolve({ option: 'finish:walnut,upholstery:ivory-boucle' }),
    });
    captureProductViewProps(page);

    expect(mocks.capturedProps.selection.sku.articleNumber).toBe('EV-NWL-WAL');
    expect(mocks.capturedProps.selection.canonicalSelection).toEqual({
      finish: 'walnut',
      upholstery: 'ivory-boucle',
    });
    expect(mocks.capturedProps.selection.turntable).toEqual({
      videoUrl: '/assets/products/03-ivory-lounge-turntable.mp4',
      posterUrl: '/assets/products/03-ivory-lounge-turntable-alpha-poster.png',
      fallbackUrl: '/assets/products/03-ivory-lounge-cutout.png',
      alt: 'Noma Woven Lounge 360',
    });
  });

  it('falls back deterministically for an invalid option and not-found cases', async () => {
    const page = await ProductPage({
      params: Promise.resolve({ slug: 'noma-woven-lounge' }),
      searchParams: Promise.resolve({ option: 'finish:black' }),
    });
    captureProductViewProps(page);
    expect(mocks.capturedProps.selection.sku.articleNumber).toBe('EV-NWL-OAK');

    mocks.getFurnitureProductBySlug.mockResolvedValueOnce(null);
    await expect(
      ProductPage({ params: Promise.resolve({ slug: 'missing' }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('NOT_FOUND');

    mocks.getFurnitureProductBySlug.mockResolvedValueOnce({ ...nomaProduct, skus: [] });
    await expect(
      ProductPage({ params: Promise.resolve({ slug: 'empty' }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('canonicalizes metadata and emits furniture Product and BreadcrumbList JSON-LD', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'noma-woven-lounge' }),
      searchParams: Promise.resolve({ option: 'finish:walnut,upholstery:ivory-boucle' }),
    });
    expect(metadata.title).toBe('Noma Woven Lounge');
    expect(metadata.description).toBe(nomaProduct.description);
    const openGraphImages = metadata.openGraph?.images as Array<{ url: string }> | undefined;
    expect(openGraphImages?.[0]).toMatchObject({
      url: expect.stringContaining('/assets/products/03-ivory-lounge-idle.webp'),
    });
    expect(metadata.alternates?.canonical).toBe(
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );

    const page = await ProductPage({
      params: Promise.resolve({ slug: 'noma-woven-lounge' }),
      searchParams: Promise.resolve({ option: 'finish:walnut,upholstery:ivory-boucle' }),
    });
    const children = React.Children.toArray((page as React.ReactElement).props.children) as React.ReactElement[];
    const jsonLd = children
      .filter((child) => child.type === 'script')
      .map((script) => JSON.parse(script.props.dangerouslySetInnerHTML.__html));
    const productJsonLd = jsonLd.find((item) => item['@type'] === 'Product');
    const breadcrumbJsonLd = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');

    expect(productJsonLd.image).toEqual([
      expect.stringContaining('/assets/products/03-ivory-lounge-idle.webp'),
      expect.stringContaining('/assets/products/03-ivory-lounge-cutout.png'),
    ]);
    expect(productJsonLd.offers).toMatchObject({
      lowPrice: 124000,
      highPrice: 129000,
      offerCount: 2,
      availability: 'https://schema.org/InStock',
    });
    expect(productJsonLd.aggregateRating).toBeUndefined();
    expect(breadcrumbJsonLd.itemListElement.map((item: { item: string }) => item.item)).toEqual([
      expect.stringMatching(/\/$/),
      expect.stringContaining('/catalog'),
      expect.stringContaining('/catalog?category=armchairs'),
      expect.stringContaining('/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle'),
    ]);
  });
});
