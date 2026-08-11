import { describe, expect, it } from 'vitest';
import { shouldDeleteImmediately, removedPersistedPublicIds } from '@/lib/cloudinary/admin-media';
import type { UploadedImage } from '@/lib/cloudinary/types';

const persisted = (publicId: string): UploadedImage => ({
  publicId,
  url: `https://res.cloudinary.com/demo/image/upload/${publicId}`,
  width: 0,
  height: 0,
  format: '',
  bytes: 0,
  persisted: true,
});

const fresh = (publicId: string): UploadedImage => ({
  publicId,
  url: `https://res.cloudinary.com/demo/image/upload/${publicId}`,
  width: 100,
  height: 100,
  format: 'webp',
  bytes: 1000,
});

describe('admin media helpers', () => {
  it('deletes only fresh uploads immediately from the client uploader', () => {
    expect(shouldDeleteImmediately(fresh('ritm/products/new'))).toBe(true);
    expect(shouldDeleteImmediately(persisted('ritm/products/old'))).toBe(false);
  });

  it('computes persisted public ids removed during product save', () => {
    expect(
      removedPersistedPublicIds(
        [persisted('ritm/products/a'), persisted('ritm/products/b')],
        [persisted('ritm/products/b'), fresh('ritm/products/c')],
      ),
    ).toEqual(['ritm/products/a']);
  });
});
