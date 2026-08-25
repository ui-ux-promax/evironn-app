import type { UploadedImage } from '@/lib/cloudinary/types';

export function shouldDeleteImmediately(image: UploadedImage): boolean {
  return Boolean(image.publicId) && image.persisted !== true;
}

export function removedPersistedPublicIds(before: UploadedImage[], after: UploadedImage[]): string[] {
  const kept = new Set(after.map((image) => image.publicId).filter(Boolean));
  return before
    .filter((image) => image.persisted === true && image.publicId && !kept.has(image.publicId))
    .map((image) => image.publicId);
}
