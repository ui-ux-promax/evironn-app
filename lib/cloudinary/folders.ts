export const EVIRONN_UPLOADS_FOLDER = 'evironn/uploads';
export const EVIRONN_CATEGORIES_FOLDER = 'evironn/categories';
export const EVIRONN_PRODUCTS_FOLDER = 'evironn/products';
export const EVIRONN_SKUS_FOLDER = 'evironn/skus';
export const EVIRONN_TURNTABLE_FOLDER = 'evironn/turntable';

export const EVIRONN_MEDIA_FOLDERS = [
  EVIRONN_UPLOADS_FOLDER,
  EVIRONN_CATEGORIES_FOLDER,
  EVIRONN_PRODUCTS_FOLDER,
  EVIRONN_SKUS_FOLDER,
  EVIRONN_TURNTABLE_FOLDER,
] as const;

export type EvironnMediaFolder = (typeof EVIRONN_MEDIA_FOLDERS)[number];

export const LEGACY_MEDIA_PREFIX = 'ritm/';
const MAX_SAFE_MEDIA_PATH_LENGTH = 512;

export function isSafeMediaPath(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  if (value.length > MAX_SAFE_MEDIA_PATH_LENGTH) return false;
  if (value !== value.trim()) return false;
  if (value.startsWith('/') || value.includes('//') || value.includes('\\')) return false;
  if (/[\u0000-\u001f\u007f-\u009f\u200b\u200c\u200d\u2060\u2028\u2029\ufeff]/.test(value)) return false;

  return value.split('/').every((segment) => {
    const trimmed = segment.trim();
    return segment === trimmed && trimmed !== '' && trimmed !== '.' && trimmed !== '..';
  });
}

export function isEvironnMediaFolder(value: string): value is EvironnMediaFolder {
  return (EVIRONN_MEDIA_FOLDERS as readonly string[]).includes(value);
}

export function isEvironnPublicId(value: string): boolean {
  if (!isSafeMediaPath(value)) return false;
  const matchingFolders = EVIRONN_MEDIA_FOLDERS.filter((folder) => value.startsWith(`${folder}/`));
  return matchingFolders.length === 1;
}

export function isLegacyPublicId(value: string): boolean {
  return isSafeMediaPath(value) && value.startsWith(LEGACY_MEDIA_PREFIX);
}

export function assertSignableFolder(value: string): EvironnMediaFolder {
  if (!isEvironnMediaFolder(value)) throw new Error('Unsupported media folder');
  return value;
}
