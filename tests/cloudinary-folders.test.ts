import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertSignableFolder,
  EVIRONN_CATEGORIES_FOLDER,
  EVIRONN_MEDIA_FOLDERS,
  EVIRONN_PRODUCTS_FOLDER,
  EVIRONN_UPLOADS_FOLDER,
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
    expect(EVIRONN_UPLOADS_FOLDER).toBe('evironn/uploads');
    expect(EVIRONN_CATEGORIES_FOLDER).toBe('evironn/categories');
    expect(EVIRONN_PRODUCTS_FOLDER).toBe('evironn/products');
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
      'evironn/products/./chair',
      'evironn//products/chair',
      'evironn/products/',
      'evironn/products/a/   /chair',
      'evironn\\products\\chair',
      'evironn/products/chair\u0000',
      `evironn/products/${'a'.repeat(513)}`,
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

  it('keeps pure uploader helpers free of the Prisma client', () => {
    const pureModule = readFileSync(resolve(process.cwd(), 'lib/cloudinary/admin-media.ts'), 'utf8');
    const serverModule = readFileSync(resolve(process.cwd(), 'lib/cloudinary/admin-media.server.ts'), 'utf8');

    expect(pureModule).not.toContain('@/lib/prisma-client');
    expect(pureModule).not.toContain('resolveMediaDeleteDecision');
    expect(serverModule).toContain('@/lib/prisma-client');
  });

  it('uses named Evironn constants at every remaining admin signer input', () => {
    const paths = ['components/admin/media/image-uploader.tsx', 'components/admin/media/uploader-demo.tsx'];
    for (const path of paths) {
      const source = readFileSync(resolve(process.cwd(), path), 'utf8');
      expect(source, path).not.toMatch(/folder\s*(?:=|,)\s*["']ritm\//);
      expect(source, path).not.toContain('ritm/uploads');
      expect(source, path).not.toContain('ritm/products');
    }
  });
});
