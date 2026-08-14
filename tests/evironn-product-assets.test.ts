import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'vitest';

const repositoryRoot = process.cwd();

const manifest = [
  {
    path: 'public/assets/products/05-graphite-walnut-room-background-fixed.png',
    bytes: 2182988,
    sha256: '174c075a8bf5a04902988c0b4bf13e7457675ffd57d0fe9bbc538dbfe11f8c6a',
  },
  {
    path: 'public/assets/products/05-ivory-walnut-chair-fixed-alpha.png',
    bytes: 2476114,
    sha256: '89689c049a8471ba0a3751ca106df35cbef983b3ddc436da92e1139bdb308b07',
  },
  {
    path: 'public/assets/products/05-ivory-pine-chair-fixed-alpha.png',
    bytes: 2475996,
    sha256: 'd13ac589a4a5c515f1527861c3ef40f5d1fd0ca1195907c4cf7dc8ae5f560f9d',
  },
  {
    path: 'public/assets/products/05-graphite-walnut-chair-fixed-alpha.png',
    bytes: 2534916,
    sha256: '45b21105f96f17936c88615b253c8883fc6c2e3c4f62414ebbccb97f533ec06a',
  },
  {
    path: 'public/assets/products/05-graphite-pine-chair-fixed-alpha.png',
    bytes: 2562642,
    sha256: 'b4885cfd87dbdf26c76c05940c3baec8c1a6a9aa52509cfebc88eb80649214ee',
  },
  {
    path: 'public/assets/products/05-terracotta-walnut-chair-fixed-alpha.png',
    bytes: 2555550,
    sha256: '00414891406c376f9bb229490025f1732a3f52e4be84517affa2a0047c482f41',
  },
  {
    path: 'public/assets/products/05-terracotta-pine-chair-fixed-alpha.png',
    bytes: 2522477,
    sha256: '0889692d1e2182bbf39dc71d30036fb7e9514bfd89305f7b45a6574d1eb33629',
  },
  {
    path: 'public/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
    bytes: 28717710,
    sha256: 'b07555e15a67eb1886f993fb7c26e925616c0c3989a60ade108017281e722142',
  },
  {
    path: 'public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
    bytes: 3161216,
    sha256: 'e5f4279d5b307282d127ed585037acb44130e0de239836e56dd99ed3cecb6e48',
  },
] as const;

const digest = (filePath: string) => createHash('sha256').update(readFileSync(filePath)).digest('hex');

test('keeps WebM assets tracked by Git LFS', () => {
  expect(readFileSync(path.join(repositoryRoot, '.gitattributes'), 'utf8')).toContain(
    '*.webm filter=lfs diff=lfs merge=lfs -text',
  );
});

test('contains exactly the audited product asset manifest', () => {
  expect(new Set(manifest.map((asset) => asset.path)).size).toBe(manifest.length);
  expect(manifest.reduce((total, asset) => total + asset.bytes, 0)).toBe(49189609);
  expect(Math.max(...manifest.map((asset) => asset.bytes))).toBeLessThan(100 * 1024 * 1024);

  for (const asset of manifest) {
    const absolutePath = path.join(repositoryRoot, asset.path);
    expect(existsSync(absolutePath), asset.path).toBe(true);
    expect(statSync(absolutePath).size, asset.path).toBe(asset.bytes);
    expect(digest(absolutePath), asset.path).toBe(asset.sha256);
  }
});
