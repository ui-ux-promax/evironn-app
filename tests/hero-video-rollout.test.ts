import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';

import {
  HERO_VIDEO_SOURCES,
  MP4_PROMOTION_ALLOWLIST,
  WEBM_PROMOTION_ALLOWLIST,
  assessCandidate,
  assertContainedRegularFile,
  assertFinalReceiptCoverage,
  buildCandidateInvocations,
  buildMetricInvocation,
  buildPromotedMetricInvocation,
  buildWebmAbsenceGates,
  classifyFailure,
  commandPreflightPolicy,
  computeAggregateReduction,
  nextQuality,
  parseProbe,
  promoteValidatedBatch,
  reportPromotedRollout,
  recoverInterruptedPromotion,
  resolveRolloutPaths,
  runCandidateBatch,
  manifestResult,
  main,
  timeoutForInvocation,
  validateSourceInventory,
  verifyImmutableSources,
  verifyProduction,
  writeJsonAtomic,
} from '../scripts/hero-video-rollout.mjs';

type HeroVideoSource = {
  id: string;
  sourcePath: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
};

type ProductionIdentity = { bytes: number; sha256: string };
type RolloutContext = Parameters<typeof runCandidateBatch>[0];
type RolloutManifest = RolloutContext['manifest'];
type PromotionEntry = { state: 'INTENT' | 'COMPLETED' };

const HERO_SOURCES = HERO_VIDEO_SOURCES as readonly HeroVideoSource[];

const EXPECTED_MP4 = [
  'public/assets/hero/bedroom-bed-forward.mp4',
  'public/assets/hero/bedroom-bed-reverse.mp4',
  'public/assets/hero/bedroom-chair-forward.mp4',
  'public/assets/hero/bedroom-chair-reverse.mp4',
  'public/assets/hero/chair-forward.mp4',
  'public/assets/hero/chair-reverse.mp4',
  'public/assets/hero/kitchen-dining-forward.mp4',
  'public/assets/hero/kitchen-dining-reverse.mp4',
  'public/assets/hero/kitchen-island-forward.mp4',
  'public/assets/hero/kitchen-island-reverse.mp4',
  'public/assets/hero/sofa-forward.mp4',
  'public/assets/hero/sofa-reverse.mp4',
  'public/assets/hero/terrace-chair-forward.mp4',
  'public/assets/hero/terrace-chair-reverse.mp4',
  'public/assets/hero/terrace-sofa-forward.mp4',
  'public/assets/hero/terrace-sofa-reverse.mp4',
] as const;
const EXPECTED_WEBM = EXPECTED_MP4.map((file) => file.replace(/\.mp4$/u, '.webm'));
const EXPECTED_HASHES = [
  '34c684217333b446253485a15659999d6e465d7ac52902f8a7f657cf35370ed1',
  '84b9481ca9ec1e6a049ba5955c902431c1876b37ed051b0a202bbc46e20ee8fa',
  '8f192f5a2e735116340391cda3db0f17caeb91102ec69c97b6d624d86b0dc0e7',
  'a48d8f03959196904a5eedd7241435c57b00740ad56cc1d416a98729b9a91cc4',
  '830bfcdf25fc3af7b137e4fdcace3775dafcf7f1b02a05aba340b0fc6ae0e3de',
  'a458d20808a0c843a1deb0afaf812613bb34303dfcc0f7fc4a99990a03ac1ed8',
  '1a2b06356edab8950d2c3ab6cc47fb8e96e13453e3dc3dceff38fda0ef88d5ac',
  '89e1aef8be033d717cd652a15a41669e6d5aeae63374aed6fee2075331fa6dc9',
  '8b0347469a1d3dafdbbd35c1da90ab6dbb2046163de5286a09cab9517c3de8c2',
  '7ebab953d4fa7abaca66a452ea2bcac00528d94be0cfe314c9ac9f75c9ee9c1f',
  '97928b8a8659750df9cd89fc2109f57a943413564b6d320214c8bc7c43de6655',
  'dd38f87e057a9a13176ff7a35bc624419c4102fd61aae6b4b19044fa4d4177f5',
  'e375a3c87f142df574abe4371967a4fcba99356067ff6c716292e746d615381f',
  '726404a4e234fad318b65609a9dfcb838e878cc7eb21f30743e49d2dca686c6d',
  '68c5db691631c94f141a230fe5f37f9f74e7115302b57398b4dfb036065d4892',
  '1683f5051bcf4f91e946af436fcbd894ed3cd76d08d2446d8306e44a9494973c',
] as const;
const EXPECTED_BYTES = [
  3979743, 3211117, 6476041, 5437362, 9022617, 7696268, 6138461, 5330779, 4664253, 4013620, 6918992, 5679663, 8556765,
  7382094, 9941316, 8627076,
] as const;
const source = HERO_SOURCES[0];
const paths = resolveRolloutPaths('D:/repo', 'phase-6c-rollout-20260901-01');
const passingCandidate = {
  sourceId: source.id,
  format: 'webm' as const,
  quality: 28 as const,
  attempt: 1,
  candidatePath: 'candidates/bedroom-bed-forward.webm',
  bytes: source.bytes - 1,
  sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  probe: {
    codecName: 'vp9',
    width: 1168,
    height: 768,
    pixelFormat: 'yuv420p',
    rFrameRate: '24/1',
    avgFrameRate: '24/1',
    packets: 145,
    durationSeconds: 6.041667,
    videoStreams: 1,
    audioStreams: 0,
    attachedPictures: 0,
    streamTags: { encoder: 'Lavc libvpx-vp9' },
    formatTags: Object.create(null),
  },
  vmaf: 95,
  playback: {
    loadeddata: true,
    playing: true,
    ended: true,
    error: null,
    events: ['loadeddata', 'playing', 'ended'],
    url: 'http://127.0.0.1:43210/candidate',
    browserVersion: '148.0.7778.0',
  },
};

function makeAcceptedCandidates() {
  return HERO_SOURCES.flatMap((item) => [
    {
      ...passingCandidate,
      sourceId: item.id,
      format: 'webm' as const,
      quality: 28 as const,
      candidatePath: `candidates/${item.id}.webm`,
      bytes: Math.floor((item.bytes * 55) / 100),
      probe: { ...passingCandidate.probe, width: item.width, height: item.height },
    },
    {
      ...passingCandidate,
      sourceId: item.id,
      format: 'mp4' as const,
      quality: 20 as const,
      candidatePath: `candidates/${item.id}.mp4`,
      bytes: item.bytes - 1,
      probe: {
        ...passingCandidate.probe,
        codecName: 'h264',
        width: item.width,
        height: item.height,
        streamTags: { encoder: 'Lavc libx264' },
        formatTags: { major_brand: 'isom', minor_version: '512', compatible_brands: 'isomiso2avc1mp41' },
      },
    },
  ]);
}

function makeDependencies(
  options: {
    acceptedCandidates?: ReturnType<typeof makeAcceptedCandidates>;
    candidateAssessments?: Array<{ accepted: boolean; failedGates: string[] }>;
    failProductionRenameAt?: number;
    failFinalCompletionReceipt?: boolean;
    failPartialCleanup?: boolean;
    immutableVerificationFailure?: string;
    symlinkPaths?: string[];
    nonFilePaths?: string[];
    realpathEscapes?: Map<string, string>;
    preflightFailure?: 'missing-ffmpeg' | 'baseline-drift' | 'protected-drift' | 'unsafe-target';
    promotedIdentityFailure?: string;
    failRollbackCopy?: boolean;
    platform?: NodeJS.Platform;
    failDirectorySync?: boolean;
    rejectReadOnlyFileSync?: boolean;
  } = Object.create(null),
) {
  const paths = resolveRolloutPaths('D:/repo', 'phase-6c-rollout-20260901-01');
  const productionDirectory = path.resolve('D:/repo/public/assets/hero').replaceAll('\\', '/');
  const acceptedCandidates = options.acceptedCandidates ?? [];
  const productionMutations: string[] = [];
  const workspaceMutations: string[] = [];
  const filesystemReceipts: Array<{
    operation: string;
    mode: 'OBSERVE' | 'MUTATE';
    path: string;
    secondaryPath: string | null;
  }> = [];
  const removedWorkspacePaths: string[] = [];
  const productionMp4 = new Map<string, string>(EXPECTED_MP4.map((path, index) => [path, EXPECTED_HASHES[index]]));
  const productionWebm = new Set<string>();
  const temporaryIdentity = new Map<string, { bytes: number; sha256: string }>();
  const temporaryFiles = new Set<string>();
  const symlinkPaths = new Set((options.symlinkPaths ?? []).map((target) => target.replaceAll('\\', '/')));
  const nonFilePaths = new Set((options.nonFilePaths ?? []).map((target) => target.replaceAll('\\', '/')));
  let sequence = 0;
  let manifestRenameCalls = 0;
  let productionPromotionRenameCalls = 0;
  let productionRollbackRenameCalls = 0;
  let injectedRenameFailure = false;
  let fileSyncCalls = 0;
  let fileCloseCalls = 0;
  let directorySyncCalls = 0;
  let directoryCloseCalls = 0;
  let productionDirectorySyncCalls = 0;
  let productionDirectoryCloseCalls = 0;
  const openFlags: Array<{ target: string; flags: string }> = [];
  const calls = {
    verifyImmutableSources: 0,
    immutableVerificationSequence: 0,
    firstMutationSequence: Number.POSITIVE_INFINITY,
    preMutationSnapshotSequence: 0,
    firstProductionMutationSequence: Number.POSITIVE_INFINITY,
  };
  const markMutation = (operation: string, path: string, secondaryPath: string | null = null) => {
    sequence += 1;
    calls.firstMutationSequence = Math.min(calls.firstMutationSequence, sequence);
    if (path.includes('/.superpowers/sdd/phase-6c-hero-video-rollout/')) workspaceMutations.push(path);
    else {
      productionMutations.push(path);
      calls.firstProductionMutationSequence = Math.min(calls.firstProductionMutationSequence, sequence);
    }
    filesystemReceipts.push({ operation, mode: 'MUTATE', path, secondaryPath });
  };
  const markObservation = (operation: string, target: string) =>
    filesystemReceipts.push({ operation, mode: 'OBSERVE', path: target, secondaryPath: null });
  const identityFor = (target: string): ProductionIdentity => {
    const normalized = target.replaceAll('\\', '/');
    const temporary = temporaryIdentity.get(normalized);
    if (temporary) return temporary;
    const backupSource = HERO_SOURCES.find(({ sourcePath }) => normalized.endsWith(`/backups/${sourcePath}`));
    if (backupSource) return { bytes: backupSource.bytes, sha256: backupSource.sha256 };
    const originalSource = HERO_SOURCES.find(({ sourcePath }) => normalized.endsWith(`/${sourcePath}`));
    if (originalSource && !normalized.endsWith('.webm')) {
      const productionHash = productionMp4.get(originalSource.sourcePath) ?? originalSource.sha256;
      const candidate = acceptedCandidates.find(
        ({ sourceId, format }) => sourceId === originalSource.id && format === 'mp4',
      );
      return {
        bytes:
          productionHash === originalSource.sha256 ? originalSource.bytes : (candidate?.bytes ?? originalSource.bytes),
        sha256: productionHash,
      };
    }
    const productionWebmPath = WEBM_PROMOTION_ALLOWLIST.find((relative) => normalized.endsWith(`/${relative}`));
    if (productionWebmPath && productionWebm.has(productionWebmPath)) {
      const id = productionWebmPath.replace('public/assets/hero/', '').replace('.webm', '');
      const candidate = acceptedCandidates.find(({ sourceId, format }) => sourceId === id && format === 'webm');
      return { bytes: candidate?.bytes ?? 0, sha256: candidate?.sha256 ?? '0'.repeat(64) };
    }
    const candidate = acceptedCandidates.find(({ candidatePath }) =>
      normalized.endsWith(`/runs/phase-6c-rollout-20260901-01/${candidatePath}`),
    );
    return candidate ? { bytes: candidate.bytes, sha256: candidate.sha256 } : { bytes: 1, sha256: 'b'.repeat(64) };
  };
  const manifest = {
    schemaVersion: 1 as const,
    runId: 'phase-6c-rollout-20260901-01',
    implementationBaseline: '1111111111111111111111111111111111111111',
    pilotHarnessCommit: '7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe' as const,
    status: acceptedCandidates.length === 32 ? ('VALIDATED' as const) : ('VALIDATED' as const),
    productionState: 'UNCHANGED' as const,
    immutableSources: HERO_SOURCES,
    backupSources: HERO_SOURCES.map((item) => ({
      sourcePath: item.sourcePath,
      backupPath: `backups/${item.sourcePath}`,
      bytes: item.bytes,
      sha256: item.sha256,
    })),
    candidates: acceptedCandidates,
    aggregate:
      acceptedCandidates.length === 32
        ? computeAggregateReduction(
            acceptedCandidates.filter(({ format }) => format === 'webm').reduce((sum, item) => sum + item.bytes, 0),
          )
        : null,
    production: [],
    promotionAttempt: null,
    failure: null,
    receipts: acceptedCandidates.map((candidate, index) => ({
      sequence: index + 1,
      kind: 'browser-playback',
      sourceId: candidate.sourceId,
      format: candidate.format,
      quality: candidate.quality,
      attempt: candidate.attempt,
      candidateSha256: candidate.sha256,
      status: 'SUCCEEDED' as const,
      executable: null,
      args: [candidate.candidatePath],
      exitCode: 0,
      artifactPath: candidate.candidatePath,
      artifactSha256: candidate.sha256,
    })),
    filesystemReceipts: [],
  } as RolloutManifest;
  const dependencies = {
    audit: filesystemReceipts,
    preflight: vi.fn(async () => options.preflightFailure ?? null),
    exists: vi.fn(async (target: string) => {
      markObservation('exists', target);
      const normalized = target.replace('D:/repo/', '').replaceAll('\\', '/');
      if (normalized.startsWith('public/assets/hero/') && normalized.endsWith('.webm'))
        return productionWebm.has(normalized);
      if (normalized.endsWith('.tmp')) return temporaryIdentity.has(target.replaceAll('\\', '/'));
      return true;
    }),
    realpath: vi.fn(async (target: string) => {
      markObservation('realpath', target);
      const escaped = options.realpathEscapes?.get(target.replaceAll('\\', '/'));
      if (escaped) return escaped;
      return target.replaceAll('\\', '/');
    }),
    lstat: vi.fn(async (target: string) => {
      markObservation('lstat', target);
      const normalized = target.replaceAll('\\', '/');
      return {
        isFile: () => !nonFilePaths.has(normalized),
        isDirectory: () => !path.extname(target),
        isSymbolicLink: () => symlinkPaths.has(normalized),
        size: identityFor(target).bytes,
      };
    }),
    stat: vi.fn(async (target: string) => {
      markObservation('stat', target);
      return {
        isFile: () => true,
        isSymbolicLink: () => false,
        size: identityFor(target).bytes,
      };
    }),
    readFile: vi.fn(async (target: string) => {
      markObservation('readFile', target);
      return Buffer.from('in-memory-fixture');
    }),
    hashFile: vi.fn(async (target: string) => identityFor(target).sha256),
    verifyImmutableSources: vi.fn(async () => {
      sequence += 1;
      calls.verifyImmutableSources += 1;
      if (options.immutableVerificationFailure) throw new Error(options.immutableVerificationFailure);
      calls.immutableVerificationSequence = sequence;
    }),
    verifyPromotedTrackedIdentity: vi.fn(async () => {
      if (options.promotedIdentityFailure) throw new Error(options.promotedIdentityFailure);
    }),
    assertPreMutationSnapshot: vi.fn(async () => {
      sequence += 1;
      calls.preMutationSnapshotSequence = sequence;
    }),
    encodeProbeMetricAndPlay: vi.fn(
      async (item: HeroVideoSource, format: 'webm' | 'mp4', quality: 28 | 24 | 20 | 18, attempt: number) => ({
        ...passingCandidate,
        sourceId: item.id,
        format,
        quality,
        attempt,
        candidatePath: `candidates/${item.id}.${format}`,
        bytes: Math.floor(item.bytes * 0.55),
        probe: {
          ...passingCandidate.probe,
          codecName: format === 'webm' ? 'vp9' : 'h264',
          width: item.width,
          height: item.height,
        },
      }),
    ),
    assessCandidate: vi.fn(async () => options.candidateAssessments?.shift() ?? { accepted: true, failedGates: [] }),
    playCandidate: vi.fn(async () => ({
      loadeddata: true,
      playing: true,
      ended: true,
      error: null,
      events: ['loadeddata', 'playing', 'ended'],
      url: 'http://127.0.0.1:43210/candidate',
      browserVersion: '148.0.7778.0',
    })),
    copyFile: vi.fn(async (from: string, to: string) => {
      if (options.failRollbackCopy && from.includes('/backups/')) throw new Error('Injected rollback copy failure.');
      markMutation('copyFile', to, from);
      temporaryIdentity.set(to.replaceAll('\\', '/'), identityFor(from));
    }),
    rename: vi.fn(async (from: string, to: string) => {
      markMutation('rename', to, from);
      const normalizedTo = to.replaceAll('\\', '/');
      if (normalizedTo === paths.manifest) {
        manifestRenameCalls += 1;
        if (!injectedRenameFailure && options.failFinalCompletionReceipt && productionPromotionRenameCalls === 32) {
          injectedRenameFailure = true;
          throw new Error('Injected final completion receipt failure.');
        }
      } else if (/^D:\/repo\/public\/assets\/hero\/.+\.(mp4|webm)$/u.test(normalizedTo)) {
        if (from.endsWith('.phase-6c-rollout.tmp')) productionPromotionRenameCalls += 1;
        if (from.endsWith('.phase-6c-rollback.tmp')) productionRollbackRenameCalls += 1;
      }
      if (!injectedRenameFailure && productionPromotionRenameCalls === options.failProductionRenameAt) {
        injectedRenameFailure = true;
        throw new Error(`Injected production rename failure ${productionPromotionRenameCalls}.`);
      }
      const identity = identityFor(from);
      const relative = to.replace('D:/repo/', '').replaceAll('\\', '/');
      if (relative.endsWith('.webm')) productionWebm.add(relative);
      if (relative.endsWith('.mp4')) productionMp4.set(relative, identity.sha256);
      temporaryIdentity.delete(from.replaceAll('\\', '/'));
      temporaryFiles.delete(from.replaceAll('\\', '/'));
    }),
    unlink: vi.fn(async (target: string) => {
      if (options.failPartialCleanup && target.endsWith('manifest.json.partial'))
        throw new Error('Injected partial cleanup failure.');
      markMutation('unlink', target);
      if (target.includes('/.superpowers/sdd/phase-6c-hero-video-rollout/')) removedWorkspacePaths.push(target);
      productionWebm.delete(target.replace('D:/repo/', ''));
      temporaryIdentity.delete(target.replaceAll('\\', '/'));
      temporaryFiles.delete(target.replaceAll('\\', '/'));
    }),
    mkdir: vi.fn(async (target: string) => {
      markMutation('mkdir', target);
    }),
    readdir: vi.fn(async (target: string) => {
      markObservation('readdir', target);
      return [];
    }),
    writeFile: vi.fn(async (target: string, _data: Buffer, options: { flag: 'wx' }) => {
      if (options.flag !== 'wx') throw new Error('Atomic manifest write must use wx.');
      const normalized = target.replaceAll('\\', '/');
      if (temporaryFiles.has(normalized)) {
        const error = new Error('EEXIST');
        Object.assign(error, { code: 'EEXIST' });
        throw error;
      }
      markMutation('writeFile', target);
      temporaryFiles.add(normalized);
    }),
    open: vi.fn(async (target: string, flags: string) => {
      openFlags.push({ target, flags });
      if (flags === 'r+') markMutation('open', target);
      else markObservation('open', target);
      const normalizedTarget = target.replaceAll('\\', '/');
      const isProductionDirectory = normalizedTarget === productionDirectory;
      const isDirectory = normalizedTarget === path.dirname(paths.manifest) || isProductionDirectory;
      return {
        sync: vi.fn(async () => {
          if (isDirectory) {
            directorySyncCalls += 1;
            if (isProductionDirectory) productionDirectorySyncCalls += 1;
            if (options.failDirectorySync) {
              const error = new Error('EPERM: operation not permitted, fsync');
              Object.assign(error, { code: 'EPERM' });
              throw error;
            }
          } else {
            if (options.rejectReadOnlyFileSync && flags === 'r') {
              const error = new Error('EPERM: operation not permitted, fsync');
              Object.assign(error, { code: 'EPERM' });
              throw error;
            }
            fileSyncCalls += 1;
          }
        }),
        close: vi.fn(async () => {
          if (isDirectory) {
            directoryCloseCalls += 1;
            if (isProductionDirectory) productionDirectoryCloseCalls += 1;
          } else {
            fileCloseCalls += 1;
          }
        }),
      };
    }),
    platform: options.platform ?? 'linux',
    spawn: vi.fn(),
  };
  return {
    context: {
      repositoryRoot: 'D:/repo',
      runId: 'phase-6c-rollout-20260901-01',
      implementationBaseline: '1111111111111111111111111111111111111111',
      paths,
      manifest,
      dependencies,
      filesystemReceipts,
    },
    calls,
    productionMutations,
    removedWorkspacePaths,
    workspaceMutations,
    filesystemReceipts,
    durability: () => ({ fileSyncCalls, fileCloseCalls, directorySyncCalls, directoryCloseCalls }),
    productionDirectoryDurability: () => ({
      sync: productionDirectorySyncCalls,
      close: productionDirectoryCloseCalls,
    }),
    renameCounters: () => ({
      manifest: manifestRenameCalls,
      promotion: productionPromotionRenameCalls,
      rollback: productionRollbackRenameCalls,
    }),
    productionHashes: () => EXPECTED_MP4.map((path) => productionMp4.get(path)!),
    corruptProduction: (relative: string) => productionMp4.set(relative, 'f'.repeat(64)),
    existingProductionWebm: () => [...productionWebm].sort(),
    openFlags: () => [...openFlags],
  };
}

describe('hero video rollout harness', () => {
  it('locks all sixteen immutable source paths, bytes, hashes, and dimensions', () => {
    expect(HERO_SOURCES.map(({ sourcePath }) => sourcePath)).toEqual(EXPECTED_MP4);
    expect(HERO_SOURCES.map(({ bytes }) => bytes)).toEqual(EXPECTED_BYTES);
    expect(HERO_SOURCES.map(({ sha256 }) => sha256)).toEqual(EXPECTED_HASHES);
    expect(HERO_SOURCES.map(({ width, height }) => `${width}x${height}`)).toEqual([
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x784',
      '1168x784',
      '1168x784',
      '1168x784',
      '1168x768',
      '1168x768',
      '1168x784',
      '1168x784',
      '1168x784',
      '1168x784',
    ]);
    expect(EXPECTED_BYTES.reduce((sum, bytes) => sum + bytes, 0)).toBe(103076167);
  });

  it('exports exact sixteen MP4 and sixteen WebM promotion targets', () => {
    expect(MP4_PROMOTION_ALLOWLIST).toEqual(EXPECTED_MP4);
    expect(WEBM_PROMOTION_ALLOWLIST).toEqual(EXPECTED_MP4.map((file) => file.replace(/\.mp4$/, '.webm')));
    expect(new Set([...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST]).size).toBe(32);
    const absence = buildWebmAbsenceGates('D:/repo', '1'.repeat(40));
    expect(absence.gitChecks).toHaveLength(48);
    expect(absence.worktreeWebmTargets).toEqual(
      WEBM_PROMOTION_ALLOWLIST.map((relative) => path.resolve('D:/repo', relative)),
    );
    expect(absence.temporarySiblings).toHaveLength(64);
  });

  it('rejects missing, extra, duplicate, or reordered source identities', () => {
    expect(() => validateSourceInventory(HERO_SOURCES.slice(1))).toThrow('Source inventory identity mismatch.');
    expect(() => validateSourceInventory([...HERO_SOURCES, HERO_SOURCES[0]])).toThrow(
      'Source inventory identity mismatch.',
    );
    expect(() => validateSourceInventory([...HERO_SOURCES, HERO_SOURCES[0]].slice(1))).toThrow(
      'Source inventory identity mismatch.',
    );
    expect(() => validateSourceInventory([...HERO_SOURCES].reverse())).toThrow('Source inventory identity mismatch.');
  });

  it('rejects lexical symlink, non-file, and realpath-escaping artifacts before resolution', async () => {
    const sourceTarget = path.resolve('D:/repo', source.sourcePath).replaceAll('\\', '/');
    const candidateTarget = path.resolve(paths.runRoot, passingCandidate.candidatePath).replaceAll('\\', '/');
    const backupTarget = path.resolve(paths.runRoot, `backups/${source.sourcePath}`).replaceAll('\\', '/');
    for (const target of [sourceTarget, candidateTarget, backupTarget]) {
      const fixture = makeDependencies({ symlinkPaths: [target] });
      await expect(assertContainedRegularFile(paths.runRoot, target, fixture.context.dependencies)).rejects.toThrow(
        'Owned artifact must be a regular non-link file.',
      );
      expect(fixture.context.dependencies.realpath).not.toHaveBeenCalledWith(target);
    }
    const nonFile = makeDependencies({ nonFilePaths: [candidateTarget] });
    await expect(
      assertContainedRegularFile(paths.runRoot, candidateTarget, nonFile.context.dependencies),
    ).rejects.toThrow('Owned artifact must be a regular non-link file.');
    const escaped = makeDependencies({ realpathEscapes: new Map([[candidateTarget, 'D:/outside/candidate.webm']]) });
    await expect(
      assertContainedRegularFile(paths.runRoot, candidateTarget, escaped.context.dependencies),
    ).rejects.toThrow('Path escapes owned root.');
  });

  it('verifies immutable sources before any run manifest or candidate mutation', async () => {
    const fixture = makeDependencies({ immutableVerificationFailure: 'pre-generation drift' });
    const manifest = await runCandidateBatch(fixture.context);
    expect(manifest).toMatchObject({
      status: 'BLOCKED',
      productionState: 'UNCHANGED',
      failure: { failedGates: ['immutableSource'], reason: expect.stringContaining('pre-generation drift') },
    });
    expect(fixture.context.dependencies.verifyImmutableSources).toHaveBeenCalledOnce();
    expect(fixture.context.dependencies.encodeProbeMetricAndPlay).not.toHaveBeenCalled();
    expect(fixture.workspaceMutations).toEqual([]);
    expect(fixture.productionMutations).toEqual([]);
  });

  it('builds deterministic VP9 CQ28 two-pass commands with isolated passlogs', () => {
    const expectedInput = path.resolve(paths.repositoryRoot, source.sourcePath).replaceAll('\\', '/');
    const expectedOutput = path.resolve(paths.candidates, `${source.id}.webm`).replaceAll('\\', '/');
    const expectedPasslog = path.resolve(paths.passlogs, `${source.id}-webm-28`).replaceAll('\\', '/');
    expect(buildCandidateInvocations(source, 'webm', 28, paths)).toEqual([
      {
        kind: 'encode-pass-1',
        executable: 'ffmpeg',
        args: [
          '-y',
          '-i',
          expectedInput,
          '-map',
          '0:v:0',
          '-an',
          '-map_metadata',
          '-1',
          '-vf',
          'fps=24,format=yuv420p',
          '-c:v',
          'libvpx-vp9',
          '-crf',
          '28',
          '-b:v',
          '0',
          '-deadline',
          'good',
          '-cpu-used',
          '1',
          '-threads',
          '1',
          '-row-mt',
          '0',
          '-tile-columns',
          '0',
          '-frame-parallel',
          '0',
          '-pass',
          '1',
          '-passlogfile',
          expectedPasslog,
          '-fps_mode',
          'cfr',
          '-t',
          '6.041667',
          '-f',
          'null',
          'NUL',
        ],
        passlogPath: expectedPasslog,
        candidatePath: expectedOutput,
        sourcePath: expectedInput,
      },
      {
        kind: 'encode-pass-2',
        executable: 'ffmpeg',
        args: [
          '-y',
          '-i',
          expectedInput,
          '-map',
          '0:v:0',
          '-an',
          '-map_metadata',
          '-1',
          '-vf',
          'fps=24,format=yuv420p',
          '-c:v',
          'libvpx-vp9',
          '-crf',
          '28',
          '-b:v',
          '0',
          '-deadline',
          'good',
          '-cpu-used',
          '1',
          '-threads',
          '1',
          '-row-mt',
          '0',
          '-tile-columns',
          '0',
          '-frame-parallel',
          '0',
          '-pass',
          '2',
          '-passlogfile',
          expectedPasslog,
          '-fps_mode',
          'cfr',
          '-t',
          '6.041667',
          '-f',
          'webm',
          expectedOutput,
        ],
        passlogPath: expectedPasslog,
        candidatePath: expectedOutput,
        sourcePath: expectedInput,
      },
    ]);
    const cq24 = buildCandidateInvocations(source, 'webm', 24, paths);
    const expectedCq24Passlog = path.resolve(paths.passlogs, `${source.id}-webm-24`).replaceAll('\\', '/');
    expect(cq24).toEqual([
      {
        kind: 'encode-pass-1',
        executable: 'ffmpeg',
        args: [
          '-y',
          '-i',
          expectedInput,
          '-map',
          '0:v:0',
          '-an',
          '-map_metadata',
          '-1',
          '-vf',
          'fps=24,format=yuv420p',
          '-c:v',
          'libvpx-vp9',
          '-crf',
          '24',
          '-b:v',
          '0',
          '-deadline',
          'good',
          '-cpu-used',
          '1',
          '-threads',
          '1',
          '-row-mt',
          '0',
          '-tile-columns',
          '0',
          '-frame-parallel',
          '0',
          '-pass',
          '1',
          '-passlogfile',
          expectedCq24Passlog,
          '-fps_mode',
          'cfr',
          '-t',
          '6.041667',
          '-f',
          'null',
          'NUL',
        ],
        passlogPath: expectedCq24Passlog,
        candidatePath: expectedOutput,
        sourcePath: expectedInput,
      },
      {
        kind: 'encode-pass-2',
        executable: 'ffmpeg',
        args: [
          '-y',
          '-i',
          expectedInput,
          '-map',
          '0:v:0',
          '-an',
          '-map_metadata',
          '-1',
          '-vf',
          'fps=24,format=yuv420p',
          '-c:v',
          'libvpx-vp9',
          '-crf',
          '24',
          '-b:v',
          '0',
          '-deadline',
          'good',
          '-cpu-used',
          '1',
          '-threads',
          '1',
          '-row-mt',
          '0',
          '-tile-columns',
          '0',
          '-frame-parallel',
          '0',
          '-pass',
          '2',
          '-passlogfile',
          expectedCq24Passlog,
          '-fps_mode',
          'cfr',
          '-t',
          '6.041667',
          '-f',
          'webm',
          expectedOutput,
        ],
        passlogPath: expectedCq24Passlog,
        candidatePath: expectedOutput,
        sourcePath: expectedInput,
      },
    ]);
    expect(timeoutForInvocation({ kind: 'encode-pass-1' })).toBe(900000);
    expect(timeoutForInvocation({ kind: 'encode-pass-2' })).toBe(900000);
    expect(timeoutForInvocation({ kind: 'probe' })).toBe(120000);
    expect(timeoutForInvocation({ kind: 'vmaf' })).toBe(120000);
  });

  it('permits only a VP9 CQ24 retry after a failed CQ28 assessment', () => {
    for (const gate of [
      'codec',
      'dimensions',
      'pixelFormat',
      'rFrameRate',
      'avgFrameRate',
      'packets',
      'duration',
      'videoStreams',
      'audioStreams',
      'attachedPictures',
      'metadata',
      'vmaf',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'RETRY' as const };
      expect(nextQuality('webm', 28, failed), gate).toBe(24);
      expect(classifyFailure('webm', 28, [gate]), gate).toBe('RETRY');
      expect(nextQuality('webm', 24, failed), gate).toBeNull();
      expect(classifyFailure('webm', 24, [gate]), gate).toBe('NO_CHANGE');
    }
    for (const gate of ['playback']) {
      const failed = { accepted: false, failedGates: [gate], classification: 'NO_CHANGE' as const };
      expect(nextQuality('webm', 28, failed), gate).toBeNull();
      expect(classifyFailure('webm', 28, [gate]), gate).toBe('NO_CHANGE');
    }
    for (const gate of [
      'immutableSource',
      'toolchain',
      'process',
      'containment',
      'receiptIdentity',
      'promotionBoundary',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'BLOCKED' as const };
      expect(nextQuality('webm', 28, failed), gate).toBeNull();
      expect(classifyFailure('webm', 28, [gate]), gate).toBe('BLOCKED');
    }
    expect(() => buildCandidateInvocations(source, 'webm', 20, paths)).toThrow('Invalid WebM quality.');
    expect(classifyFailure('webm', 28, ['vmaf', 'size'])).toBe('NO_CHANGE');
    expect(classifyFailure('webm', 28, ['size'])).toBe('NO_CHANGE');
    expect(classifyFailure('webm', 28, ['vmaf', 'playback'])).toBe('NO_CHANGE');
  });

  it('builds deterministic H.264 CRF20 commands with faststart', () => {
    const expectedInput = path.resolve(paths.repositoryRoot, source.sourcePath).replaceAll('\\', '/');
    const expectedOutput = path.resolve(paths.candidates, `${source.id}.mp4`).replaceAll('\\', '/');
    const expected = (quality: 20 | 18) => [
      {
        kind: 'encode',
        executable: 'ffmpeg',
        args: [
          '-y',
          '-i',
          expectedInput,
          '-map',
          '0:v:0',
          '-an',
          '-map_metadata',
          '-1',
          '-vf',
          'fps=24,format=yuv420p',
          '-c:v',
          'libx264',
          '-crf',
          String(quality),
          '-preset',
          'slow',
          '-threads',
          '1',
          '-movflags',
          '+faststart',
          '-fps_mode',
          'cfr',
          '-t',
          '6.041667',
          '-f',
          'mp4',
          expectedOutput,
        ],
        candidatePath: expectedOutput,
        sourcePath: expectedInput,
      },
    ];
    expect(buildCandidateInvocations(source, 'mp4', 20, paths)).toEqual(expected(20));
    expect(buildCandidateInvocations(source, 'mp4', 18, paths)).toEqual(expected(18));
  });

  it('permits only an H.264 CRF18 retry after a failed CRF20 assessment', () => {
    for (const gate of [
      'codec',
      'dimensions',
      'pixelFormat',
      'rFrameRate',
      'avgFrameRate',
      'packets',
      'duration',
      'videoStreams',
      'audioStreams',
      'attachedPictures',
      'metadata',
      'vmaf',
      'size',
      'playback',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'RETRY' as const };
      expect(nextQuality('mp4', 20, failed), gate).toBe(18);
      expect(classifyFailure('mp4', 20, [gate]), gate).toBe('RETRY');
      expect(nextQuality('mp4', 18, failed), gate).toBeNull();
      expect(classifyFailure('mp4', 18, [gate]), gate).toBe('NO_CHANGE');
    }
    for (const gate of [
      'immutableSource',
      'toolchain',
      'process',
      'containment',
      'receiptIdentity',
      'promotionBoundary',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'BLOCKED' as const };
      expect(nextQuality('mp4', 20, failed), gate).toBeNull();
      expect(classifyFailure('mp4', 20, [gate]), gate).toBe('BLOCKED');
    }
    expect(() => buildCandidateInvocations(source, 'mp4', 24, paths)).toThrow('Invalid MP4 quality.');
  });

  it('maps primary stream, strips audio and metadata, and preserves CFR duration', () => {
    for (const format of ['webm', 'mp4'] as const) {
      const quality = format === 'webm' ? 28 : 20;
      for (const invocation of buildCandidateInvocations(source, format, quality, paths)) {
        expect(invocation.args).toEqual(
          expect.arrayContaining([
            '-map',
            '0:v:0',
            '-an',
            '-map_metadata',
            '-1',
            '-vf',
            'fps=24,format=yuv420p',
            '-fps_mode',
            'cfr',
            '-t',
            '6.041667',
          ]),
        );
      }
    }
    const vp9 = parseProbe(
      JSON.stringify({
        streams: [
          {
            index: 0,
            codec_type: 'video',
            codec_name: 'vp9',
            width: 1168,
            height: 768,
            pix_fmt: 'yuv420p',
            r_frame_rate: '24/1',
            avg_frame_rate: '24/1',
            nb_read_packets: '145',
            disposition: { attached_pic: 0 },
            tags: { ENCODER: 'Lavc libvpx-vp9' },
          },
        ],
        format: { duration: '6.041667', tags: {} },
      }),
      'webm',
    );
    const h264 = parseProbe(
      JSON.stringify({
        streams: [
          {
            index: 0,
            codec_type: 'video',
            codec_name: 'h264',
            width: 1168,
            height: 784,
            pix_fmt: 'yuv420p',
            r_frame_rate: '24/1',
            avg_frame_rate: '24/1',
            nb_read_packets: '145',
            disposition: { attached_pic: 0 },
            tags: { encoder: 'Lavc libx264' },
          },
        ],
        format: {
          duration: '6.041667',
          tags: { major_brand: 'isom', minor_version: '512', compatible_brands: 'isomiso2avc1mp41', encoder: 'Lavf' },
        },
      }),
      'mp4',
    );
    expect(vp9).toMatchObject({
      codecName: 'vp9',
      width: 1168,
      height: 768,
      rFrameRate: '24/1',
      avgFrameRate: '24/1',
      packets: 145,
      videoStreams: 1,
      audioStreams: 0,
      attachedPictures: 0,
    });
    expect(h264).toMatchObject({
      codecName: 'h264',
      width: 1168,
      height: 784,
      rFrameRate: '24/1',
      avgFrameRate: '24/1',
      packets: 145,
      videoStreams: 1,
      audioStreams: 0,
      attachedPictures: 0,
      streamTags: { encoder: 'Lavc libx264' },
      formatTags: { major_brand: 'isom', minor_version: '512', compatible_brands: 'isomiso2avc1mp41', encoder: 'Lavf' },
    });
    expect(() =>
      parseProbe(
        JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'vp9',
              width: 1168,
              height: 768,
              pix_fmt: 'yuv420p',
              r_frame_rate: '24/1',
              avg_frame_rate: '24/1',
              nb_read_packets: '145',
              disposition: { attached_pic: 0 },
              tags: { title: 'inherited' },
            },
          ],
          format: { duration: '6.041667', tags: {} },
        }),
        'webm',
      ),
    ).toThrow('Forbidden stream metadata tag: title');
    expect(() =>
      parseProbe(
        JSON.stringify({
          streams: [
            {
              ...JSON.parse(
                JSON.stringify({
                  codec_type: 'video',
                  codec_name: 'vp9',
                  width: 1168,
                  height: 768,
                  pix_fmt: 'yuv420p',
                  r_frame_rate: '24/1',
                  avg_frame_rate: '24/1',
                  nb_read_packets: '145',
                  disposition: { attached_pic: 0 },
                }),
              ),
            },
          ],
          format: { duration: '6.041667', tags: { comment: 'inherited' } },
        }),
        'webm',
      ),
    ).toThrow('Forbidden format metadata tag: comment');
  });

  it('places candidate at VMAF input 0 and immutable reference at input 1', () => {
    const metric = buildMetricInvocation(source, passingCandidate, paths);
    expect(metric.args).toEqual([
      '-v',
      'error',
      '-i',
      metric.candidatePath,
      '-i',
      metric.sourcePath,
      '-lavfi',
      `[0:v][1:v]libvmaf=log_fmt=json:log_path=${source.id}-webm-28.json`,
      '-f',
      'null',
      'NUL',
    ]);
    expect(metric.args.filter((argument) => argument === '-lavfi')).toHaveLength(1);
    expect(metric.args).not.toContain('[0:v][1:v]libvmaf');
    expect(metric.cwd).toBe(paths.metrics);
    expect(metric.reportPath).toBe(path.resolve(paths.metrics, `${source.id}-webm-28.json`));
    const filter = metric.args[metric.args.indexOf('-lavfi') + 1];
    expect(filter).toBe(`[0:v][1:v]libvmaf=log_fmt=json:log_path=${source.id}-webm-28.json`);
    expect(filter).not.toMatch(/[A-Z]:|\\\\/u);
    expect(metric.args.at(-1)).toBe('NUL');
    const promoted = buildPromotedMetricInvocation(
      source,
      {
        path: `public/assets/hero/${source.id}.webm`,
        bytes: passingCandidate.bytes,
        sha256: passingCandidate.sha256,
        format: 'webm',
      },
      paths,
    );
    expect(promoted.args).toEqual([
      '-v',
      'error',
      '-i',
      promoted.candidatePath,
      '-i',
      promoted.sourcePath,
      '-lavfi',
      `[0:v][1:v]libvmaf=log_fmt=json:log_path=${source.id}-webm-post-promotion.json`,
      '-f',
      'null',
      'NUL',
    ]);
  });

  it('rejects dimensions, pixel format, FPS, packet, duration, stream, audio, picture, or metadata drift', () => {
    const mutations = [
      { probe: { ...passingCandidate.probe, width: 1167 } },
      { probe: { ...passingCandidate.probe, pixelFormat: 'yuv444p' } },
      { probe: { ...passingCandidate.probe, rFrameRate: '25/1' } },
      { probe: { ...passingCandidate.probe, avgFrameRate: '25/1' } },
      { probe: { ...passingCandidate.probe, packets: 144 } },
      { probe: { ...passingCandidate.probe, durationSeconds: 6.042668 } },
      { probe: { ...passingCandidate.probe, videoStreams: 2 } },
      { probe: { ...passingCandidate.probe, audioStreams: 1 } },
      { probe: { ...passingCandidate.probe, attachedPictures: 1 } },
      { probe: { ...passingCandidate.probe, streamTags: { title: 'stale' } } },
    ];
    for (const mutation of mutations) {
      expect(assessCandidate(source, { ...passingCandidate, ...mutation }).accepted).toBe(false);
    }
  });

  it('requires VMAF at least 95 and candidate bytes below its own source', () => {
    expect(assessCandidate(source, passingCandidate).accepted).toBe(true);
    expect(assessCandidate(source, { ...passingCandidate, vmaf: 94.999999 }).failedGates).toContain('vmaf');
    expect(assessCandidate(source, { ...passingCandidate, bytes: source.bytes }).failedGates).toContain('size');
  });

  it('requires Chromium ended evidence without media error for every candidate', () => {
    expect(assessCandidate(source, passingCandidate).accepted).toBe(true);
    for (const playback of [
      { ...passingCandidate.playback, events: ['loadeddata', 'ended'] },
      { ...passingCandidate.playback, events: ['playing', 'loadeddata', 'ended'] },
      { ...passingCandidate.playback, events: ['loadeddata', 'playing', 'ended', 'ended'] },
      { ...passingCandidate.playback, url: 'https://example.com/candidate' },
      { ...passingCandidate.playback, url: '' },
      { ...passingCandidate.playback, browserVersion: '' },
      { ...passingCandidate.playback, browserVersion: '147.0.0.0' },
      { ...passingCandidate.playback, ended: false, error: 'MEDIA_ERR_DECODE' },
    ]) {
      expect(assessCandidate(source, { ...passingCandidate, playback }).failedGates).toContain('playback');
    }
    const candidates = makeAcceptedCandidates();
    const finalReceipts = candidates.map((candidate, index) => ({
      sequence: index + 1,
      kind: 'browser-playback',
      sourceId: candidate.sourceId,
      format: candidate.format,
      quality: candidate.quality,
      attempt: candidate.attempt,
      candidateSha256: candidate.sha256,
      status: 'SUCCEEDED' as const,
      executable: null,
      args: [candidate.candidatePath],
      exitCode: 0,
      artifactPath: candidate.candidatePath,
      artifactSha256: candidate.sha256,
    }));
    const stale = {
      ...finalReceipts[0],
      sequence: 1,
      attempt: finalReceipts[0].attempt + 1,
      status: 'SUCCEEDED' as const,
    };
    const manifest = {
      ...makeDependencies({ acceptedCandidates: candidates }).context.manifest,
      receipts: [stale, ...finalReceipts].map((receipt, index) => ({ ...receipt, sequence: index + 1 })),
    };
    expect(assertFinalReceiptCoverage(manifest)).toHaveLength(32);
    expect(() =>
      assertFinalReceiptCoverage({
        ...manifest,
        receipts: [...manifest.receipts, { ...finalReceipts[0], sequence: 34 }],
      }),
    ).toThrow('Final receipt mismatch');
    expect(
      assessCandidate(source, {
        ...passingCandidate,
        playback: {
          ...passingCandidate.playback,
          loadeddata: true,
          playing: false,
          ended: false,
          error: 'MEDIA_ERR_DECODE',
        },
      }).failedGates,
    ).toContain('playback');
  });

  it('uses exact integer aggregate reduction math against 103076167 bytes', () => {
    const fixtureWebmBytes = makeAcceptedCandidates()
      .filter(({ format }) => format === 'webm')
      .reduce((sum, candidate) => sum + candidate.bytes, 0);
    expect(fixtureWebmBytes).toBeLessThanOrEqual(61845700);
    expect(computeAggregateReduction(61845700)).toMatchObject({ passed: true, reductionBytes: 41230467 });
    expect(computeAggregateReduction(61845701).passed).toBe(false);
    expect(computeAggregateReduction(61845700).reductionPercent).toBeCloseTo((41230467 * 100) / 103076167, 12);
  });

  it('refuses promotion until all thirty-two final candidates pass', async () => {
    const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates().slice(0, 31) });
    const terminal = await promoteValidatedBatch(fixture.context);
    expect(terminal).toMatchObject({
      status: 'BLOCKED',
      productionState: 'UNCHANGED',
      failure: { reason: 'Validated candidate coverage must equal 32.' },
    });
    expect(fixture.productionMutations).toEqual([]);
    expect(fixture.context.manifest.promotionAttempt).toBeNull();
    expect(fixture.context.manifest.status).toBe('BLOCKED');
  });

  it('rehashes every original immediately before promotion', async () => {
    const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
    await promoteValidatedBatch(fixture.context);
    expect(fixture.calls.verifyImmutableSources).toBe(1);
    expect(fixture.calls.firstMutationSequence).toBeGreaterThan(fixture.calls.immutableVerificationSequence);
    expect(fixture.calls.firstProductionMutationSequence).toBeGreaterThan(fixture.calls.preMutationSnapshotSequence);
    expect(fixture.workspaceMutations).toContain(`${paths.manifest}.partial`);
    expect(fixture.workspaceMutations).toContain(paths.manifest);
    expect(fixture.context.dependencies.realpath).toHaveBeenCalledWith(paths.runRoot);
    expect(fixture.context.dependencies.realpath).toHaveBeenCalledWith(path.dirname(paths.manifest));
    expect(fixture.context.manifest.promotionAttempt?.entries).toHaveLength(32);
    expect(
      fixture.context.manifest.promotionAttempt?.entries.every(({ state }: PromotionEntry) => state === 'COMPLETED'),
    ).toBe(true);
    const firstProductionCopy = fixture.filesystemReceipts.findIndex(
      ({ operation, path }) => operation === 'copyFile' && path.startsWith('D:/repo/public/assets/hero/'),
    );
    expect(firstProductionCopy).toBeGreaterThan(0);
    expect(
      fixture.filesystemReceipts
        .slice(0, firstProductionCopy)
        .some(({ operation, path }) => operation === 'writeFile' && path === `${paths.manifest}.partial`),
    ).toBe(true);
    await expect(
      writeJsonAtomic(paths.runRoot, 'D:/repo/outside.json', {}, fixture.context.dependencies),
    ).rejects.toThrow('New path parent escapes owned root.');
  });

  it('skips unsupported Windows directory fsync after atomic rename while syncing the file', async () => {
    const fixture = makeDependencies({ platform: 'win32', failDirectorySync: true, rejectReadOnlyFileSync: true });

    await expect(
      writeJsonAtomic(paths.runRoot, paths.manifest, fixture.context.manifest, fixture.context.dependencies),
    ).resolves.toBeUndefined();

    expect(fixture.durability()).toEqual({
      fileSyncCalls: 1,
      fileCloseCalls: 1,
      directorySyncCalls: 0,
      directoryCloseCalls: 0,
    });
    expect(fixture.context.dependencies.writeFile).toHaveBeenCalledWith(
      `${paths.manifest}.partial`,
      expect.any(Buffer),
      { flag: 'wx' },
    );
    expect(fixture.openFlags()).toEqual([{ target: `${paths.manifest}.partial`, flags: 'r+' }]);
    expect(fixture.filesystemReceipts).toContainEqual({
      operation: 'open',
      mode: 'MUTATE',
      path: `${paths.manifest}.partial`,
      secondaryPath: null,
    });
    expect(fixture.context.dependencies.rename).toHaveBeenCalledWith(`${paths.manifest}.partial`, paths.manifest);
  });

  it('retains non-Windows directory fsync after atomic rename while syncing the file', async () => {
    const fixture = makeDependencies({ platform: 'linux', rejectReadOnlyFileSync: true });

    await expect(
      writeJsonAtomic(paths.runRoot, paths.manifest, fixture.context.manifest, fixture.context.dependencies),
    ).resolves.toBeUndefined();

    expect(fixture.durability()).toEqual({
      fileSyncCalls: 1,
      fileCloseCalls: 1,
      directorySyncCalls: 1,
      directoryCloseCalls: 1,
    });
    expect(fixture.context.dependencies.writeFile).toHaveBeenCalledWith(
      `${paths.manifest}.partial`,
      expect.any(Buffer),
      { flag: 'wx' },
    );
    expect(fixture.context.dependencies.open).toHaveBeenNthCalledWith(1, `${paths.manifest}.partial`, 'r+');
    expect(fixture.context.dependencies.open).toHaveBeenNthCalledWith(2, path.dirname(paths.manifest), 'r');
    expect(fixture.openFlags()).toEqual([
      { target: `${paths.manifest}.partial`, flags: 'r+' },
      { target: path.dirname(paths.manifest), flags: 'r' },
    ]);
    expect(fixture.context.dependencies.rename).toHaveBeenCalledWith(`${paths.manifest}.partial`, paths.manifest);
  });

  it('promotes on Windows when production directory fsync is unsupported', async () => {
    const fixture = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      platform: 'win32',
      failDirectorySync: true,
      rejectReadOnlyFileSync: true,
    });

    const terminal = await promoteValidatedBatch(fixture.context);

    expect(terminal).toMatchObject({ status: 'PROMOTED', productionState: 'VERIFIED' });
    expect(fixture.context.manifest.production).toHaveLength(32);
    expect(fixture.durability()).toMatchObject({ fileSyncCalls: 130, fileCloseCalls: 130 });
    expect(fixture.renameCounters()).toEqual({ manifest: 98, promotion: 32, rollback: 0 });
    expect(fixture.productionDirectoryDurability()).toEqual({ sync: 0, close: 0 });
    const productionFileOpens = fixture
      .openFlags()
      .filter(({ target }) => target.includes('/public/assets/hero/') && target.endsWith('.phase-6c-rollout.tmp'));
    expect(productionFileOpens).toHaveLength(32);
    expect(productionFileOpens.every(({ flags }) => flags === 'r+')).toBe(true);
  });

  it('retains production directory fsync after non-Windows promotion', async () => {
    const fixture = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      platform: 'linux',
      rejectReadOnlyFileSync: true,
    });

    const terminal = await promoteValidatedBatch(fixture.context);

    expect(terminal).toMatchObject({ status: 'PROMOTED', productionState: 'VERIFIED' });
    expect(fixture.durability()).toMatchObject({ fileSyncCalls: 130, fileCloseCalls: 130 });
    expect(fixture.renameCounters()).toEqual({ manifest: 98, promotion: 32, rollback: 0 });
    expect(fixture.productionDirectoryDurability()).toEqual({ sync: 1, close: 1 });
    const productionFileOpens = fixture
      .openFlags()
      .filter(({ target }) => target.includes('/public/assets/hero/') && target.endsWith('.phase-6c-rollout.tmp'));
    expect(productionFileOpens).toHaveLength(32);
    expect(productionFileOpens.every(({ flags }) => flags === 'r+')).toBe(true);
    const productionDirectory = path.resolve('D:/repo/public/assets/hero').replaceAll('\\', '/');
    expect(fixture.openFlags().find(({ target }) => target === productionDirectory)).toEqual({
      target: productionDirectory,
      flags: 'r',
    });
  });

  it('rolls back exact production rename faults at counters 1, 17, and 32', async () => {
    for (const fault of [
      { failProductionRenameAt: 1, message: 'Injected production rename failure 1.' },
      { failProductionRenameAt: 17, message: 'Injected production rename failure 17.' },
      { failProductionRenameAt: 32, message: 'Injected production rename failure 32.' },
    ]) {
      const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates(), ...fault });
      const terminal = await promoteValidatedBatch(fixture.context);
      expect(terminal.failure?.reason).toContain(fault.message);
      expect(
        fixture.productionMutations.every((target) =>
          [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST].some(
            (allowed) =>
              target.endsWith(allowed) ||
              target.endsWith(`${allowed}.phase-6c-rollout.tmp`) ||
              target.endsWith(`${allowed}.phase-6c-rollback.tmp`),
          ),
        ),
      ).toBe(true);
      expect(fixture.productionHashes()).toEqual(EXPECTED_HASHES);
      expect(fixture.existingProductionWebm()).toEqual([]);
      expect(fixture.context.manifest).toMatchObject({ status: 'NO_CHANGE', productionState: 'ROLLED_BACK' });
      expect(fixture.renameCounters().manifest).toBeGreaterThan(0);
      expect(fixture.renameCounters().promotion).toBe(fault.failProductionRenameAt);
      expect(fixture.renameCounters().rollback).toBe(16);
    }
  });

  it('rolls back a separate final manifest completion-receipt failure', async () => {
    const fixture = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      failFinalCompletionReceipt: true,
    });
    const terminal = await promoteValidatedBatch(fixture.context);
    expect(terminal).toMatchObject({
      status: 'NO_CHANGE',
      productionState: 'ROLLED_BACK',
      failure: { reason: 'Injected final completion receipt failure.' },
    });
    expect(fixture.renameCounters()).toEqual({ manifest: expect.any(Number), promotion: 32, rollback: 16 });
    expect(fixture.productionHashes()).toEqual(EXPECTED_HASHES);
    expect(fixture.existingProductionWebm()).toEqual([]);
    expect(fixture.context.dependencies.writeFile.mock.calls.every(([, , options]) => options.flag === 'wx')).toBe(
      true,
    );
  });

  it('blocks with unknown production state when failed manifest cleanup cannot be proven', async () => {
    const fixture = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      failFinalCompletionReceipt: true,
      failPartialCleanup: true,
    });
    const terminal = await promoteValidatedBatch(fixture.context);
    expect(terminal).toMatchObject({
      status: 'BLOCKED',
      productionState: 'UNKNOWN',
      failure: {
        reason: expect.stringContaining('Injected final completion receipt failure.'),
      },
    });
    expect(terminal.production).toHaveLength(32);
    expect(fixture.existingProductionWebm()).toEqual([]);
  });

  it('promotes and later rolls back only literal allowlisted paths', async () => {
    const postPromotion = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
    await promoteValidatedBatch(postPromotion.context);
    const cliResult = manifestResult('run', postPromotion.context.manifest);
    expect(cliResult).toMatchObject({ command: 'run', status: 'PROMOTED', exitCode: 0 });
    expect(cliResult.production).toHaveLength(32);
    expect(JSON.parse(JSON.stringify(cliResult))).toEqual(cliResult);
    postPromotion.corruptProduction(EXPECTED_MP4[0]);
    const recovered = await verifyProduction(postPromotion.context);
    expect(recovered.status).toBe('NO_CHANGE');
    expect(postPromotion.productionHashes()).toEqual(EXPECTED_HASHES);
    expect(postPromotion.existingProductionWebm()).toEqual([]);
    const identityMismatch = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'index mismatch',
    });
    await promoteValidatedBatch(identityMismatch.context);
    const identityResult = await verifyProduction(identityMismatch.context);
    expect(manifestResult('verify-production', identityResult)).toMatchObject({
      status: 'NO_CHANGE',
      exitCode: 2,
      productionState: 'ROLLED_BACK',
      production: [],
    });
    const unknown = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'index mismatch',
      failRollbackCopy: true,
    });
    await promoteValidatedBatch(unknown.context);
    const unknownResult = await verifyProduction(unknown.context);
    expect(manifestResult('verify-production', unknownResult)).toMatchObject({
      status: 'BLOCKED',
      exitCode: 1,
      productionState: 'UNKNOWN',
    });
    expect(manifestResult('verify-production', unknownResult).production).toHaveLength(32);
    const reportMismatch = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'report index mismatch',
    });
    await promoteValidatedBatch(reportMismatch.context);
    const reportNoChange = await reportPromotedRollout(reportMismatch.context);
    expect(manifestResult('report', reportNoChange)).toMatchObject({
      command: 'report',
      status: 'NO_CHANGE',
      exitCode: 2,
      productionState: 'ROLLED_BACK',
      production: [],
    });
    const reportUnknown = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'report index mismatch',
      failRollbackCopy: true,
    });
    await promoteValidatedBatch(reportUnknown.context);
    const reportBlocked = await reportPromotedRollout(reportUnknown.context);
    expect(manifestResult('report', reportBlocked)).toMatchObject({
      command: 'report',
      status: 'BLOCKED',
      exitCode: 1,
      productionState: 'UNKNOWN',
    });
    expect(manifestResult('report', reportBlocked).production).toHaveLength(32);
    const rollbackUnlinks = postPromotion.filesystemReceipts
      .filter(
        ({ operation, path }) =>
          operation === 'unlink' && path.startsWith('D:/repo/public/assets/hero/') && path.endsWith('.webm'),
      )
      .map(({ path }) => path.replace('D:/repo/', ''))
      .sort();
    expect(rollbackUnlinks).toEqual([...WEBM_PROMOTION_ALLOWLIST].sort());
    const observedOperations = new Set(postPromotion.filesystemReceipts.map(({ operation }) => operation));
    expect(
      ['exists', 'realpath', 'lstat', 'stat', 'copyFile', 'rename', 'unlink', 'writeFile', 'open'].every((operation) =>
        observedOperations.has(operation),
      ),
    ).toBe(true);
    const crashed = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
    crashed.context.manifest.promotionAttempt = {
      id: 'phase-6c-rollout-20260901-01-promotion-1',
      mutationStarted: true,
      entries: [
        {
          targetRelative: EXPECTED_MP4[0],
          temporaryRelative: `${EXPECTED_MP4[0]}.phase-6c-rollout.tmp`,
          format: 'mp4',
          candidateSha256: 'a'.repeat(64),
          originalSha256: EXPECTED_HASHES[0],
          state: 'COMPLETED',
        },
      ],
    };
    crashed.corruptProduction(EXPECTED_MP4[0]);
    const crashResult = await recoverInterruptedPromotion(crashed.context);
    expect(crashResult.status).toBe('NO_CHANGE');
    expect(crashed.productionHashes()).toEqual(EXPECTED_HASHES);
  });

  it('returns NO_CHANGE after one failed higher-quality retry without production mutation', async () => {
    const fixture = makeDependencies({
      candidateAssessments: [
        { accepted: false, failedGates: ['vmaf'] },
        { accepted: false, failedGates: ['vmaf'] },
      ],
    });
    const manifest = await runCandidateBatch(fixture.context);
    expect(manifest).toMatchObject({
      status: 'NO_CHANGE',
      failure: { sourceId: source.id, format: 'webm', quality: 24, failedGates: ['vmaf'] },
    });
    expect(fixture.context.dependencies.encodeProbeMetricAndPlay).toHaveBeenNthCalledWith(
      1,
      source,
      'webm',
      28,
      1,
      fixture.context,
    );
    expect(fixture.context.dependencies.encodeProbeMetricAndPlay).toHaveBeenNthCalledWith(
      2,
      source,
      'webm',
      24,
      2,
      fixture.context,
    );
    expect(fixture.productionMutations).toEqual([]);
    expect(fixture.removedWorkspacePaths).toEqual([
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/candidates/bedroom-bed-forward.webm',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-28-0.log',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-28-0.log.mbtree',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/candidates/bedroom-bed-forward.webm',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-24-0.log',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-24-0.log.mbtree',
    ]);
  });

  it('returns BLOCKED for tool, baseline, protected-file, or promotion-boundary drift', async () => {
    for (const failure of ['missing-ffmpeg', 'baseline-drift', 'protected-drift', 'unsafe-target'] as const) {
      const fixture = makeDependencies({ preflightFailure: failure });
      const manifest = await runCandidateBatch(fixture.context);
      expect(manifest.status).toBe('BLOCKED');
      expect(manifest.failure?.reason).toContain(failure);
      expect(fixture.productionMutations).toEqual([]);
    }
    expect(commandPreflightPolicy('characterize')).toEqual({ requireGenerationBoundary: true });
    expect(commandPreflightPolicy('run')).toEqual({ requireGenerationBoundary: true });
    expect(commandPreflightPolicy('verify-production')).toEqual({ requireGenerationBoundary: false });
    expect(commandPreflightPolicy('report')).toEqual({ requireGenerationBoundary: false });
    expect(commandPreflightPolicy('recover')).toEqual({ requireGenerationBoundary: false });
    const terminal = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() }).context.manifest;
    terminal.status = 'NO_CHANGE';
    expect(manifestResult('run', terminal)).toMatchObject({
      command: 'run',
      status: 'NO_CHANGE',
      exitCode: 2,
      productionState: 'UNCHANGED',
      production: [],
    });

    const production = [...EXPECTED_MP4, ...EXPECTED_WEBM].map((productionPath, index) => ({
      path: productionPath,
      format: productionPath.endsWith('.webm') ? ('webm' as const) : ('mp4' as const),
      bytes: index + 1,
      sha256: index.toString(16).padStart(64, '0'),
    }));
    const aggregate = computeAggregateReduction(61_000_000);
    const refreshedVmaf = production.map(({ path: productionPath, format }) => ({
      sourceId: productionPath.replace('public/assets/hero/', '').replace(/\.(mp4|webm)$/u, ''),
      format,
      value: 96,
    }));
    const cases = [
      {
        command: 'characterize',
        result: {
          command: 'characterize',
          status: 'CHARACTERIZED',
          exitCode: 0,
          sources: 16,
          sourceBytes: 103_076_167,
          mp4Targets: 16,
          webmTargets: 16,
          productionState: 'UNCHANGED',
          production: [],
        },
      },
      {
        command: 'run',
        result: {
          command: 'run',
          status: 'PROMOTED',
          exitCode: 0,
          reason: null,
          productionState: 'VERIFIED',
          aggregate,
          production,
        },
      },
      {
        command: 'recover',
        result: {
          command: 'recover',
          status: 'NO_CHANGE',
          exitCode: 2,
          reason: 'recovered',
          productionState: 'ROLLED_BACK',
          aggregate,
          production: [],
        },
      },
      {
        command: 'verify-production',
        result: {
          command: 'verify-production',
          status: 'BLOCKED',
          exitCode: 1,
          productionState: 'UNKNOWN',
          aggregate,
          production,
          reason: 'unproven rollback',
        },
      },
      {
        command: 'report',
        result: {
          command: 'report',
          status: 'PROMOTED',
          exitCode: 0,
          productionState: 'VERIFIED',
          verdict: 'ROLLOUT_READY_LOCAL',
          aggregate,
          production,
          refreshedVmaf,
          playbackReceipts: 32,
          backups: 16,
        },
      },
    ] as const;
    const exactCliKeys = {
      characterize: [
        'command',
        'exitCode',
        'mp4Targets',
        'production',
        'productionState',
        'sourceBytes',
        'sources',
        'status',
        'webmTargets',
      ],
      run: ['aggregate', 'command', 'exitCode', 'production', 'productionState', 'reason', 'status'],
      recover: ['aggregate', 'command', 'exitCode', 'production', 'productionState', 'reason', 'status'],
      'verify-production': ['aggregate', 'command', 'exitCode', 'production', 'productionState', 'reason', 'status'],
      report: [
        'aggregate',
        'backups',
        'command',
        'exitCode',
        'playbackReceipts',
        'production',
        'productionState',
        'refreshedVmaf',
        'status',
        'verdict',
      ],
    } as const;
    const assertAggregateSchema = (value: unknown) => {
      expect(value).not.toBeNull();
      expect(typeof value).toBe('object');
      const item = value as Record<string, unknown>;
      expect(Object.keys(item).sort()).toEqual(
        ['originalBytes', 'passed', 'reductionBytes', 'reductionPercent', 'webmBytes'].sort(),
      );
      expect(typeof item.originalBytes).toBe('number');
      expect(typeof item.webmBytes).toBe('number');
      expect(typeof item.reductionBytes).toBe('number');
      expect(typeof item.reductionPercent).toBe('number');
      expect(typeof item.passed).toBe('boolean');
    };
    for (const item of cases) {
      const output: string[] = [];
      const previousExitCode = process.exitCode;
      const consoleLog = vi.spyOn(console, 'log').mockImplementation((line) => output.push(String(line)));
      try {
        const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
        const cliManifest = structuredClone(fixture.context.manifest);
        cliManifest.implementationBaseline = '1'.repeat(40);
        cliManifest.aggregate = aggregate;
        cliManifest.production = production;
        cliManifest.status = item.command === 'characterize' ? 'CHARACTERIZED' : 'PROMOTED';
        cliManifest.failure = null;
        cliManifest.promotionAttempt = null;
        if (item.command === 'recover') {
          cliManifest.status = 'GENERATING';
          cliManifest.promotionAttempt = { id: 'attempt-cli-recover', mutationStarted: true, entries: [] };
        }
        const characterized = structuredClone(cliManifest);
        characterized.status = 'CHARACTERIZED';
        const promoted = structuredClone(cliManifest);
        promoted.status = 'PROMOTED';
        promoted.productionState = 'VERIFIED';
        promoted.failure = null;
        const recovered = structuredClone(cliManifest);
        recovered.status = 'NO_CHANGE';
        recovered.productionState = 'ROLLED_BACK';
        recovered.production = [];
        recovered.failure = {
          sourceId: null,
          format: null,
          quality: null,
          failedGates: ['promotionBoundary'],
          reason: 'recovered',
        };
        const blocked = structuredClone(promoted);
        blocked.status = 'BLOCKED';
        blocked.productionState = 'UNKNOWN';
        blocked.failure = {
          sourceId: null,
          format: null,
          quality: null,
          failedGates: ['promotionBoundary'],
          reason: 'unproven rollback',
        };
        const operations = {
          loadManifest: vi.fn(async () => cliManifest),
          characterizeRollout: vi.fn(async () => characterized),
          runCandidateBatch: vi.fn(async () => promoted),
          recoverInterruptedPromotion: vi.fn(async () => recovered),
          verifyProduction: vi.fn(async () => blocked),
          reportPromotedRollout: vi.fn(async () => ({
            status: 'ROLLOUT_READY_LOCAL',
            backups: 16,
            production,
            refreshedVmaf,
            playbackReceipts: 32,
            aggregate,
          })),
          assertGenerationBoundary: vi.fn(async () => undefined),
        };
        const exitCode = await main(
          [item.command, '--run-id', 'phase-6c-rollout-20260901-01', '--implementation-baseline', '1'.repeat(40)],
          { ...fixture.context.dependencies, ...operations },
        );
        expect(exitCode).toBe(item.result.exitCode);
        expect(process.exitCode).toBe(item.result.exitCode);
        expect(output).toHaveLength(1);
        const decoded = JSON.parse(output[0]);
        expect(Object.keys(decoded).sort()).toEqual([...exactCliKeys[item.command]].sort());
        expect(decoded.command).toBe(item.command);
        expect(decoded.status).toBe(item.result.status);
        expect(decoded.exitCode).toBe(item.result.exitCode);
        expect(decoded.productionState).toBe(item.result.productionState);
        expect(typeof decoded.command).toBe('string');
        expect(typeof decoded.status).toBe('string');
        expect(typeof decoded.exitCode).toBe('number');
        expect(typeof decoded.productionState).toBe('string');
        if ('reason' in decoded) {
          if (item.command === 'run') expect(decoded.reason).toBeNull();
          else expect(typeof decoded.reason).toBe('string');
        }
        if ('aggregate' in decoded) assertAggregateSchema(decoded.aggregate);
        expect(Array.isArray(decoded.production)).toBe(true);
        if (item.command === 'characterize') {
          expect(decoded).toMatchObject({ sources: 16, sourceBytes: 103_076_167, mp4Targets: 16, webmTargets: 16 });
          expect(decoded.production).toEqual([]);
        }
        if (item.command === 'characterize') expect(operations.characterizeRollout).toHaveBeenCalledOnce();
        if (item.command === 'run') expect(operations.runCandidateBatch).toHaveBeenCalledOnce();
        if (item.command === 'recover') expect(operations.recoverInterruptedPromotion).toHaveBeenCalledOnce();
        if (item.command === 'verify-production') expect(operations.verifyProduction).toHaveBeenCalledOnce();
        if (item.command === 'report') expect(operations.reportPromotedRollout).toHaveBeenCalledOnce();
        if (decoded.production.length === 32) {
          expect(decoded.production.map(({ path: productionPath }: { path: string }) => productionPath).sort()).toEqual(
            [...EXPECTED_MP4, ...EXPECTED_WEBM].sort(),
          );
          expect(
            decoded.production.every(
              ({
                path: productionPath,
                format,
                bytes,
                sha256,
              }: {
                path: string;
                format: string;
                bytes: number;
                sha256: string;
              }) =>
                Object.keys(decoded.production.find(({ path }: { path: string }) => path === productionPath))
                  .sort()
                  .join() === ['bytes', 'format', 'path', 'sha256'].sort().join() &&
                typeof productionPath === 'string' &&
                ['mp4', 'webm'].includes(format) &&
                Number.isInteger(bytes) &&
                bytes > 0 &&
                typeof sha256 === 'string' &&
                productionPath.endsWith(`.${format}`) &&
                /^[0-9a-f]{64}$/u.test(sha256),
            ),
          ).toBe(true);
        }
        if (item.command === 'report') {
          expect(decoded.backups).toBe(16);
          expect(decoded.playbackReceipts).toBe(32);
          expect(decoded.verdict).toBe('ROLLOUT_READY_LOCAL');
          expect(Array.isArray(decoded.refreshedVmaf)).toBe(true);
          expect(decoded.refreshedVmaf).toHaveLength(32);
          for (const receipt of decoded.refreshedVmaf) {
            expect(Object.keys(receipt).sort()).toEqual(['format', 'sourceId', 'value']);
            expect(typeof receipt.sourceId).toBe('string');
            expect(['mp4', 'webm']).toContain(receipt.format);
            expect(typeof receipt.value).toBe('number');
          }
        }
      } finally {
        consoleLog.mockRestore();
        process.exitCode = previousExitCode;
      }
    }
    expect(cases[2].result).toMatchObject({ status: 'NO_CHANGE', productionState: 'ROLLED_BACK', production: [] });
    expect(cases[3].result.production).toHaveLength(32);
    expect(cases[4].result.refreshedVmaf).toHaveLength(32);
    expect(cases[4].result.aggregate).toMatchObject({
      originalBytes: 103_076_167,
      webmBytes: 61_000_000,
      passed: true,
    });
  });
});
