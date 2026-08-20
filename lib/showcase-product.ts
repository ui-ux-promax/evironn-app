import { PRODUCT_SCENE_BACKGROUND, PRODUCT_SCENE_CHAIRS } from '@/components/evironn/product/productPageState';
import { SHOWCASE_PRODUCT_PATH } from '@/components/evironn/public-routes';
import { formatPrice } from '@/lib/format';
import {
  parseOptionParam,
  resolveSelectedSku,
  serializeOptionParam,
  type FurnitureProductForSelection,
} from '@/lib/product-selection';

export const SHOWCASE_PRODUCT_SLUG = 'noma-woven-lounge' as const;
export type ShowcaseUpholsteryId = 'ivory' | 'charcoal' | 'terracotta';
export type ShowcaseWoodId = 'pine' | 'walnut';

const canonicalByVisual = {
  ivory: 'ivory-boucle',
  charcoal: 'graphite',
  terracotta: 'terracotta',
} as const;

const finishByWood = {
  pine: 'oak',
  walnut: 'walnut',
} as const;

const visualCombinations: Array<[ShowcaseUpholsteryId, ShowcaseWoodId]> = [
  ['ivory', 'pine'],
  ['ivory', 'walnut'],
  ['charcoal', 'pine'],
  ['charcoal', 'walnut'],
  ['terracotta', 'pine'],
  ['terracotta', 'walnut'],
];

const DEFAULT_CANONICAL_SELECTION = {
  finish: finishByWood.walnut,
  upholstery: canonicalByVisual.ivory,
} as const;

const canonicalFinishValues = new Set(Object.values(finishByWood));
const canonicalUpholsteryValues = new Set(Object.values(canonicalByVisual));

const SHOWCASE_PRODUCT_NAME = '\u041a\u0440\u0435\u0441\u043b\u043e Graphite' as const;
const SHOWCASE_PRODUCT_DESCRIPTION =
  'Мягкое кресло с графитовой обивкой и каркасом из тёмного ореха для спокойных жилых пространств.' as const;

export interface ShowcaseCombinationDto {
  upholstery: ShowcaseUpholsteryId;
  wood: ShowcaseWoodId;
  canonicalOption: string;
  canonicalPath: string;
  chairUrl: string;
  sku: {
    id: string;
    articleNumber: string;
    price: number;
    oldPrice: number | null;
    stock: number;
    priceLabel: string;
    oldPriceLabel: string | null;
  };
}

export interface ShowcaseProductPageDto {
  product: {
    name: '\u041a\u0440\u0435\u0441\u043b\u043e Graphite';
    description: string;
    categoryName: string;
    categorySlug: string;
  };
  sceneBackgroundUrl: string;
  selected: ShowcaseCombinationDto;
  combinations: ShowcaseCombinationDto[];
  turntable: {
    videoUrl: string;
    posterUrl: string;
    fallbackUrl: string;
    alt: string;
  };
}

export class ShowcaseProductContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShowcaseProductContractError';
  }
}

type ShowcaseProduct = FurnitureProductForSelection & {
  description?: string;
  category?: { name: string; slug: string };
};

function canonicalSelectionFor(
  upholstery: ShowcaseUpholsteryId,
  wood: ShowcaseWoodId,
): { finish: string; upholstery: string } {
  return {
    finish: finishByWood[wood],
    upholstery: canonicalByVisual[upholstery],
  };
}

function mergeRequestedSelection(rawOption: string | null | undefined): Record<string, string> {
  const parsed = parseOptionParam(rawOption);
  for (const group of Object.keys(parsed)) {
    if (group !== 'finish' && group !== 'upholstery') {
      throw new ShowcaseProductContractError(`Unexpected showcase option group: ${group}`);
    }
  }

  const merged: Record<string, string> = { ...DEFAULT_CANONICAL_SELECTION };
  if (parsed.finish && canonicalFinishValues.has(parsed.finish as (typeof finishByWood)[keyof typeof finishByWood])) {
    merged.finish = parsed.finish;
  }
  if (
    parsed.upholstery &&
    canonicalUpholsteryValues.has(parsed.upholstery as (typeof canonicalByVisual)[keyof typeof canonicalByVisual])
  ) {
    merged.upholstery = parsed.upholstery;
  }
  return merged;
}

function projectCombination(
  product: ShowcaseProduct,
  upholstery: ShowcaseUpholsteryId,
  wood: ShowcaseWoodId,
): ShowcaseCombinationDto & { turntable: ShowcaseProductPageDto['turntable'] } {
  const requested = canonicalSelectionFor(upholstery, wood);
  let resolved;
  try {
    resolved = resolveSelectedSku(product, requested);
  } catch (error) {
    throw new ShowcaseProductContractError(
      `Unable to resolve canonical showcase SKU for ${upholstery}/${wood}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const canonicalOption = serializeOptionParam(requested);
  if (serializeOptionParam(resolved.canonicalSelection) !== canonicalOption) {
    throw new ShowcaseProductContractError(`Resolver drift for canonical showcase option ${canonicalOption}`);
  }
  if (!resolved.turntable) {
    throw new ShowcaseProductContractError('Showcase product requires a complete turntable media trio');
  }

  return {
    upholstery,
    wood,
    canonicalOption,
    canonicalPath: `${SHOWCASE_PRODUCT_PATH}?option=${encodeURIComponent(canonicalOption)}`,
    chairUrl: PRODUCT_SCENE_CHAIRS[upholstery][wood],
    sku: {
      id: resolved.sku.id,
      articleNumber: resolved.sku.articleNumber,
      price: resolved.sku.price,
      oldPrice: resolved.sku.oldPrice,
      stock: resolved.sku.stock,
      priceLabel: formatPrice(resolved.sku.price),
      oldPriceLabel: resolved.sku.oldPrice === null ? null : formatPrice(resolved.sku.oldPrice),
    },
    turntable: resolved.turntable,
  };
}

export function buildShowcaseProductPageDto(
  product: ShowcaseProduct,
  rawOption?: string | null,
): ShowcaseProductPageDto {
  const requested = mergeRequestedSelection(rawOption);
  const combinationsWithMedia = visualCombinations.map(([upholstery, wood]) =>
    projectCombination(product, upholstery, wood),
  );
  const skuIds = combinationsWithMedia.map(({ sku }) => sku.id);
  if (new Set(skuIds).size !== combinationsWithMedia.length) {
    throw new ShowcaseProductContractError('Showcase combinations must resolve to unique SKU IDs');
  }

  const combinations = combinationsWithMedia.map(({ turntable: _turntable, ...combination }) => combination);
  const selectedCanonicalOption = serializeOptionParam(requested);
  const selected = combinations.find(({ canonicalOption }) => canonicalOption === selectedCanonicalOption);
  if (!selected) {
    throw new ShowcaseProductContractError(`Unknown canonical showcase option ${selectedCanonicalOption}`);
  }

  const turntable = combinationsWithMedia[0].turntable;
  return {
    product: {
      name: SHOWCASE_PRODUCT_NAME,
      description: SHOWCASE_PRODUCT_DESCRIPTION,
      categoryName: product.category?.name ?? '\u041a\u0440\u0435\u0441\u043b\u0430',
      categorySlug: product.category?.slug ?? 'armchairs',
    },
    sceneBackgroundUrl: PRODUCT_SCENE_BACKGROUND,
    selected,
    combinations,
    turntable,
  };
}
