import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'vitest';

const repositoryRoot = process.cwd();

const manifest = [
  {
    path: 'public/assets/products/05-graphite-walnut-room-background-fixed.webp',
    bytes: 283394,
    sha256: 'e2bc5f3ce6ade28a1b2ac27f653ece260c245bb159cf3ac5ade59bda5c8ad65a',
  },
  {
    path: 'public/assets/products/05-ivory-walnut-chair-fixed-alpha.webp',
    bytes: 180010,
    sha256: '54883e4e022332492918b389d0b54c71e977e9f9f0bb74d2951705b8a23ecee8',
  },
  {
    path: 'public/assets/products/05-ivory-pine-chair-fixed-alpha.webp',
    bytes: 177810,
    sha256: 'dfcf3454ef448516515d13556a672261a7a838e9d748dca289703ac20aa812f8',
  },
  {
    path: 'public/assets/products/05-graphite-walnut-chair-fixed-alpha.webp',
    bytes: 187228,
    sha256: '9391bd4add1ba1bdfeb7e21807d181a5dd0feaba72dc7741bdc45e4bb49cfa0f',
  },
  {
    path: 'public/assets/products/05-graphite-pine-chair-fixed-alpha.webp',
    bytes: 190052,
    sha256: '45d2cabdc6aea667bfc6f6b3e6217ca5def884a350bd48355b5e0b337c80a1b9',
  },
  {
    path: 'public/assets/products/05-terracotta-walnut-chair-fixed-alpha.webp',
    bytes: 196960,
    sha256: '8c3f6e936b8ec42f021f5cbf861ac61f8e42f1798d22a09c068b5713933c7c27',
  },
  {
    path: 'public/assets/products/05-terracotta-pine-chair-fixed-alpha.webp',
    bytes: 197708,
    sha256: '36bee6fd8e83e5cd6dc596f13c505fa4b26d2457eb7bbafae7cf5f38ce238ad1',
  },
  {
    path: 'public/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
    bytes: 28717710,
    sha256: 'b07555e15a67eb1886f993fb7c26e925616c0c3989a60ade108017281e722142',
  },
  {
    path: 'public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp',
    bytes: 407242,
    sha256: '7e8b327d5f3703f85bc189efd28664e41481c903e275140cb8b1671d2615dbf9',
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
  expect(manifest.reduce((total, asset) => total + asset.bytes, 0)).toBe(30538114);
  expect(Math.max(...manifest.map((asset) => asset.bytes))).toBeLessThan(100 * 1024 * 1024);

  for (const asset of manifest) {
    const absolutePath = path.join(repositoryRoot, asset.path);
    expect(existsSync(absolutePath), asset.path).toBe(true);
    expect(statSync(absolutePath).size, asset.path).toBe(asset.bytes);
    expect(digest(absolutePath), asset.path).toBe(asset.sha256);
  }
});
