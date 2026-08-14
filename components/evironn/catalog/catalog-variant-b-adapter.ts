import type { CatalogResult } from '@/lib/find-products';
import type { FurnitureProductCardData } from '@/lib/furniture-product-summary';
import { SHOWCASE_DEFAULT_PRODUCT_PATH } from '@/components/evironn/public-routes';

export type CatalogBMedia = {
  idle: string;
  forward: string;
  reverse: string;
};

export type CatalogBCard = FurnitureProductCardData & {
  href: typeof SHOWCASE_DEFAULT_PRODUCT_PATH;
  media: CatalogBMedia;
  note: string;
  colors: Array<{ label: string; swatchHex: string | null }>;
};

export type CatalogBFacetGroup = {
  key: string;
  title: string;
  values: Array<{
    id: string;
    label: string;
    count: number;
    swatchHex?: string | null;
  }>;
  kind: 'pill' | 'check' | 'swatch';
};

export type CatalogBModel = {
  cards: CatalogBCard[];
  total: number;
  shown: number;
  page: number;
  totalPages: number;
  roomTabs: Array<{ id: string; label: string; image: string }>;
  facetGroups: CatalogBFacetGroup[];
  price: { min: number; max: number };
};

const MEDIA_BY_BASENAME: Record<string, CatalogBMedia> = {
  '01-bar-stool-idle.webp': {
    idle: '/assets/products/01-bar-stool-idle.webp',
    forward: '/assets/products/01-bar-stool-forward.mp4',
    reverse: '/assets/products/01-bar-stool-reverse.mp4',
  },
  '02-rocking-chair-idle.webp': {
    idle: '/assets/products/02-rocking-chair-idle.webp',
    forward: '/assets/products/02-rocking-chair-forward.mp4',
    reverse: '/assets/products/02-rocking-chair-reverse.mp4',
  },
  '03-ivory-lounge-idle.webp': {
    idle: '/assets/products/03-ivory-lounge-idle.webp',
    forward: '/assets/products/03-ivory-lounge-forward.mp4',
    reverse: '/assets/products/03-ivory-lounge-reverse.mp4',
  },
  '04-dark-accent-idle.webp': {
    idle: '/assets/products/04-dark-accent-idle.webp',
    forward: '/assets/products/04-dark-accent-forward.mp4',
    reverse: '/assets/products/04-dark-accent-reverse.mp4',
  },
  '05-two-seat-sofa-idle.webp': {
    idle: '/assets/products/05-two-seat-sofa-idle.webp',
    forward: '/assets/products/05-two-seat-sofa-forward.mp4',
    reverse: '/assets/products/05-two-seat-sofa-reverse.mp4',
  },
};

MEDIA_BY_BASENAME['01-bar-stool-cutout.png'] = MEDIA_BY_BASENAME['01-bar-stool-idle.webp'];
MEDIA_BY_BASENAME['03-ivory-lounge-cutout.png'] = MEDIA_BY_BASENAME['03-ivory-lounge-idle.webp'];
MEDIA_BY_BASENAME['05-terracotta-walnut-chair-alpha.png'] = MEDIA_BY_BASENAME['05-two-seat-sofa-idle.webp'];

const FALLBACK_MEDIA: CatalogBMedia = {
  idle: '/assets/products/03-ivory-lounge-idle.webp',
  forward: '/assets/products/03-ivory-lounge-forward.mp4',
  reverse: '/assets/products/03-ivory-lounge-reverse.mp4',
};

const ROOM_TABS = [
  { id: 'all', label: 'Все', image: '/assets/hero/kitchen-idle.jpg' },
  { id: 'living', label: 'Гостиная', image: '/assets/editorial/images/71c2b8589fc6.png' },
  { id: 'dining', label: 'Столовая', image: '/assets/hero/kitchen-idle.jpg' },
  { id: 'bedroom', label: 'Спальня', image: '/assets/hero/bedroom-idle.jpg' },
  { id: 'terrace', label: 'Терраса', image: '/assets/hero/terrace-idle.jpg' },
] as const;

function imageBasename(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl.slice(imageUrl.lastIndexOf('/') + 1);
}

export function mediaForFurnitureCard(data: FurnitureProductCardData): CatalogBMedia {
  const knownMedia = imageBasename(data.imageUrl) ? MEDIA_BY_BASENAME[imageBasename(data.imageUrl)!] : undefined;
  if (knownMedia) return knownMedia;

  return {
    ...FALLBACK_MEDIA,
    ...(data.imageUrl ? { idle: data.imageUrl } : {}),
  };
}

function noteForFurnitureCard(data: FurnitureProductCardData): string {
  const swatchLabels = data.optionSwatches
    .map((swatch) => swatch.label)
    .filter(Boolean)
    .slice(0, 2);
  return [data.categoryName, ...swatchLabels].join(', ');
}

function facetKind(
  slug: string,
  values: CatalogResult['facets']['options'][number]['values'],
): CatalogBFacetGroup['kind'] {
  if (slug === 'finish' || values.some((value) => value.swatchHex)) return 'swatch';
  return 'check';
}

export function buildCatalogBModel(result: CatalogResult): CatalogBModel {
  const cards = result.products.map((product): CatalogBCard => ({
    ...product,
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
    media: mediaForFurnitureCard(product),
    note: noteForFurnitureCard(product),
    colors: product.optionSwatches.map(({ label, swatchHex }) => ({ label, swatchHex })),
  }));

  const categoryGroup: CatalogBFacetGroup = {
    key: 'category',
    title: 'Категория',
    kind: 'pill',
    values: result.facets.categories.map((category) => ({
      id: category.value,
      label: category.label,
      count: category.count,
    })),
  };

  const optionGroups = result.facets.options.map((group): CatalogBFacetGroup => ({
    key: group.slug,
    title: group.name,
    kind: facetKind(group.slug, group.values),
    values: group.values.map((value) => ({
      id: value.value,
      label: value.label,
      count: value.count,
      swatchHex: value.swatchHex,
    })),
  }));

  return {
    cards,
    total: result.total,
    shown: result.products.length,
    page: result.page,
    totalPages: result.totalPages,
    roomTabs: ROOM_TABS.map((tab) => ({ ...tab })),
    facetGroups: [categoryGroup, ...optionGroups],
    price: { ...result.facets.price },
  };
}
