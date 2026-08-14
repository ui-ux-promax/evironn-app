import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
import { HOME_ASSET_MANIFEST } from '@/components/evironn/home/home-assets';

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

describe('Evironn home asset manifest', () => {
  it('contains only the explicit Task 4 manifest with nonzero files', () => {
    expect(HOME_ASSET_MANIFEST).toHaveLength(31);
    for (const record of HOME_ASSET_MANIFEST) {
      const absolutePath = resolve(root, record.path);
      expect(existsSync(absolutePath), record.path).toBe(true);
      expect(statSync(absolutePath).size, record.path).toBe(record.bytes);
    }
  });

  it('keeps a stable inventory hash record for every manifest target', () => {
    const records = HOME_ASSET_MANIFEST.map((record) => {
      const absolutePath = resolve(root, record.path);
      return { ...record, actualSha256: sha256(absolutePath) };
    });
    expect(new Set(records.map((record) => record.path)).size).toBe(records.length);
    expect(records.every((record) => record.sha256 === record.actualSha256)).toBe(true);
  });
});
