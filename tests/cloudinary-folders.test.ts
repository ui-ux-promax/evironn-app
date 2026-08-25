import { describe, expect, it } from 'vitest';
import {
  assertSignableFolder,
  EVIRONN_MEDIA_FOLDERS,
  isEvironnMediaFolder,
  isEvironnPublicId,
  isLegacyPublicId,
  isSafeMediaPath,
  LEGACY_MEDIA_PREFIX,
} from '@/lib/cloudinary/folders';

describe('Evironn Cloudinary folder ownership', () => {
  it('exposes exactly the five signable folders and the legacy prefix', () => {
    expect(EVIRONN_MEDIA_FOLDERS).toEqual([
      'evironn/uploads',
      'evironn/categories',
      'evironn/products',
      'evironn/skus',
      'evironn/turntable',
    ]);
    expect(LEGACY_MEDIA_PREFIX).toBe('ritm/');
    for (const folder of EVIRONN_MEDIA_FOLDERS) {
      expect(isEvironnMediaFolder(folder)).toBe(true);
      expect(assertSignableFolder(folder)).toBe(folder);
      expect(isEvironnPublicId(`${folder}/asset`)).toBe(true);
    }
  });

  it('rejects unsafe paths and empty segments', () => {
    for (const value of [
      '',
      '   ',
      '/evironn/products/chair',
      'evironn/products/../chair',
      'evironn//products/chair',
      'evironn/products/',
      'evironn\\products\\chair',
      'evironn/products/chair\u0000',
    ]) {
      expect(isSafeMediaPath(value), value).toBe(false);
      expect(isEvironnPublicId(value), value).toBe(false);
      expect(isLegacyPublicId(value), value).toBe(false);
    }
  });

  it('accepts legacy IDs only for safe ritm paths, never as signable folders', () => {
    expect(isLegacyPublicId('ritm/products/old-chair')).toBe(true);
    expect(isLegacyPublicId('ritm/')).toBe(false);
    expect(isLegacyPublicId('ritm/../secret')).toBe(false);
    expect(() => assertSignableFolder('ritm/uploads')).toThrow();
    expect(() => assertSignableFolder('evironn/products/')).toThrow();
  });

  it('rejects a public ID that does not begin with exactly one Evironn folder', () => {
    expect(isEvironnPublicId('ritm/products/chair')).toBe(false);
    expect(isEvironnPublicId('evironn/products')).toBe(false);
    expect(isEvironnPublicId('evironn/unknown/chair')).toBe(false);
  });
});
