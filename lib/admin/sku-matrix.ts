import { buildCombinationKey } from '@/lib/furniture-sku';

export type SkuMatrixAxis = {
  optionGroupId: string;
  optionGroupSlug: string;
  optionGroupName: string;
  sortOrder: number;
  values: {
    optionValueId: string;
    optionValueSlug: string;
    optionValueName: string;
    sortOrder: number;
  }[];
};

export type SkuMatrixSelection = {
  optionGroupId: string;
  optionGroupSlug: string;
  optionValueId: string;
  optionValueSlug: string;
};

export type SkuMatrixRowState = 'existing' | 'new';

export type SkuMatrixRow = {
  combinationKey: string;
  selections: SkuMatrixSelection[];
  skuId: string | null;
  articleNumber: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
  referenced: boolean;
  state: SkuMatrixRowState;
};

export type SkuDeactivationInstruction = {
  skuId: string;
  combinationKey: string;
  reason: 'removed-referenced-combination';
};

export type SkuMatrixResult = {
  rows: SkuMatrixRow[];
  deactivations: SkuDeactivationInstruction[];
  removals: { skuId: string; combinationKey: string }[];
};

type SkuMatrixInput = {
  axes: SkuMatrixAxis[];
  existing: {
    skuId: string;
    combinationKey: string;
    articleNumber: string;
    price: number;
    oldPrice: number | null;
    stock: number;
    active: boolean;
    referenced: boolean;
  }[];
};

function compareByOrderAndSlug(
  left: { sortOrder: number; optionGroupSlug: string },
  right: { sortOrder: number; optionGroupSlug: string },
) {
  return left.sortOrder - right.sortOrder || left.optionGroupSlug.localeCompare(right.optionGroupSlug);
}

function compareValues(
  left: { sortOrder: number; optionValueSlug: string },
  right: { sortOrder: number; optionValueSlug: string },
) {
  return left.sortOrder - right.sortOrder || left.optionValueSlug.localeCompare(right.optionValueSlug);
}

export function buildSkuMatrix(input: SkuMatrixInput): SkuMatrixResult {
  const sortedAxes = input.axes
    .map((axis) => ({ ...axis, values: [...axis.values].sort(compareValues) }))
    .sort(compareByOrderAndSlug);
  const existingByKey = new Map(input.existing.map((sku) => [sku.combinationKey, sku]));
  const combinations: SkuMatrixSelection[][] = [];

  function visit(axisIndex: number, selections: SkuMatrixSelection[]) {
    if (axisIndex === sortedAxes.length) {
      if (selections.length > 0) combinations.push(selections);
      return;
    }

    const axis = sortedAxes[axisIndex]!;
    for (const value of axis.values) {
      visit(axisIndex + 1, [
        ...selections,
        {
          optionGroupId: axis.optionGroupId,
          optionGroupSlug: axis.optionGroupSlug,
          optionValueId: value.optionValueId,
          optionValueSlug: value.optionValueSlug,
        },
      ]);
    }
  }

  visit(0, []);

  const generatedKeys = new Set<string>();
  const rows = combinations.map((selections) => {
    const combinationKey = buildCombinationKey(
      selections.map((selection) => ({
        groupSlug: selection.optionGroupSlug,
        valueSlug: selection.optionValueSlug,
      })),
    );
    generatedKeys.add(combinationKey);
    const current = existingByKey.get(combinationKey);

    if (current) {
      return {
        combinationKey,
        selections,
        skuId: current.skuId,
        articleNumber: current.articleNumber,
        price: current.price,
        oldPrice: current.oldPrice,
        stock: current.stock,
        active: current.active,
        referenced: current.referenced,
        state: 'existing' as const,
      };
    }

    return {
      combinationKey,
      selections,
      skuId: null,
      articleNumber: '',
      price: 0,
      oldPrice: null,
      stock: 0,
      active: true,
      referenced: false,
      state: 'new' as const,
    };
  });

  const removed = input.existing
    .filter((sku) => !generatedKeys.has(sku.combinationKey))
    .sort((left, right) => left.combinationKey.localeCompare(right.combinationKey));

  return {
    rows,
    deactivations: removed
      .filter((sku) => sku.referenced)
      .map(({ skuId, combinationKey }) => ({
        skuId,
        combinationKey,
        reason: 'removed-referenced-combination' as const,
      })),
    removals: removed.filter((sku) => !sku.referenced).map(({ skuId, combinationKey }) => ({ skuId, combinationKey })),
  };
}
