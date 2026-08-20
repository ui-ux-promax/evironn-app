export interface SkuOptionSelection {
  groupSlug: string;
  valueSlug: string;
}

function cleanPart(value: string, label: string): string {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) throw new Error(`${label} cannot be empty`);
  return cleaned;
}

export function buildCombinationKey(selections: SkuOptionSelection[]): string {
  const normalized = selections.map((selection) => ({
    groupSlug: cleanPart(selection.groupSlug, 'Option group slug'),
    valueSlug: cleanPart(selection.valueSlug, 'Option value slug'),
  }));

  const groups = new Set(normalized.map((selection) => selection.groupSlug));
  if (groups.size !== normalized.length) {
    throw new Error('Each SKU can contain only one value per option group');
  }

  return normalized
    .sort(
      (left, right) => left.groupSlug.localeCompare(right.groupSlug) || left.valueSlug.localeCompare(right.valueSlug),
    )
    .map((selection) => `${selection.groupSlug}=${selection.valueSlug}`)
    .join('|');
}
