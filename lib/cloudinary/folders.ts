export const EVIRONN_MEDIA_FOLDERS = [
  'evironn/uploads',
  'evironn/categories',
  'evironn/products',
  'evironn/skus',
  'evironn/turntable',
] as const;

export type EvironnMediaFolder = (typeof EVIRONN_MEDIA_FOLDERS)[number];

export const LEGACY_MEDIA_PREFIX = 'ritm/';

export function isSafeMediaPath(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false;
  if (value.startsWith('/') || value.includes('//') || value.includes('\\')) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;

  return value.split('/').every((segment) => segment !== '' && segment !== '..');
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
