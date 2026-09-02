import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const heroDirectory = path.join(repositoryRoot, 'public/assets/hero');
const heroManifest = [
  {
    path: 'public/assets/hero/bedroom-bed-focus.webp',
    bytes: 106352,
    sha256: '3653539aeb27781c967bc06f5820ce99b1e81087554fb93da31b9a159e807f84',
  },
  {
    path: 'public/assets/hero/bedroom-bed-forward.mp4',
    bytes: 3979743,
    sha256: '34c684217333b446253485a15659999d6e465d7ac52902f8a7f657cf35370ed1',
  },
  {
    path: 'public/assets/hero/bedroom-bed-forward.webm',
    bytes: 1611466,
    sha256: '15062c182091b3891df6d5a2fe3e98ce2c9263afbc1d2381f4a39eb25cbe6329',
  },
  {
    path: 'public/assets/hero/bedroom-bed-reverse.mp4',
    bytes: 3211117,
    sha256: '84b9481ca9ec1e6a049ba5955c902431c1876b37ed051b0a202bbc46e20ee8fa',
  },
  {
    path: 'public/assets/hero/bedroom-bed-reverse.webm',
    bytes: 1542578,
    sha256: 'e700d50435f2c2f3a766ecf29a983e4f5adf482995049bb7006310b5f57560df',
  },
  {
    path: 'public/assets/hero/bedroom-chair-focus.webp',
    bytes: 147978,
    sha256: '590365d870bac10c835c46bea3875fe47dae404ba32e5c2bc40ccbd6baacaf0f',
  },
  {
    path: 'public/assets/hero/bedroom-chair-forward.mp4',
    bytes: 6476041,
    sha256: '8f192f5a2e735116340391cda3db0f17caeb91102ec69c97b6d624d86b0dc0e7',
  },
  {
    path: 'public/assets/hero/bedroom-chair-forward.webm',
    bytes: 3229507,
    sha256: 'e2e989a2294b10d78e78738d323d3db132d5765de162930c9799e8e076810fac',
  },
  {
    path: 'public/assets/hero/bedroom-chair-reverse.mp4',
    bytes: 5437362,
    sha256: 'a48d8f03959196904a5eedd7241435c57b00740ad56cc1d416a98729b9a91cc4',
  },
  {
    path: 'public/assets/hero/bedroom-chair-reverse.webm',
    bytes: 3117880,
    sha256: '60b43bb55b0035d7e2484700628923210ef4d82df8c8cf5e154024875dc12278',
  },
  {
    path: 'public/assets/hero/bedroom-idle.jpg',
    bytes: 273941,
    sha256: 'b398f08f862c8a5bc7ec49a0bb2ab1802268b805b80701f09e00352cca0a1140',
  },
  {
    path: 'public/assets/hero/chair-focus.webp',
    bytes: 174412,
    sha256: '9307ee6798158f3ffee650ccf201759ba2a59fc53d62782c40d3e45a8c65ed84',
  },
  {
    path: 'public/assets/hero/chair-forward.mp4',
    bytes: 9022617,
    sha256: '830bfcdf25fc3af7b137e4fdcace3775dafcf7f1b02a05aba340b0fc6ae0e3de',
  },
  {
    path: 'public/assets/hero/chair-forward.webm',
    bytes: 5484191,
    sha256: 'ab28654434c29a22a508f03a2698f04b8920dde4013cb92fecea21c3978886e1',
  },
  {
    path: 'public/assets/hero/chair-reverse.mp4',
    bytes: 7696268,
    sha256: 'a458d20808a0c843a1deb0afaf812613bb34303dfcc0f7fc4a99990a03ac1ed8',
  },
  {
    path: 'public/assets/hero/chair-reverse.webm',
    bytes: 5300618,
    sha256: '4583cec73428c6dac78f4ae1814c607a8436be7ebc8fc1551ef216fd376fe211',
  },
  {
    path: 'public/assets/hero/kitchen-dining-focus.webp',
    bytes: 81900,
    sha256: 'f1c31aaf156ceec7dde5a59a6f05bbf66016c90e4adae27353ad17b70a16b423',
  },
  {
    path: 'public/assets/hero/kitchen-dining-forward.mp4',
    bytes: 6138461,
    sha256: '1a2b06356edab8950d2c3ab6cc47fb8e96e13453e3dc3dceff38fda0ef88d5ac',
  },
  {
    path: 'public/assets/hero/kitchen-dining-forward.webm',
    bytes: 3720843,
    sha256: '04fe1f20983f824f04caedf49eb51adb7a673dd2d41594caf8c956339094ebab',
  },
  {
    path: 'public/assets/hero/kitchen-dining-reverse.mp4',
    bytes: 5330779,
    sha256: '89e1aef8be033d717cd652a15a41669e6d5aeae63374aed6fee2075331fa6dc9',
  },
  {
    path: 'public/assets/hero/kitchen-dining-reverse.webm',
    bytes: 3594827,
    sha256: 'f60c819da5ce6cb1f48755b097a1ee12f648f2759126e8bd75b8137aa93472c2',
  },
  {
    path: 'public/assets/hero/kitchen-idle.jpg',
    bytes: 241034,
    sha256: '1a7eb4084acee3e4268c3fb773fe6869d73d11bf332ede67cb1144381e4f9433',
  },
  {
    path: 'public/assets/hero/kitchen-island-focus.webp',
    bytes: 89754,
    sha256: '76e491cb50a332dae95f196ad8811a375357e5357ad97b841881cfeb10c56ce4',
  },
  {
    path: 'public/assets/hero/kitchen-island-forward.mp4',
    bytes: 4664253,
    sha256: '8b0347469a1d3dafdbbd35c1da90ab6dbb2046163de5286a09cab9517c3de8c2',
  },
  {
    path: 'public/assets/hero/kitchen-island-forward.webm',
    bytes: 2926124,
    sha256: 'a370c90c0462b0dba151a0d45b5124c33aa23c829b1fceab092c2422d74805f6',
  },
  {
    path: 'public/assets/hero/kitchen-island-reverse.mp4',
    bytes: 4013620,
    sha256: '7ebab953d4fa7abaca66a452ea2bcac00528d94be0cfe314c9ac9f75c9ee9c1f',
  },
  {
    path: 'public/assets/hero/kitchen-island-reverse.webm',
    bytes: 2835701,
    sha256: '503a01efcf96236e7fb6f18ece746a14e4bcea984ebba8339e47c7e12c68850a',
  },
  {
    path: 'public/assets/hero/living-room-idle-5f0f1836.webp',
    bytes: 223502,
    sha256: '5f0f1836760241be5f6de79e25937c5b21fd4b2ca6ec73394a6d0fac89ac8c7f',
  },
  {
    path: 'public/assets/hero/living-room-idle.png',
    bytes: 2422566,
    sha256: 'a100b4dcb54c9603fe50a2c91eb22d9dbb4467d8188911efc6a5f63c828eb63c',
  },
  {
    path: 'public/assets/hero/sofa-focus.webp',
    bytes: 93922,
    sha256: '77e104ac672cd58e87f94796f132478530d94fea610489656594f0fd136c39c2',
  },
  {
    path: 'public/assets/hero/sofa-forward.mp4',
    bytes: 6918992,
    sha256: '97928b8a8659750df9cd89fc2109f57a943413564b6d320214c8bc7c43de6655',
  },
  {
    path: 'public/assets/hero/sofa-forward.webm',
    bytes: 3623559,
    sha256: 'f800b9e9c3fc9fb59be7066ab4151d44e7cae0b345bc3fa757389f6c030f3e18',
  },
  {
    path: 'public/assets/hero/sofa-reverse.mp4',
    bytes: 5679663,
    sha256: 'dd38f87e057a9a13176ff7a35bc624419c4102fd61aae6b4b19044fa4d4177f5',
  },
  {
    path: 'public/assets/hero/sofa-reverse.webm',
    bytes: 3428417,
    sha256: 'e1a1e5ccc9056cf796616bb053f382237d354cecbb8df225c5346bd3b1d7a326',
  },
  {
    path: 'public/assets/hero/terrace-chair-focus.webp',
    bytes: 139436,
    sha256: 'f087a6badb3703cab15c9e5e113893101fb0dfc74d036563e47b681ca467458f',
  },
  {
    path: 'public/assets/hero/terrace-chair-forward.mp4',
    bytes: 8556765,
    sha256: 'e375a3c87f142df574abe4371967a4fcba99356067ff6c716292e746d615381f',
  },
  {
    path: 'public/assets/hero/terrace-chair-forward.webm',
    bytes: 4945931,
    sha256: '7df44bd750c3409879d312670d19323fb8bff15e9af7f5dc4f6f1f050eb2fcc2',
  },
  {
    path: 'public/assets/hero/terrace-chair-reverse.mp4',
    bytes: 7382094,
    sha256: '726404a4e234fad318b65609a9dfcb838e878cc7eb21f30743e49d2dca686c6d',
  },
  {
    path: 'public/assets/hero/terrace-chair-reverse.webm',
    bytes: 4826100,
    sha256: 'b6a7e08822e957f575d4c1dfa49f547ca54d7b09d4b689a27b232ee08f15d7fd',
  },
  {
    path: 'public/assets/hero/terrace-idle.jpg',
    bytes: 285542,
    sha256: '28ca0ed9c9db1544989fb500f834bb60edf6621fc7f7c4ffd22ddd9b126c45e2',
  },
  {
    path: 'public/assets/hero/terrace-sofa-focus.webp',
    bytes: 222370,
    sha256: '1086c631df3b004810d9573121b4859724be5e61d402aa117226f9e492a5bfe2',
  },
  {
    path: 'public/assets/hero/terrace-sofa-forward.mp4',
    bytes: 9941316,
    sha256: '68c5db691631c94f141a230fe5f37f9f74e7115302b57398b4dfb036065d4892',
  },
  {
    path: 'public/assets/hero/terrace-sofa-forward.webm',
    bytes: 4173974,
    sha256: 'e91786208ba03016b7d73f881ab51a80592e157c7bbe4319f5551efce07cba79',
  },
  {
    path: 'public/assets/hero/terrace-sofa-reverse.mp4',
    bytes: 8627076,
    sha256: '1683f5051bcf4f91e946af436fcbd894ed3cd76d08d2446d8306e44a9494973c',
  },
  {
    path: 'public/assets/hero/terrace-sofa-reverse.webm',
    bytes: 4163651,
    sha256: 'c1624ff79c030b58a71175a3b2d4984887de0ddceb922129c04b03dc3261ac5c',
  },
] as const;

function digest(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

describe('Evironn hero binary contract', () => {
  it('enumerates exactly 45 committed normative files with audited sizes and hashes', () => {
    expect(heroManifest).toHaveLength(45);
    expect(readdirSync(heroDirectory).sort()).toEqual(heroManifest.map((asset) => path.basename(asset.path)).sort());
    for (const asset of heroManifest) {
      const target = path.join(repositoryRoot, asset.path);
      expect(existsSync(target), `Missing production asset: ${asset.path}`).toBe(true);
      expect(statSync(target).size, asset.path).toBeGreaterThan(0);
      expect(statSync(target).size, asset.path).toBe(asset.bytes);
      expect(digest(target), asset.path).toBe(asset.sha256);
    }
  });

  it('keeps the audited inventory total and maximum below the object-size boundary', () => {
    const sizes = heroManifest.map((asset) => asset.bytes);
    expect(sizes.reduce((total, size) => total + size, 0)).toBe(166104243);
    expect(Math.max(...sizes)).toBe(9941316);
    expect(Math.max(...sizes)).toBeLessThan(100 * 1024 * 1024);
  });
});
