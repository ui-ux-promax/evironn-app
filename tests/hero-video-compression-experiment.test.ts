import { mkdtemp, mkdir, readFile, symlink, unlink, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

// Objective harness tests exercise real filesystem and child-process boundaries.
// Keep their suite-local budget above the repository's 5-second default.
vi.setConfig({ testTimeout: 30_000 });
import {
  ENCODE_SOURCE_CONTRACTS,
  PAIR_CONTRACTS,
  STATUS,
  VISUAL_SUPPORT_CONTRACTS,
  assessPair,
  buildEncodeInvocations,
  buildMetricInvocations,
  buildProbeInvocations,
  buildVisualInvocations,
  createRun,
  enumerateOwnedRunFiles,
  nextReceiptSequence,
  main,
  recordDecision,
  recordObservations,
  openRun,
  resolveExperimentRoot,
  resolveRunPaths,
  runGuardedBrowserPlayback,
  runGuardedProcess,
  validateManifestIdentity,
  verifyImmutableInputs,
  writeManifestAtomic,
} from '../scripts/hero-video-compression-experiment.mjs';
import * as harness from '../scripts/hero-video-compression-experiment.mjs';

const BASELINE = '4704a3158732a1701f6c65cd6191e563239aee91';
const HARNESS = '1111111111111111111111111111111111111111';
const SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
type PairContract = (typeof PAIR_CONTRACTS)[number];
type CandidateRecord = ReturnType<typeof candidate>;
type VisualInvocation = ReturnType<typeof buildVisualInvocations>[number];

function testIndexBytes(ids: string[]) {
  return Buffer.from(`<!doctype html><html><body>${ids.join(',')}</body></html>`);
}

function testVisualReceipts(paths: any, pairs: any[], indexRelativePath = 'visuals/index.html', indexBytes: Buffer) {
  const receipts: any[] = [
    {
      kind: 'direct-playback-index',
      pairId: null,
      direction: null,
      frameIndex: null,
      timeSeconds: null,
      relativePath: indexRelativePath,
      bytes: indexBytes.length,
      sha256: hash(indexBytes),
      authority: 'PRIMARY_DIRECT_PLAYBACK',
    },
  ];
  for (const pair of pairs)
    for (const item of buildVisualInvocations(pair, paths, 1)) {
      if (!item.artifactRelativePath) continue;
      const bytes = readFileSync(path.resolve(paths.runRoot, item.artifactRelativePath));
      const frame = item.artifactRelativePath.match(/-(forward|reverse)-frame-(000|072|144)\.png$/);
      const sequence = item.artifactRelativePath.endsWith('-forward-focus-reverse.mp4');
      receipts.push({
        kind: frame ? 'lossless-frame' : sequence ? 'local-sequence' : 'direct-playback-index',
        pairId: pair.pairId,
        direction: frame ? frame[1] : null,
        frameIndex: frame ? Number(frame[2]) : null,
        timeSeconds: frame ? { 0: 0, 72: 3, 144: 6 }[Number(frame[2])] : null,
        relativePath: item.artifactRelativePath,
        bytes: bytes.length,
        sha256: hash(bytes),
        authority: frame ? 'LOSSLESS_FRAME_EVIDENCE' : 'NON_AUTHORITATIVE_CONVENIENCE_RENDER',
      });
    }
  return receipts;
}

async function tempRepository() {
  return mkdtemp(path.join(os.tmpdir(), 'evironn-hero-video-'));
}

async function createdRun() {
  const repositoryRoot = await tempRepository();
  const manifest = await createRun(repositoryRoot, 'pilot-01', BASELINE, HARNESS);
  const paths = resolveRunPaths(repositoryRoot, 'pilot-01', 'open');
  return { repositoryRoot, manifest, paths };
}

function candidate(pairId = 'h264-crf18', direction = 'forward') {
  const pair = PAIR_CONTRACTS.find((entry: PairContract) => entry.pairId === pairId)!;
  return {
    ...pair,
    direction,
    sourceRelativePath:
      direction === 'forward' ? ENCODE_SOURCE_CONTRACTS[0].relativePath : ENCODE_SOURCE_CONTRACTS[1].relativePath,
    candidateRelativePath: `candidates/${pairId}-${direction}.${pair.extension}`,
  } as const;
}

function directionResult(direction: 'forward' | 'reverse', vmaf: number, bytes: number) {
  const probe = {
    metadataRelativePath: `probes/h264-crf18-${direction}-metadata.json`,
    streamsRelativePath: `probes/h264-crf18-${direction}-streams.json`,
    codecName: 'h264',
    profile: 'High',
    width: 1168,
    height: 784,
    pixelFormat: 'yuv420p',
    realFrameRate: '24/1',
    averageFrameRate: '24/1',
    packetCount: 145,
    durationSeconds: 6.041667,
    bitRate: 1000,
    bytes,
    videoStreamCount: 1,
    audioStreamCount: 0,
    attachedPictureCount: 0,
    contractPass: true,
  } as const;
  const metric = (kind: 'vmaf' | 'ssim' | 'psnr', value: number) => ({
    kind,
    relativePath: `metrics/h264-crf18-${direction}-${kind}.${kind === 'vmaf' ? 'json' : 'log'}`,
    value,
    sha256: SHA,
    distortedInput: { inputIndex: 0 as const, candidateRelativePath: `candidates/h264-crf18-${direction}.mp4` },
    referenceInput: {
      inputIndex: 1 as const,
      sourceRelativePath:
        direction === 'forward' ? ENCODE_SOURCE_CONTRACTS[0].relativePath : ENCODE_SOURCE_CONTRACTS[1].relativePath,
    },
    filterPadOrder: '[dist][ref]' as const,
  });
  return {
    direction,
    candidateRelativePath: `candidates/h264-crf18-${direction}.mp4`,
    candidateBytes: bytes,
    candidateSha256: SHA,
    probe,
    metrics: { vmaf: metric('vmaf', vmaf), ssim: metric('ssim', 0.99), psnr: metric('psnr', 45) },
    encodeReceiptSequences: [1],
    probeReceiptSequences: [2, 3],
    metricReceiptSequences: [4, 5, 6],
  };
}

function hash(value: Uint8Array | string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function completeNoChangeRun() {
  const repositoryRoot = await tempRepository();
  await createRun(repositoryRoot, 'zero-eligible', BASELINE, HARNESS);
  const paths = resolveRunPaths(repositoryRoot, 'zero-eligible', 'open');
  const commandReceipts: any[] = [];
  const pairResults: any[] = [];
  let sequence = 1;
  for (const pair of PAIR_CONTRACTS) {
    const directions: any = {};
    for (const direction of ['forward', 'reverse'] as const) {
      const spec = candidate(pair.pairId, direction);
      const candidateBytes = Buffer.from(`${pair.pairId}-${direction}`);
      const candidatePath = path.resolve(paths.runRoot, spec.candidateRelativePath);
      await mkdir(path.dirname(candidatePath), { recursive: true });
      await writeFile(candidatePath, candidateBytes);
      const probeMetadata = {
        streams: [
          {
            index: 0,
            codec_name: pair.codec === 'h264' ? 'h264' : pair.codec === 'vp9' ? 'vp9' : 'av1',
            profile: 'High',
            width: 1168,
            height: 784,
            pix_fmt: 'yuv420p',
            r_frame_rate: '24/1',
            avg_frame_rate: '24/1',
            nb_read_packets: 145,
            bit_rate: 1000,
          },
        ],
        format: { duration: 6.041667, bit_rate: 1000, size: candidateBytes.length },
      };
      const streamList = { streams: [{ index: 0, codec_type: 'video' }] };
      const probePaths = [
        [`probes/${pair.pairId}-${direction}-metadata.json`, Buffer.from(JSON.stringify(probeMetadata))],
        [`probes/${pair.pairId}-${direction}-streams.json`, Buffer.from(JSON.stringify(streamList))],
      ] as const;
      for (const [relative, bytes] of probePaths) {
        await mkdir(path.dirname(path.resolve(paths.runRoot, relative)), { recursive: true });
        await writeFile(path.resolve(paths.runRoot, relative), bytes);
      }
      const metricValues: Record<string, string> = {
        vmaf: JSON.stringify({ pooled_metrics: { vmaf: { mean: 94 } } }),
        ssim: 'All:0.99',
        psnr: 'average:40',
      };
      const metrics: any = {};
      for (const kind of ['vmaf', 'ssim', 'psnr'] as const) {
        const extension = kind === 'vmaf' ? 'json' : 'log';
        const relative = `metrics/${pair.pairId}-${direction}-${kind}.${extension}`;
        const bytes = Buffer.from(metricValues[kind]);
        await mkdir(path.dirname(path.resolve(paths.runRoot, relative)), { recursive: true });
        await writeFile(path.resolve(paths.runRoot, relative), bytes);
        metrics[kind] = {
          kind,
          relativePath: relative,
          value: kind === 'vmaf' ? 94 : kind === 'ssim' ? 0.99 : 40,
          sha256: hash(bytes),
          distortedInput: { inputIndex: 0, candidateRelativePath: spec.candidateRelativePath },
          referenceInput: { inputIndex: 1, sourceRelativePath: spec.sourceRelativePath },
          filterPadOrder: '[dist][ref]',
        };
      }
      if (pair.codec === 'vp9') {
        const passlog = `passlogs/${pair.pairId}-${direction}-0.log`;
        await mkdir(path.dirname(path.resolve(paths.runRoot, passlog)), { recursive: true });
        await writeFile(path.resolve(paths.runRoot, passlog), Buffer.from('passlog'));
      }
      const directionSequence = sequence;
      for (const item of [
        ...buildEncodeInvocations(spec, paths, directionSequence),
        ...buildProbeInvocations(spec, paths, directionSequence + (pair.codec === 'vp9' ? 2 : 1)),
        ...buildMetricInvocations(spec, paths, directionSequence + (pair.codec === 'vp9' ? 4 : 3)),
      ]) {
        const kind =
          item.executable === 'ffprobe'
            ? item.artifactRelativePath!.endsWith('-metadata.json')
              ? 'probe-metadata'
              : 'probe-streams'
            : item.artifactRelativePath?.includes('-vmaf.')
              ? 'vmaf'
              : item.artifactRelativePath?.includes('-ssim.')
                ? 'ssim'
                : item.artifactRelativePath?.includes('-psnr.')
                  ? 'psnr'
                  : 'encode';
        const probeBytes = item.artifactRelativePath?.endsWith('-metadata.json')
          ? probePaths[0][1]
          : item.artifactRelativePath?.endsWith('-streams.json')
            ? probePaths[1][1]
            : null;
        commandReceipts.push({
          sequence: item.sequence,
          kind,
          pairId: pair.pairId,
          direction,
          executable: item.executable,
          displayArgs: item.args,
          cwd: '.',
          exitCode: 0,
          startedAt: '2026-08-31T00:00:00.000Z',
          finishedAt: '2026-08-31T00:00:01.000Z',
          stdoutSha256: probeBytes ? hash(probeBytes) : null,
          stderrSha256: null,
          artifactRelativePath: item.artifactRelativePath,
          immutableCheckBefore: SHA,
          immutableCheckAfter: SHA,
        });
      }
      sequence += pair.codec === 'vp9' ? 7 : 6;
      directions[direction] = {
        direction,
        candidateRelativePath: spec.candidateRelativePath,
        candidateBytes: candidateBytes.length,
        candidateSha256: hash(candidateBytes),
        probe: {
          metadataRelativePath: probePaths[0][0],
          streamsRelativePath: probePaths[1][0],
          codecName: probeMetadata.streams[0].codec_name,
          profile: 'High',
          width: 1168,
          height: 784,
          pixelFormat: 'yuv420p',
          realFrameRate: '24/1',
          averageFrameRate: '24/1',
          packetCount: 145,
          durationSeconds: 6.041667,
          bitRate: 1000,
          bytes: candidateBytes.length,
          videoStreamCount: 1,
          audioStreamCount: 0,
          attachedPictureCount: 0,
          contractPass: true,
        },
        metrics,
        encodeReceiptSequences: commandReceipts
          .filter((entry) => entry.pairId === pair.pairId && entry.direction === direction && entry.kind === 'encode')
          .map((entry) => entry.sequence),
        probeReceiptSequences: commandReceipts
          .filter(
            (entry) => entry.pairId === pair.pairId && entry.direction === direction && entry.kind.startsWith('probe'),
          )
          .map((entry) => entry.sequence),
        metricReceiptSequences: commandReceipts
          .filter(
            (entry) =>
              entry.pairId === pair.pairId &&
              entry.direction === direction &&
              ['vmaf', 'ssim', 'psnr'].includes(entry.kind),
          )
          .map((entry) => entry.sequence),
      };
    }
    pairResults.push(assessPair({ ...pair, directions } as never));
  }
  const manifest: any = {
    ...JSON.parse(await readFile(paths.manifestPath, 'utf8')),
    toolVersions: {
      node: 'node-test',
      ffmpeg: 'ffmpeg-test',
      ffprobe: 'ffprobe-test',
      playwright: 'playwright-test',
      chromium: null,
    },
    commandReceipts,
    pairResults,
    status: STATUS.NO_CHANGE,
  };
  const objectiveBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(paths.objectiveManifestPath, objectiveBytes);
  await writeFile(
    paths.objectiveEvidencePath,
    JSON.stringify({
      schemaVersion: 1,
      runId: manifest.runId,
      implementationBaseline: BASELINE,
      harnessCommit: HARNESS,
      objectiveManifestSha256: hash(objectiveBytes),
      createdAt: '2026-08-31T00:00:00.000Z',
    }),
  );
  await writeFile(paths.manifestPath, JSON.stringify(manifest, null, 2));
  return { repositoryRoot, paths, manifest };
}

async function completeEligibleObjectiveRun() {
  const fixture = await completeNoChangeRun();
  const eligible = fixture.manifest.pairResults.map((pair: any) => {
    if (pair.pairId !== 'h264-crf18') return pair;
    const directions = Object.fromEntries(
      (['forward', 'reverse'] as const).map((direction) => [
        direction,
        {
          ...pair.directions[direction],
          metrics: {
            ...pair.directions[direction].metrics,
            vmaf: { ...pair.directions[direction].metrics.vmaf, value: 95 },
          },
        },
      ]),
    );
    return assessPair({ ...pair, directions });
  });
  const manifest = { ...fixture.manifest, pairResults: eligible, status: STATUS.OBJECTIVE_EVIDENCE_READY };
  const objectiveBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(fixture.paths.objectiveManifestPath, objectiveBytes);
  await writeFile(
    fixture.paths.objectiveEvidencePath,
    JSON.stringify({
      schemaVersion: 1,
      runId: fixture.manifest.runId,
      implementationBaseline: BASELINE,
      harnessCommit: HARNESS,
      objectiveManifestSha256: hash(objectiveBytes),
      createdAt: '2026-08-31T00:00:00.000Z',
    }),
  );
  await writeFile(fixture.paths.manifestPath, JSON.stringify(manifest, null, 2));
  return { ...fixture, manifest };
}

async function mainVisualDependencies(fixture: Awaited<ReturnType<typeof completeEligibleObjectiveRun>>) {
  const sourceFacts = ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS);
  for (const source of sourceFacts) {
    const sourcePath = path.resolve(fixture.repositoryRoot, source.relativePath);
    const realSourcePath = path.resolve(process.cwd(), source.relativePath);
    await mkdir(path.dirname(sourcePath), { recursive: true });
    await writeFile(sourcePath, await readFile(realSourcePath));
  }
  const baselinePath = path.resolve(
    fixture.repositoryRoot,
    '.superpowers/sdd/phase-6c-hero-video-compression/implementation-baseline.json',
  );
  await mkdir(path.dirname(baselinePath), { recursive: true });
  await writeFile(
    baselinePath,
    JSON.stringify({ implementationBaseline: BASELINE, designCommit: BASELINE, harnessCommit: BASELINE }),
  );
  const writeOwned = async (filePath: string, bytes: Uint8Array | string) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
  };
  const dependencies: any = {
    repositoryRoot: fixture.repositoryRoot,
    readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')),
    verifyInputs: vi.fn().mockResolvedValue(sourceFacts),
    nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
    writeFileExclusive: writeOwned,
    replaceOwnedFile: writeOwned,
    spawnProcess: vi.fn(async (item: any) => {
      if (item.artifactRelativePath)
        await writeOwned(path.resolve(fixture.paths.runRoot, item.artifactRelativePath), Buffer.from('visual'));
      return { exitCode: 0, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
    }),
    launchChromium: vi.fn().mockResolvedValue({
      version: vi.fn().mockResolvedValue('chromium-test'),
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          evaluate: vi.fn().mockResolvedValue({
            loadeddata: true,
            canplay: true,
            ended: true,
            error: false,
            firstFrameReady: true,
            transitionReady: true,
            originalDurationSeconds: 6.041667,
            candidateDurationSeconds: 6.041667,
            maximumDriftSeconds: 0.01,
          }),
          screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
          close: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
    startLoopbackServer: vi.fn().mockResolvedValue({
      requestedPort: 0,
      resolvedPort: 4123,
      origin: 'http://127.0.0.1:4123',
      close: vi.fn().mockResolvedValue(undefined),
    }),
    presentReviewPackage: vi.fn().mockResolvedValue(undefined),
  };
  dependencies.writeManifestAtomic = (nextPaths: any, nextManifest: any) =>
    writeManifestAtomic(nextPaths, nextManifest, dependencies);
  return dependencies;
}

function decisionDependencies(fixture: any) {
  const dependencies: any = {
    readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')),
    verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
    writeFileExclusive: (filePath: string, bytes: Uint8Array) => writeFile(filePath, bytes, { flag: 'wx' }),
    replaceOwnedFile: (filePath: string, bytes: Uint8Array | string) => writeFile(filePath, bytes),
    getProtectedPlanHashes: vi.fn().mockResolvedValue([]),
  };
  dependencies.writeManifestAtomic = (nextPaths: any, nextManifest: any) =>
    writeManifestAtomic(nextPaths, nextManifest, dependencies);
  return dependencies;
}

async function objectiveHarness(
  options: {
    missingCandidate?: string;
    nanMetric?: boolean;
    psnrAvgField?: boolean;
    unknownTool?: boolean;
    unexpectedArtifact?: boolean;
  } = {},
) {
  const repositoryRoot = await tempRepository();
  const paths = resolveRunPaths(repositoryRoot, 'orchestration', 'create');
  const manifest = { runId: 'orchestration' } as any;
  const baselinePath = path.resolve(
    repositoryRoot,
    '.superpowers/sdd/phase-6c-hero-video-compression/implementation-baseline.json',
  );
  await mkdir(path.dirname(baselinePath), { recursive: true });
  await writeFile(
    baselinePath,
    JSON.stringify({ implementationBaseline: BASELINE, designCommit: BASELINE, harnessCommit: HARNESS }),
  );
  const sourceFacts = ENCODE_SOURCE_CONTRACTS;
  const visualFacts = ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS);
  const writeOwned = async (filePath: string, bytes: Uint8Array | string) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
  };
  const state: Record<string, unknown> = {};
  const dependencies: any = {
    repositoryRoot,
    readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')),
    verifyInputs: vi.fn().mockResolvedValue(sourceFacts),
    nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
    getToolVersions: vi
      .fn()
      .mockResolvedValue(
        options.unknownTool
          ? { node: 'unknown', ffmpeg: 'ffmpeg-test', ffprobe: 'ffprobe-test', playwright: 'playwright-test' }
          : { node: 'node-test', ffmpeg: 'ffmpeg-test', ffprobe: 'ffprobe-test', playwright: 'playwright-test' },
      ),
    writeFileExclusive: writeOwned,
    replaceOwnedFile: writeOwned,
    getProtectedPlanHashes: vi.fn().mockResolvedValue([
      {
        relativePath: 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
        bytes: 1,
        sha256: SHA,
      },
      { relativePath: 'docs/superpowers/plans/phase-2-task-3-execution.md', bytes: 1, sha256: SHA },
    ]),
  };
  dependencies.spawnProcess = vi.fn(async (item: any) => {
    if (options.unexpectedArtifact && item.sequence === 1)
      await writeOwned(path.resolve(paths.runRoot, 'unexpected-artifact.tmp'), Buffer.from('forbidden'));
    const relative = item.artifactRelativePath as string | undefined;
    if (relative?.startsWith('candidates/') && relative !== options.missingCandidate)
      await writeOwned(path.resolve(paths.runRoot, relative), Buffer.from(`candidate:${relative}`));
    if (relative?.startsWith('metrics/')) {
      const bytes = relative.endsWith('-vmaf.json')
        ? Buffer.from(JSON.stringify({ pooled_metrics: { vmaf: { mean: options.nanMetric ? 'NaN' : 95 } } }))
        : Buffer.from(
            relative.endsWith('-ssim.log') ? 'All:0.99' : options.psnrAvgField ? 'psnr_avg:43.48' : 'psnr_avg:45',
          );
      await writeOwned(path.resolve(paths.runRoot, relative), bytes);
    }
    if (item.executable === 'ffmpeg' && item.args.includes('-passlogfile')) {
      const passlog = item.args[item.args.indexOf('-passlogfile') + 1];
      await writeOwned(path.resolve(paths.runRoot, `${passlog}-0.log`), Buffer.from('passlog'));
    }
    const stdout = relative?.endsWith('-metadata.json')
      ? Buffer.from(
          JSON.stringify({
            streams: [
              {
                index: 0,
                codec_name: relative.startsWith('probes/h264')
                  ? 'h264'
                  : relative.startsWith('probes/vp9')
                    ? 'vp9'
                    : 'av1',
                profile: 'High',
                width: 1168,
                height: 784,
                pix_fmt: 'yuv420p',
                r_frame_rate: '24/1',
                avg_frame_rate: '24/1',
                nb_read_packets: 145,
                bit_rate: 1000,
              },
            ],
            format: { duration: 6.041667, bit_rate: 1000, size: 1 },
          }),
        )
      : relative?.endsWith('-streams.json')
        ? Buffer.from(JSON.stringify({ streams: [{ index: 0, codec_type: 'video' }] }))
        : Buffer.alloc(0);
    return { exitCode: 0, stdout, stderr: Buffer.alloc(0) };
  });
  dependencies.verifyInputs = vi
    .fn()
    .mockImplementation(async (_root: string, scope: string) => (scope === 'source' ? sourceFacts : visualFacts));
  dependencies.writeManifestAtomic = vi.fn(async (nextPaths: any, nextManifest: any) => {
    state.statusAtManifestWrite = nextManifest.status;
    state.objectiveManifestPresent = existsSync(nextPaths.objectiveManifestPath);
    state.objectiveEvidencePresent = existsSync(nextPaths.objectiveEvidencePath);
    state.reportPresent = existsSync(nextPaths.deliveryReportPath);
    return writeManifestAtomic(nextPaths, nextManifest, dependencies);
  });
  return { repositoryRoot, paths, manifest, dependencies, state };
}

async function completeEligibleVisualRun(allSuccessful = false) {
  const fixture = await completeNoChangeRun();
  const writeOwned = async (filePath: string, bytes: Uint8Array | string) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
  };
  const eligible = fixture.manifest.pairResults.map((pair: any) => {
    if (pair.pairId !== 'h264-crf18') return pair;
    const directions = Object.fromEntries(
      (['forward', 'reverse'] as const).map((direction) => [
        direction,
        {
          ...pair.directions[direction],
          metrics: {
            ...pair.directions[direction].metrics,
            vmaf: { ...pair.directions[direction].metrics.vmaf, value: 95 },
          },
        },
      ]),
    );
    return assessPair({ ...pair, directions });
  });
  const pair = eligible.find((entry: any) => entry.pairId === 'h264-crf18');
  const indexBytes = testIndexBytes(['h264-crf18']);
  await mkdir(path.dirname(path.resolve(fixture.paths.runRoot, 'visuals/index.html')), { recursive: true });
  await writeFile(path.resolve(fixture.paths.runRoot, 'visuals/index.html'), indexBytes);
  for (const item of buildVisualInvocations(pair as never, fixture.paths, 1))
    if (item.artifactRelativePath) {
      await mkdir(path.dirname(path.resolve(fixture.paths.runRoot, item.artifactRelativePath)), { recursive: true });
      await writeFile(path.resolve(fixture.paths.runRoot, item.artifactRelativePath), Buffer.from('visual'));
    }
  const browserReceipts: any[] = [];
  const browserCommandReceipts: any[] = [];
  for (const [index, viewport] of ['desktop-1440x1000', 'mobile-390x844'].entries())
    for (const direction of ['forward', 'reverse'] as const) {
      const sequence = 77 + index * 2 + (direction === 'reverse' ? 1 : 0);
      const jsonRelativePath = `browser-receipts/h264-crf18-${direction}-${viewport}.json`;
      const screenshotRelativePath = `browser-receipts/h264-crf18-${direction}-${viewport}.png`;
      const receipt = {
        pairId: 'h264-crf18',
        direction,
        viewport,
        jsonRelativePath,
        screenshotRelativePath,
        browserName: 'chromium',
        browserVersion: 'chromium-test',
        playbackRate: 1,
        loadeddata: true,
        canplay: true,
        ended: allSuccessful || direction === 'forward',
        error: !(allSuccessful || direction === 'forward'),
        firstFrameReady: true,
        transitionReady: true,
        originalDurationSeconds: 6.041667,
        candidateDurationSeconds: allSuccessful || direction === 'forward' ? 6.041667 : 6.2,
        maximumDriftSeconds: allSuccessful || direction === 'forward' ? 0.01 : 0.1,
        screenshotSha256: SHA,
        browserCommandSequence: sequence,
      };
      const screenshotBytes = Buffer.from(`png:${direction}:${viewport}`);
      receipt.screenshotSha256 = hash(screenshotBytes);
      const finalJsonBytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n');
      await writeOwned(path.resolve(fixture.paths.runRoot, jsonRelativePath), finalJsonBytes);
      await writeOwned(path.resolve(fixture.paths.runRoot, screenshotRelativePath), screenshotBytes);
      browserReceipts.push({ receipt, jsonBytes: finalJsonBytes.length, jsonSha256: hash(finalJsonBytes) });
      browserCommandReceipts.push({
        sequence,
        kind: 'browser-playback',
        pairId: 'h264-crf18',
        direction,
        viewport,
        loopbackOrigin: 'http://127.0.0.1:4123',
        startedAt: '2026-08-31T00:00:00.000Z',
        finishedAt: '2026-08-31T00:00:01.000Z',
        immutableCheckBefore: SHA,
        immutableCheckAfter: SHA,
        outcome: 'COMPLETED',
      });
    }
  const visualReceipts = testVisualReceipts(fixture.paths, [pair as never], 'visuals/index.html', indexBytes);
  const observations = {
    schemaVersion: 1,
    runId: fixture.manifest.runId,
    observations: [
      {
        pairId: 'h264-crf18',
        reviewedViewports: { 'desktop-1440x1000': true, 'mobile-390x844': true },
        reviewedDirections: { forward: true, reverse: true },
        normalSpeedVisibleDifference: false,
        playbackFailure: false,
        firstFrameReady: true,
        transitionReady: true,
        defects: {
          frameCorruption: false,
          colorShift: false,
          blocking: false,
          banding: false,
          droppedEnding: false,
          transitionSeam: false,
        },
        verdict: 'VISUALLY_APPROVED',
      },
    ],
  };
  const objectiveBytes = Buffer.from(
    JSON.stringify({ ...fixture.manifest, pairResults: eligible, status: STATUS.OBJECTIVE_EVIDENCE_READY }, null, 2) +
      '\n',
  );
  await writeFile(fixture.paths.objectiveManifestPath, objectiveBytes);
  await writeFile(
    fixture.paths.objectiveEvidencePath,
    JSON.stringify({
      schemaVersion: 1,
      runId: fixture.manifest.runId,
      implementationBaseline: BASELINE,
      harnessCommit: HARNESS,
      objectiveManifestSha256: hash(objectiveBytes),
      createdAt: '2026-08-31T00:00:00.000Z',
    }),
  );
  const pending = {
    ...fixture.manifest,
    pairResults: eligible,
    status: STATUS.PENDING_USER_APPROVAL,
    visualReceipts,
    browserCommandReceipts,
    browserReceipts,
  };
  await writeFile(fixture.paths.visualObservationsPath, JSON.stringify(observations));
  await writeFile(fixture.paths.manifestPath, JSON.stringify(pending, null, 2));
  return { ...fixture, manifest: pending, observations };
}

describe('hero video immutable contracts', () => {
  it('exposes only the approved Task 1 interface', () => {
    expect(Object.keys(harness).sort()).toEqual(
      [
        'ENCODE_SOURCE_CONTRACTS',
        'VISUAL_SUPPORT_CONTRACTS',
        'PAIR_CONTRACTS',
        'STATUS',
        'resolveExperimentRoot',
        'resolveRunPaths',
        'enumerateOwnedRunFiles',
        'validateManifestIdentity',
        'buildEncodeInvocations',
        'buildProbeInvocations',
        'buildMetricInvocations',
        'assessPair',
        'buildVisualInvocations',
        'verifyImmutableInputs',
        'runGuardedProcess',
        'runGuardedBrowserPlayback',
        'createRun',
        'openRun',
        'overwriteRun',
        'writeManifestAtomic',
        'nextReceiptSequence',
        'recordObservations',
        'recordDecision',
        'main',
      ].sort(),
    );
  });

  it('exports frozen source, visual, pair, and status contracts', () => {
    expect(Object.isFrozen(ENCODE_SOURCE_CONTRACTS)).toBe(true);
    expect(Object.isFrozen(VISUAL_SUPPORT_CONTRACTS)).toBe(true);
    expect(Object.isFrozen(PAIR_CONTRACTS)).toBe(true);
    expect(PAIR_CONTRACTS).toHaveLength(6);
    expect(PAIR_CONTRACTS.map((pair: PairContract) => pair.pairId)).toEqual([
      'h264-crf18',
      'h264-crf20',
      'vp9-cq24',
      'vp9-cq28',
      'av1-cq24',
      'av1-cq28',
    ]);
    expect(STATUS.NO_CHANGE).toBe('NO_CHANGE');
  });

  it('resolves only an absolute contained experiment root', async () => {
    const root = await tempRepository();
    expect(resolveExperimentRoot(root)).toBe(path.resolve(root, '.superpowers/sdd/phase-6c-hero-video-compression'));
    expect(() => resolveExperimentRoot('relative-root')).toThrow(/absolute/i);
  });

  it('verifies exact source and visual allowlists without metadata', async () => {
    const sourceFacts = await verifyImmutableInputs(process.cwd(), 'source');
    const visualFacts = await verifyImmutableInputs(process.cwd(), 'visual');
    expect(sourceFacts).toEqual(ENCODE_SOURCE_CONTRACTS);
    expect(visualFacts).toEqual([...ENCODE_SOURCE_CONTRACTS, ...VISUAL_SUPPORT_CONTRACTS]);
    expect(JSON.stringify(visualFacts)).not.toMatch(/metadata|comment|tag/i);
  });
});

describe('run lifecycle', () => {
  it('accepts safe create IDs and rejects escapes or implicit overwrite', async () => {
    const root = await tempRepository();
    expect(() => resolveRunPaths(root, '../escape', 'create')).toThrow(/safe run id/i);
    expect(() => resolveRunPaths(root, 'pilot-01', 'create')).not.toThrow();
    await mkdir(path.join(root, '.superpowers', 'sdd', 'phase-6c-hero-video-compression', 'runs', 'existing'), {
      recursive: true,
    });
    expect(() => resolveRunPaths(root, 'existing', 'create')).toThrow(/must not exist/i);
    expect(() => resolveRunPaths(root, 'missing', 'open')).toThrow(/must exist/i);
  });

  it('creates and opens a manifest without writing through open mode', async () => {
    const { repositoryRoot, paths, manifest } = await createdRun();
    expect(manifest.status).toBe(STATUS.PENDING_OBJECTIVE_EVIDENCE);
    expect(validateManifestIdentity(paths.runRoot, 'pilot-01', 'identity')).toEqual(manifest);
    await expect(readFile(paths.manifestPath, 'utf8')).resolves.toContain('pilot-01');
  });

  it('rejects every downstream artifact or status during overwrite', async () => {
    const { repositoryRoot } = await createdRun();
    expect(() => resolveRunPaths(repositoryRoot, 'pilot-01', 'overwrite')).toThrowError('NEW_RUN_ID_REQUIRED');
  });

  it('derives exact objective, visual, and decision inventories', () => {
    const objective = enumerateOwnedRunFiles('pilot-01', 'objective', []);
    expect(objective).toContain('manifest.json');
    expect(objective).toContain('candidates/h264-crf18-forward.mp4');
    expect(objective).toContain('probes/h264-crf18-forward-metadata.json');
    expect(objective).toContain('metrics/vp9-cq28-reverse-psnr.log');
    expect(objective).toContain('passlogs/vp9-cq24-forward-0.log');
    expect(objective).not.toContain('manifest.json.partial');
    const visual = enumerateOwnedRunFiles('pilot-01', 'visual', ['h264-crf18']);
    expect(visual).toContain('visuals/index.html');
    expect(visual).toContain('visuals/frames/h264-crf18-forward-frame-000.png');
    expect(visual).toContain('visuals/h264-crf18-forward-focus-reverse.mp4');
    expect(visual).toHaveProperty('size');
    const decision = enumerateOwnedRunFiles('pilot-01', 'decision', []);
    expect(decision).toEqual(new Set([...objective, 'decision.json']));
  });

  it('serves contained loopback routes with GET/HEAD/range/traversal enforcement', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const dependencies = await mainVisualDependencies(fixture);
    delete dependencies.startLoopbackServer;
    const request = (method: string, url: string, headers: Record<string, string> = {}) =>
      new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
        const req = http.request(url, { method, headers }, (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          response.on('end', () =>
            resolve({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks) }),
          );
        });
        req.on('error', reject);
        req.end();
      });
    let origin = '';
    dependencies.presentReviewPackage.mockImplementationOnce(async ({ origin: reviewOrigin }: { origin: string }) => {
      origin = reviewOrigin;
      const get = await request('GET', `${origin}/index.html`);
      expect(get.status).toBe(200);
      expect(get.body.toString()).toContain('PRIMARY_DIRECT_PLAYBACK');
      const head = await request('HEAD', `${origin}/index.html`);
      expect(head.status).toBe(200);
      expect(head.body).toHaveLength(0);
      const range = await request('GET', `${origin}/candidate/h264-crf18/forward.mp4`, { Range: 'bytes=0-2' });
      expect(range.status).toBe(206);
      expect(range.headers['content-range']).toBe('bytes 0-2/18');
      expect(
        (await request('GET', `${origin}/candidate/h264-crf18/forward.mp4`, { Range: 'bytes=0-1,3-4' })).status,
      ).toBe(416);
      expect((await request('POST', `${origin}/index.html`)).status).toBe(405);
      expect((await request('GET', `${origin}/index.html`, { Host: 'evil.test' })).status).toBe(403);
      const raw = await new Promise<number>((resolve, reject) => {
        const req = http.request(
          { hostname: '127.0.0.1', port: Number(new URL(origin).port), method: 'GET', path: '/%2e%2e/index.html' },
          (response) => {
            response.resume();
            response.on('end', () => resolve(response.statusCode ?? 0));
          },
        );
        req.on('error', reject);
        req.end();
      });
      expect(raw).toBe(400);
    });
    await expect(main(['visuals', '--run-id', fixture.manifest.runId], dependencies)).resolves.toBe(0);
    expect(origin).toMatch(/^http:\/\/127\.0\.0\.1:/);
  });

  it('rejects a symlinked candidate through the contained visual boundary', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const candidatePath = path.resolve(fixture.paths.runRoot, 'candidates/h264-crf18-forward.mp4');
    await unlink(candidatePath);
    try {
      await symlink(path.resolve(process.cwd(), 'package.json'), candidatePath);
    } catch {
      return;
    }
    const dependencies = await mainVisualDependencies(fixture);
    delete dependencies.startLoopbackServer;
    await expect(main(['visuals', '--run-id', fixture.manifest.runId], dependencies)).rejects.toThrow(
      /identity|hash|linked/i,
    );
  });
});

describe('candidate identity and encoder arrays', () => {
  it('expands each pair into unique forward and reverse candidates', async () => {
    const { paths } = await createdRun();
    const all = PAIR_CONTRACTS.flatMap((pair: PairContract) => [
      candidate(pair.pairId, 'forward'),
      candidate(pair.pairId, 'reverse'),
    ]);
    expect(new Set(all.map((entry: CandidateRecord) => `${entry.pairId}:${entry.direction}`)).size).toBe(12);
    expect(all.every((entry: CandidateRecord) => entry.candidateRelativePath.startsWith('candidates/'))).toBe(true);
    expect(buildEncodeInvocations(candidate(), paths, 1)[0].shell).toBe(false);
  });

  it('builds exact deterministic H264, VP9, and AV1 arrays', async () => {
    const { paths } = await createdRun();
    const h264 = buildEncodeInvocations(candidate('h264-crf20'), paths, 1);
    const vp9 = buildEncodeInvocations(candidate('vp9-cq24'), paths, 1);
    const av1 = buildEncodeInvocations(candidate('av1-cq28'), paths, 1);
    expect(h264).toHaveLength(1);
    expect(h264[0].args).toEqual(
      expect.arrayContaining(['-map', '0:v:0', '-an', '-map_metadata', '-1', '-preset', 'slow', '-crf', '20']),
    );
    expect(vp9).toHaveLength(2);
    expect(vp9[0].args).toEqual(expect.arrayContaining(['-pass', '1', '-passlogfile', 'passlogs/vp9-cq24-forward']));
    expect(vp9[1].args).toEqual(expect.arrayContaining(['-pass', '2', '-passlogfile', 'passlogs/vp9-cq24-forward']));
    expect(vp9[0].args.slice(-4, -2)).toEqual(['-f', 'webm']);
    expect(vp9[0].args).toContain('NUL');
    expect(av1[0].args).toEqual(expect.arrayContaining(['-c:v', 'libaom-av1', '-crf', '28', '-tiles', '1x1']));
    for (const invocation of [...h264, ...vp9, ...av1]) {
      expect(invocation.args).toEqual(
        expect.arrayContaining(['-vf', 'fps=24,format=yuv420p', '-fps_mode', 'cfr', '-t', '6.041667']),
      );
      expect(invocation.args).not.toContain('terrace-sofa-focus.webp');
    }
  });
});

describe('probe contract', () => {
  it('builds named metadata and stream probes only', async () => {
    const { paths } = await createdRun();
    const invocations = buildProbeInvocations(candidate(), paths, 7);
    const input = path.resolve(paths.runRoot, 'candidates/h264-crf18-forward.mp4');
    expect(invocations).toHaveLength(2);
    expect(invocations[0].args).toEqual([
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-count_packets',
      '-show_entries',
      'stream=index,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_packets,bit_rate:format=duration,bit_rate,size',
      '-of',
      'json',
      input,
    ]);
    expect(invocations[0].args).not.toContain('-nostdin');
    expect(invocations[0].args.join(' ')).not.toMatch(/tags|comment|show_entries format$/i);
    expect(invocations[1].args).toEqual([
      '-v',
      'error',
      '-show_entries',
      'stream=index,codec_type',
      '-of',
      'json',
      input,
    ]);
    expect(invocations[1].args).not.toContain('-nostdin');
  });
});

describe('metric order and Windows metric paths', () => {
  it('puts candidate at input zero and original at input one', async () => {
    const { paths } = await createdRun();
    for (const kind of ['vmaf', 'ssim', 'psnr'] as const) {
      const invocation = buildMetricInvocations(candidate(), paths, 10).find((entry) =>
        entry.artifactRelativePath?.endsWith(kind === 'vmaf' ? '.json' : '.log'),
      )!;
      expect(invocation.args.slice(0, 9)).toEqual([
        '-hide_banner',
        '-loglevel',
        'error',
        '-nostdin',
        '-i',
        path.resolve(paths.runRoot, 'candidates/h264-crf18-forward.mp4'),
        '-i',
        path.resolve(paths.repositoryRoot, ENCODE_SOURCE_CONTRACTS[0].relativePath),
        '-filter_complex',
      ]);
      expect(invocation.cwd).toBe(paths.runRoot);
      const graph = invocation.args[invocation.args.indexOf('-filter_complex') + 1];
      expect(graph).toContain('[dist][ref]');
      expect(graph).not.toContain('C:');
      expect(graph).not.toContain('\\');
    }
  });
});

describe('guarded process', () => {
  it('records run outputs before repository inputs in display arguments', async () => {
    const { paths } = await createdRun();
    const invocation = buildEncodeInvocations(candidate(), paths, 1)[0];
    const verifyInputs = vi
      .fn()
      .mockResolvedValueOnce(ENCODE_SOURCE_CONTRACTS)
      .mockResolvedValueOnce(ENCODE_SOURCE_CONTRACTS);
    const spawnProcess = vi.fn().mockResolvedValue({ exitCode: 0, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) });
    const receipt = await runGuardedProcess(paths, 'source', invocation, {
      verifyInputs,
      spawnProcess,
      nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
    } as never);
    expect(receipt.displayArgs).toContain('candidates/h264-crf18-forward.mp4');
    expect(receipt.displayArgs).toContain('public/assets/hero/terrace-sofa-forward.mp4');
    expect(receipt.displayArgs.join(' ')).not.toContain(paths.runRoot);
    expect(receipt.displayArgs.join(' ')).not.toContain(paths.repositoryRoot);
  });

  it('verifies immutable inputs before and after process success', async () => {
    const { paths } = await createdRun();
    const verifyInputs = vi
      .fn()
      .mockResolvedValueOnce(ENCODE_SOURCE_CONTRACTS)
      .mockResolvedValueOnce(ENCODE_SOURCE_CONTRACTS);
    const receipt = await runGuardedProcess(
      paths,
      'source',
      {
        sequence: 1,
        executable: 'ffmpeg',
        args: ['-n'],
        cwd: paths.runRoot,
        shell: false,
        immutableScope: 'source',
        artifactRelativePath: 'candidates/h264-crf18-forward.mp4',
      },
      {
        verifyInputs,
        spawnProcess: vi.fn().mockResolvedValue({ exitCode: 0, stdout: new Uint8Array(), stderr: new Uint8Array() }),
        nowIso: vi.fn().mockReturnValueOnce('2026-08-31T00:00:00.000Z').mockReturnValueOnce('2026-08-31T00:00:01.000Z'),
      } as never,
    );
    expect(verifyInputs).toHaveBeenCalledTimes(2);
    expect(receipt.immutableCheckBefore).toHaveLength(64);
    expect(receipt.immutableCheckAfter).toHaveLength(64);
    expect(receipt.displayArgs).not.toContain(paths.repositoryRoot);
  });

  it('gives post-verification failure precedence over process failure', async () => {
    const { paths } = await createdRun();
    const verifyInputs = vi
      .fn()
      .mockResolvedValueOnce(ENCODE_SOURCE_CONTRACTS)
      .mockRejectedValueOnce(new Error('immutable source changed'));
    await expect(
      runGuardedProcess(
        paths,
        'source',
        {
          sequence: 1,
          executable: 'ffmpeg',
          args: ['-n'],
          cwd: paths.runRoot,
          shell: false,
          immutableScope: 'source',
          artifactRelativePath: null,
        },
        {
          verifyInputs,
          spawnProcess: vi.fn().mockRejectedValue(new Error('process failed')),
          nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
        } as never,
      ),
    ).rejects.toThrow('immutable source changed');
  });

  it('records exact pair and direction for visual frame and local sequence receipts', async () => {
    const { paths } = await createdRun();
    const dependencies: any = {
      verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
      spawnProcess: vi.fn().mockResolvedValue({ exitCode: 0, stdout: new Uint8Array(), stderr: new Uint8Array() }),
      nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
    } as never;
    const frame = await runGuardedProcess(
      paths,
      'visual',
      {
        sequence: 1,
        executable: 'ffmpeg',
        args: [],
        cwd: paths.runRoot,
        shell: false,
        immutableScope: 'visual',
        artifactRelativePath: 'visuals/frames/h264-crf18-forward-frame-000.png',
      },
      dependencies,
    );
    const sequence = await runGuardedProcess(
      paths,
      'visual',
      {
        sequence: 2,
        executable: 'ffmpeg',
        args: [],
        cwd: paths.runRoot,
        shell: false,
        immutableScope: 'visual',
        artifactRelativePath: 'visuals/h264-crf18-forward-focus-reverse.mp4',
      },
      dependencies,
    );
    expect(frame).toMatchObject({ kind: 'visual-frame', pairId: 'h264-crf18', direction: 'forward' });
    expect(sequence).toMatchObject({ kind: 'visual-sequence', pairId: 'h264-crf18', direction: null });
  });
});

describe('manifest identity and eligibility', () => {
  it('uses consecutive receipt sequence across process and browser receipts', async () => {
    const { manifest } = await createdRun();
    expect(nextReceiptSequence(manifest)).toBe(1);
    expect(
      nextReceiptSequence({
        ...manifest,
        commandReceipts: [{ sequence: 2 }],
        browserCommandReceipts: [{ sequence: 8 }],
      } as never),
    ).toBe(9);
  });

  it('accepts VMAF 95 and rejects 94.999 in either direction', () => {
    const base = {
      pairId: 'h264-crf18',
      codec: 'h264',
      quality: 18,
      extension: 'mp4',
      disposition: 'eligible',
      directions: {
        forward: directionResult('forward', 95, 4000000),
        reverse: directionResult('reverse', 95, 4000000),
      },
    } as Parameters<typeof assessPair>[0];
    expect(assessPair(base).eligible).toBe(true);
    expect(
      assessPair({ ...base, directions: { ...base.directions, forward: directionResult('forward', 94.999, 4000000) } })
        .eligible,
    ).toBe(false);
    expect(
      assessPair({ ...base, directions: { ...base.directions, reverse: directionResult('reverse', 94.999, 4000000) } })
        .eligible,
    ).toBe(false);
    expect(
      assessPair({
        ...base,
        pairId: 'av1-cq24',
        codec: 'av1',
        quality: 24,
        extension: 'webm',
        disposition: 'measurement-only',
      }).status,
    ).toBe(STATUS.MEASUREMENT_ONLY);
  });
});

describe('CLI lifecycle and run orchestration', () => {
  it('help launches no process and returns zero', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const spawnProcess = vi.fn();
    await expect(main(['--help'], { spawnProcess } as never)).resolves.toBe(0);
    expect(spawnProcess).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('rejects unknown and duplicate flags for every command before any boundary launch', async () => {
    for (const argv of [
      ['run', '--run-id', 'pilot-01', '--run-id', 'pilot-02'],
      ['visuals', '--run-id', 'pilot-01', '--unknown', 'value'],
      ['observations', '--run-id', 'pilot-01', '--stdin', '--stdin'],
      [
        'decision',
        '--run-id',
        'pilot-01',
        '--outcome',
        'no-change',
        '--approval-reference',
        'x',
        '--outcome',
        'approved',
      ],
    ]) {
      await expect(main(argv, { spawnProcess: vi.fn() } as never)).rejects.toThrow(/unknown|duplicate/i);
    }
  });

  it('rejects decision candidates unless outcome is approval and candidate is non-null', async () => {
    await expect(
      main(
        [
          'decision',
          '--run-id',
          'pilot-01',
          '--outcome',
          'no-change',
          '--candidate',
          'h264-crf18',
          '--approval-reference',
          'x',
        ],
        { spawnProcess: vi.fn() } as never,
      ),
    ).rejects.toThrow(/candidate|no-change/i);
    await expect(
      main(['decision', '--run-id', 'pilot-01', '--outcome', 'approved', '--approval-reference', 'x'], {
        spawnProcess: vi.fn(),
      } as never),
    ).rejects.toThrow(/candidate/i);
  });

  it('captures tool versions and proves exact inventory before final status and report', async () => {
    const fixture = await objectiveHarness();
    await expect(main(['run', '--run-id', 'orchestration'], fixture.dependencies)).resolves.toBe(0);
    expect(fixture.dependencies.getToolVersions).toHaveBeenCalledTimes(1);
    expect(fixture.state).toMatchObject({
      statusAtManifestWrite: expect.stringMatching(/OBJECTIVE_EVIDENCE_READY|NO_CHANGE/),
      objectiveManifestPresent: true,
      objectiveEvidencePresent: true,
      reportPresent: false,
    });
    expect(JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8')).toolVersions.ffmpeg).toBe('ffmpeg-test');
    expect(await readFile(fixture.paths.deliveryReportPath, 'utf8')).toContain('sourceHashesAfter');
  });

  it('parses FFmpeg psnr_avg metric output during objective closeout', async () => {
    const fixture = await objectiveHarness({ psnrAvgField: true });
    await expect(main(['run', '--run-id', 'orchestration'], fixture.dependencies)).resolves.toBe(0);
    const manifest = JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8'));
    expect(
      manifest.pairResults.every((pair: any) =>
        ['forward', 'reverse'].every((direction) => pair.directions[direction].metrics.psnr.value === 43.48),
      ),
    ).toBe(true);
  });

  it('hard-fails missing candidate artifacts before objective status/report closeout', async () => {
    const fixture = await objectiveHarness({ missingCandidate: 'candidates/h264-crf18-forward.mp4' });
    await expect(main(['run', '--run-id', 'orchestration'], fixture.dependencies)).rejects.toThrow(
      /Missing objective candidate artifact/,
    );
    expect(fixture.state.statusAtManifestWrite).toBeUndefined();
    expect(existsSync(fixture.paths.deliveryReportPath)).toBe(false);
  });

  it('hard-fails an exact-inventory mismatch before objective status/report closeout', async () => {
    const fixture = await objectiveHarness({ unexpectedArtifact: true });
    await expect(main(['run', '--run-id', 'orchestration'], fixture.dependencies)).rejects.toThrow(
      /inventory mismatch/i,
    );
    expect(fixture.state.statusAtManifestWrite).toBeUndefined();
    expect(existsSync(fixture.paths.deliveryReportPath)).toBe(false);
  });

  it('hard-fails NaN metric artifacts before objective status/report closeout', async () => {
    const fixture = await objectiveHarness({ nanMetric: true });
    await expect(main(['run', '--run-id', 'orchestration'], fixture.dependencies)).rejects.toThrow(/non-finite|NaN/i);
    expect(fixture.state.statusAtManifestWrite).toBeUndefined();
    expect(existsSync(fixture.paths.deliveryReportPath)).toBe(false);
  });

  it('rejects placeholder unknown tool versions before any objective process', async () => {
    const fixture = await objectiveHarness({ unknownTool: true });
    await expect(main(['run', '--run-id', 'orchestration'], fixture.dependencies)).rejects.toThrow(
      /unknown|placeholder|tool version/i,
    );
    expect(fixture.dependencies.spawnProcess).not.toHaveBeenCalled();
  });
});

describe('observation recording and decision closeout', () => {
  it('rejects observation recording before visual inventory is complete', async () => {
    const { paths, manifest } = await createdRun();
    await expect(
      recordObservations(paths, manifest, { schemaVersion: 1, runId: manifest.runId, observations: [] }, {} as never),
    ).rejects.toThrow(/pending visual review/i);
  });

  it('rejects decision closeout before objective evidence exists', async () => {
    const { paths, manifest } = await createdRun();
    await expect(
      recordDecision(
        paths,
        manifest,
        { schemaVersion: 1, runId: manifest.runId, observations: [] },
        { outcome: 'no-change', candidate: null, approvalReference: 'test' },
        {} as never,
      ),
    ).rejects.toThrow();
  });
});

describe('visual package and guarded browser playback', () => {
  it('builds lossless frame and labeled local-sequence invocations for eligible pairs only', async () => {
    const { paths } = await createdRun();
    const invocations = buildVisualInvocations(
      {
        pairId: 'vp9-cq24',
        codec: 'vp9',
        quality: 24,
        extension: 'webm',
        disposition: 'eligible',
        eligible: true,
        directions: {
          forward: directionResult('forward', 95, 4000000),
          reverse: directionResult('reverse', 95, 4000000),
        },
      } as never,
      paths,
      1,
    );
    expect(invocations.length).toBeGreaterThanOrEqual(7);
    expect(invocations.every((entry: VisualInvocation) => entry.args.includes('-n'))).toBe(true);
    expect(
      invocations.some((entry: VisualInvocation) => entry.args.join(' ').includes('fps=24,select=eq(n\\,0)')),
    ).toBe(true);
    expect(
      invocations.some((entry: VisualInvocation) => entry.args.join(' ').includes('terrace-sofa-focus.webp')),
    ).toBe(true);
  });

  it('builds a common-size timed local sequence with explicit focus timing', async () => {
    const { paths } = await createdRun();
    const invocations = buildVisualInvocations(
      {
        pairId: 'h264-crf18',
        codec: 'h264',
        quality: 18,
        extension: 'mp4',
        disposition: 'eligible',
        eligible: true,
        directions: {
          forward: directionResult('forward', 95, 4000000),
          reverse: directionResult('reverse', 95, 4000000),
        },
      } as never,
      paths,
      1,
    );
    const sequence = invocations.find((entry: VisualInvocation) =>
      entry.artifactRelativePath?.endsWith('forward-focus-reverse.mp4'),
    )!;
    const args = sequence.args.join(' ');
    expect(args).toContain('scale=1168:784');
    expect(args).toContain('settb=1/24');
    expect(args).toContain('setpts=PTS-STARTPTS');
    expect(sequence.args).toContain('-t');
    expect(sequence.args[sequence.args.indexOf('-t') + 1]).toBe('1');
    expect(sequence.args).toContain('-r');
    expect(sequence.args[sequence.args.indexOf('-r') + 1]).toBe('24');
  });

  it('closes browser resources and records linked evidence on completed playback', async () => {
    const { paths } = await createdRun();
    const closePage = vi.fn().mockResolvedValue(undefined);
    const closeContext = vi.fn().mockResolvedValue(undefined);
    const closeBrowser = vi.fn().mockResolvedValue(undefined);
    const page = {
      goto: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({
        loadeddata: true,
        canplay: true,
        ended: true,
        error: false,
        firstFrameReady: true,
        transitionReady: true,
        originalDurationSeconds: 6.041667,
        candidateDurationSeconds: 6.041667,
        maximumDriftSeconds: 0.01,
      }),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
      close: closePage,
    };
    const context = { newPage: vi.fn().mockResolvedValue(page), close: closeContext };
    const browser = {
      newContext: vi.fn().mockResolvedValue(context),
      close: closeBrowser,
      version: vi.fn().mockResolvedValue('chromium-test'),
    };
    const verifyInputs = vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS));
    const result = await runGuardedBrowserPlayback(
      paths,
      {
        sequence: 1,
        pairId: 'h264-crf18',
        direction: 'forward',
        viewport: 'desktop-1440x1000',
        loopbackOrigin: 'http://127.0.0.1:4123',
        originalUrlPath: '/original/forward.mp4',
        candidateUrlPath: '/candidate/h264-crf18/forward.mp4',
        screenshotRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.png',
        jsonRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.json',
      },
      {
        verifyInputs,
        launchChromium: vi.fn().mockResolvedValue(browser),
        replaceOwnedFile: vi.fn().mockResolvedValue(undefined),
        nowIso: vi.fn().mockReturnValueOnce('2026-08-31T00:00:00.000Z').mockReturnValueOnce('2026-08-31T00:00:02.000Z'),
        readJson: vi
          .fn()
          .mockReturnValue({ ...(await readFile(paths.manifestPath).then((value) => JSON.parse(value.toString()))) }),
      } as never,
    );
    expect(result.command.outcome).toBe('COMPLETED');
    expect(result.evidence.receipt.browserCommandSequence).toBe(result.command.sequence);
    expect(closePage).toHaveBeenCalled();
    expect(closeContext).toHaveBeenCalled();
    expect(closeBrowser).toHaveBeenCalled();
  });

  it('does not permit failed Chromium media evidence to approve a pair', async () => {
    const { paths, manifest } = await createdRun();
    const browserReceipt = {
      pairId: 'h264-crf18',
      direction: 'forward',
      viewport: 'desktop-1440x1000',
      jsonRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.json',
      screenshotRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.png',
      browserName: 'chromium',
      browserVersion: '1.0',
      playbackRate: 1,
      loadeddata: false,
      canplay: false,
      ended: false,
      error: true,
      firstFrameReady: false,
      transitionReady: false,
      originalDurationSeconds: 6.041667,
      candidateDurationSeconds: 6.041667,
      maximumDriftSeconds: 0,
      screenshotSha256: SHA,
      browserCommandSequence: 1,
    };
    const failedEvidence = { receipt: browserReceipt, jsonBytes: 1, jsonSha256: SHA };
    const withEligible = {
      ...manifest,
      status: STATUS.PENDING_USER_APPROVAL,
      pairResults: [
        {
          ...manifest.pairResults,
          pairId: 'h264-crf18',
          codec: 'h264',
          quality: 18,
          extension: 'mp4',
          disposition: 'eligible',
          eligible: true,
          directions: {
            forward: directionResult('forward', 95, 4000000),
            reverse: directionResult('reverse', 95, 4000000),
          },
        },
      ],
      browserCommandReceipts: [
        {
          sequence: 1,
          kind: 'browser-playback',
          pairId: 'h264-crf18',
          direction: 'forward',
          viewport: 'desktop-1440x1000',
          outcome: 'COMPLETED',
        },
      ],
      browserReceipts: [failedEvidence],
    } as never;
    await expect(
      recordDecision(
        paths,
        withEligible,
        { schemaVersion: 1, runId: 'pilot-01', observations: [] },
        { outcome: 'approved', candidate: 'h264-crf18', approvalReference: 'failed-media' },
        { readJson: vi.fn().mockReturnValue({ objectiveManifestSha256: SHA }) } as never,
      ),
    ).rejects.toThrow(/objective|browser|coverage|observation/i);
  });

  it('closes eligible reject-all as NO_CHANGE with final decision inventory and reopens it', async () => {
    const fixture = await completeEligibleVisualRun();
    const rejected = {
      ...fixture.observations,
      observations: fixture.observations.observations.map((entry: any) => ({ ...entry, verdict: 'VISUALLY_REJECTED' })),
    };
    await writeFile(fixture.paths.visualObservationsPath, JSON.stringify(rejected));
    const dependencies: any = {
      readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')),
      verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
      writeFileExclusive: (filePath: string, bytes: Uint8Array) => writeFile(filePath, bytes, { flag: 'wx' }),
      replaceOwnedFile: (filePath: string, bytes: Uint8Array | string) => writeFile(filePath, bytes),
      getProtectedPlanHashes: vi.fn().mockResolvedValue([]),
    };
    dependencies.writeManifestAtomic = (nextPaths: any, nextManifest: any) =>
      writeManifestAtomic(nextPaths, nextManifest, dependencies);
    const result = await recordDecision(
      fixture.paths,
      fixture.manifest,
      rejected,
      { outcome: 'no-change', candidate: null, approvalReference: 'rejected-all' },
      dependencies,
    );
    expect(result.manifest.status).toBe(STATUS.NO_CHANGE);
    expect(openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity').status).toBe(STATUS.NO_CHANGE);
    expect(openRun(fixture.repositoryRoot, fixture.manifest.runId, 'decision').status).toBe(STATUS.NO_CHANGE);
    expect(existsSync(fixture.paths.decisionPath)).toBe(true);
    const report = await readFile(fixture.paths.deliveryReportPath, 'utf8');
    expect(report).toContain('browserReceiptCount');
    expect(report).toContain('eligiblePairIds');
    expect(report).toContain('AV1 remains measurement-only');
  });

  it('records positive eligible approval only after all Chromium evidence succeeds', async () => {
    const fixture = await completeEligibleVisualRun(true);
    const dependencies: any = {
      readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')),
      verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
      writeFileExclusive: (filePath: string, bytes: Uint8Array) => writeFile(filePath, bytes, { flag: 'wx' }),
      replaceOwnedFile: (filePath: string, bytes: Uint8Array | string) => writeFile(filePath, bytes),
      getProtectedPlanHashes: vi.fn().mockResolvedValue([]),
    };
    dependencies.writeManifestAtomic = (nextPaths: any, nextManifest: any) =>
      writeManifestAtomic(nextPaths, nextManifest, dependencies);
    const result = await recordDecision(
      fixture.paths,
      fixture.manifest,
      fixture.observations,
      { outcome: 'approved', candidate: 'h264-crf18', approvalReference: 'positive-approval' },
      dependencies,
    );
    expect(result.manifest.status).toBe(STATUS.VISUALLY_APPROVED);
    expect(openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity').status).toBe(STATUS.VISUALLY_APPROVED);
  });

  it('rejects browser screenshot tampering before reject-all closeout', async () => {
    const fixture = await completeEligibleVisualRun();
    const screenshot = fixture.manifest.browserReceipts[0].receipt.screenshotRelativePath;
    await writeFile(path.resolve(fixture.paths.runRoot, screenshot), 'tampered');
    const rejected = {
      ...fixture.observations,
      observations: fixture.observations.observations.map((entry: any) => ({ ...entry, verdict: 'VISUALLY_REJECTED' })),
    };
    await writeFile(fixture.paths.visualObservationsPath, JSON.stringify(rejected));
    await expect(
      recordDecision(
        fixture.paths,
        fixture.manifest,
        rejected,
        { outcome: 'no-change', candidate: null, approvalReference: 'tamper' },
        { readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')) } as never,
      ),
    ).rejects.toThrow(/hash|browser/i);
  });

  it('blocks approval after complete but failed browser evidence reaches recordDecision', async () => {
    const fixture = await completeEligibleVisualRun();
    const dependencies: any = {
      readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')),
      verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
      writeFileExclusive: (filePath: string, bytes: Uint8Array) => writeFile(filePath, bytes, { flag: 'wx' }),
      replaceOwnedFile: (filePath: string, bytes: Uint8Array | string) => writeFile(filePath, bytes),
      getProtectedPlanHashes: vi.fn().mockResolvedValue([]),
    };
    dependencies.writeManifestAtomic = (nextPaths: any, nextManifest: any) =>
      writeManifestAtomic(nextPaths, nextManifest, dependencies);
    await expect(
      recordDecision(
        fixture.paths,
        fixture.manifest,
        fixture.observations,
        { outcome: 'approved', candidate: 'h264-crf18', approvalReference: 'failed-browser-contract' },
        dependencies,
      ),
    ).rejects.toThrow(/approval|browser/i);
    expect(existsSync(fixture.paths.decisionPath)).toBe(false);
  });

  it('persists completed negative media evidence for playback-gate failure', async () => {
    const { paths } = await createdRun();
    const browser = {
      version: vi.fn().mockResolvedValue('chromium-test'),
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          evaluate: vi.fn().mockResolvedValue({
            loadeddata: true,
            canplay: true,
            ended: false,
            error: true,
            firstFrameReady: true,
            transitionReady: true,
            originalDurationSeconds: 6.041667,
            candidateDurationSeconds: 6.2,
            maximumDriftSeconds: 0.1,
          }),
          screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
          close: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const result = await runGuardedBrowserPlayback(
      paths,
      {
        sequence: 1,
        pairId: 'h264-crf18',
        direction: 'forward',
        viewport: 'desktop-1440x1000',
        loopbackOrigin: 'http://127.0.0.1:4123',
        originalUrlPath: '/original/forward.mp4',
        candidateUrlPath: '/candidate/h264-crf18/forward.mp4',
        screenshotRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.png',
        jsonRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.json',
      },
      {
        verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
        launchChromium: vi.fn().mockResolvedValue(browser),
        replaceOwnedFile: vi.fn().mockResolvedValue(undefined),
        nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
        readJson: vi.fn().mockReturnValue({ commandReceipts: [], browserCommandReceipts: [] }),
      } as never,
    );
    expect(result.command.outcome).toBe('COMPLETED');
    expect(result.evidence.receipt.error).toBe(true);
    expect(result.evidence.receipt.ended).toBe(false);
  });

  it('closes all browser resources when playback infrastructure fails', async () => {
    const { paths } = await createdRun();
    const closePage = vi.fn().mockResolvedValue(undefined);
    const closeContext = vi.fn().mockResolvedValue(undefined);
    const closeBrowser = vi.fn().mockResolvedValue(undefined);
    const verifyInputs = vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS));
    await expect(
      runGuardedBrowserPlayback(
        paths,
        {
          sequence: 1,
          pairId: 'h264-crf18',
          direction: 'forward',
          viewport: 'desktop-1440x1000',
          loopbackOrigin: 'http://127.0.0.1:4123',
          originalUrlPath: '/original/forward.mp4',
          candidateUrlPath: '/candidate/h264-crf18/forward.mp4',
          screenshotRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.png',
          jsonRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.json',
        },
        {
          verifyInputs,
          launchChromium: vi.fn().mockResolvedValue({
            version: vi.fn().mockResolvedValue('chromium-test'),
            newContext: vi.fn().mockResolvedValue({
              newPage: vi.fn().mockResolvedValue({
                goto: vi.fn().mockResolvedValue(undefined),
                evaluate: vi.fn().mockRejectedValue(new Error('playback infrastructure failed')),
                close: closePage,
              }),
              close: closeContext,
            }),
            close: closeBrowser,
          }),
          replaceOwnedFile: vi.fn(),
          nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
          readJson: vi.fn().mockReturnValue({ commandReceipts: [], browserCommandReceipts: [] }),
        } as never,
      ),
    ).rejects.toThrow(/infrastructure failed/);
    expect(closePage).toHaveBeenCalledOnce();
    expect(closeContext).toHaveBeenCalledOnce();
    expect(closeBrowser).toHaveBeenCalledOnce();
    expect(verifyInputs).toHaveBeenCalledTimes(2);
  });

  it('attempts every browser cleanup and preserves first cleanup error', async () => {
    const { paths } = await createdRun();
    const closePage = vi.fn().mockRejectedValue(new Error('page cleanup failed'));
    const closeContext = vi.fn().mockRejectedValue(new Error('context cleanup failed'));
    const closeBrowser = vi.fn().mockRejectedValue(new Error('browser cleanup failed'));
    const verifyInputs = vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS));
    await expect(
      runGuardedBrowserPlayback(
        paths,
        {
          sequence: 1,
          pairId: 'h264-crf18',
          direction: 'forward',
          viewport: 'desktop-1440x1000',
          loopbackOrigin: 'http://127.0.0.1:4123',
          originalUrlPath: '/original/forward.mp4',
          candidateUrlPath: '/candidate/h264-crf18/forward.mp4',
          screenshotRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.png',
          jsonRelativePath: 'browser-receipts/h264-crf18-forward-desktop-1440x1000.json',
        },
        {
          verifyInputs,
          launchChromium: vi.fn().mockResolvedValue({
            version: vi.fn().mockResolvedValue('chromium-test'),
            newContext: vi.fn().mockResolvedValue({
              newPage: vi.fn().mockResolvedValue({
                goto: vi.fn().mockResolvedValue(undefined),
                evaluate: vi.fn().mockResolvedValue({
                  loadeddata: true,
                  canplay: true,
                  ended: true,
                  error: false,
                  firstFrameReady: true,
                  transitionReady: true,
                  originalDurationSeconds: 6.041667,
                  candidateDurationSeconds: 6.041667,
                  maximumDriftSeconds: 0.01,
                }),
                screenshot: vi.fn().mockResolvedValue(Buffer.from('png')),
                close: closePage,
              }),
              close: closeContext,
            }),
            close: closeBrowser,
          }),
          replaceOwnedFile: vi.fn(),
          nowIso: vi.fn().mockReturnValue('2026-08-31T00:00:00.000Z'),
          readJson: vi.fn().mockReturnValue({ commandReceipts: [], browserCommandReceipts: [] }),
        } as never,
      ),
    ).rejects.toThrow('page cleanup failed');
    expect(closePage).toHaveBeenCalledOnce();
    expect(closeContext).toHaveBeenCalledOnce();
    expect(closeBrowser).toHaveBeenCalledOnce();
    expect(verifyInputs).toHaveBeenCalledTimes(2);
  });

  it('builds direct-playback and null-direction visual receipts with frame times', async () => {
    const { paths } = await createdRun();
    const pair = {
      pairId: 'h264-crf18',
      codec: 'h264',
      quality: 18,
      extension: 'mp4',
      disposition: 'eligible',
      eligible: true,
      directions: {
        forward: directionResult('forward', 95, 4000000),
        reverse: directionResult('reverse', 95, 4000000),
      },
    } as never;
    for (const item of buildVisualInvocations(pair, paths, 1)) {
      if (item.artifactRelativePath) {
        await mkdir(path.dirname(path.resolve(paths.runRoot, item.artifactRelativePath)), { recursive: true });
        await writeFile(path.resolve(paths.runRoot, item.artifactRelativePath), Buffer.from('visual'));
      }
    }
    await writeFile(path.resolve(paths.runRoot, 'visuals/index.html'), Buffer.from('index'));
    const receipts = testVisualReceipts(paths, [pair], 'visuals/index.html', Buffer.from('index'));
    expect(receipts).toContainEqual(
      expect.objectContaining({ kind: 'direct-playback-index', pairId: null, direction: null }),
    );
    expect(receipts).toContainEqual(
      expect.objectContaining({ kind: 'lossless-frame', frameIndex: 72, timeSeconds: 3, direction: 'forward' }),
    );
    expect(receipts).toContainEqual(expect.objectContaining({ kind: 'local-sequence', direction: null }));
  });

  it('renders responsive synchronized direct-playback controls', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const dependencies = await mainVisualDependencies(fixture);
    await main(['visuals', '--run-id', fixture.manifest.runId], dependencies);
    const index = await readFile(path.resolve(fixture.paths.runRoot, 'visuals/index.html'), 'utf8');
    expect(index).toContain('data-action="play"');
    expect(index).toContain('data-action="pause"');
    expect(index).toContain('data-action="seek"');
    expect(index).toContain('grid-template-columns:1fr');
    expect(index).toContain('currentTime=original.currentTime');
    expect(index).toContain('src="/original/forward.mp4"');
    expect(index).toContain('src="/candidate/h264-crf18/forward.mp4"');
    expect(index).toContain('src="/original/reverse.mp4"');
    expect(index).toContain('src="/candidate/h264-crf18/reverse.mp4"');
    expect(index).toContain('original.playbackRate=1');
    expect(index).toContain('candidate.playbackRate=1');
  });

  it('generates a direct-playback index with a parseable inline script', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const dependencies = await mainVisualDependencies(fixture);

    await main(['visuals', '--run-id', fixture.manifest.runId], dependencies);

    const index = await readFile(path.resolve(fixture.paths.runRoot, 'visuals/index.html'), 'utf8');
    const script = index.match(/<script>([\s\S]*)<\/script>/)?.[1];

    expect(script).toBeDefined();
    expect(() => new vm.Script(script!)).not.toThrow();
  });

  it('rejects malformed user observations instead of treating missing fields as pending', async () => {
    const fixture = await completeEligibleVisualRun();
    const malformed = JSON.parse(JSON.stringify(fixture.observations));
    delete malformed.observations[0].transitionReady;
    await expect(
      recordObservations(fixture.paths, fixture.manifest, malformed, {
        verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
        replaceOwnedFile: vi.fn(),
      } as never),
    ).rejects.toThrow(/observation|field/i);
  });

  it('atomically records a complete valid user observation set', async () => {
    const fixture = await completeEligibleVisualRun();
    const verifyInputs = vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS));
    const result = await recordObservations(fixture.paths, fixture.manifest, fixture.observations, {
      verifyInputs,
      replaceOwnedFile: async (filePath: string, bytes: Uint8Array | string) => writeFile(filePath, bytes),
    } as never);
    expect(result).toEqual(fixture.observations);
    expect(JSON.parse(await readFile(fixture.paths.visualObservationsPath, 'utf8'))).toEqual(fixture.observations);
    expect(verifyInputs).toHaveBeenCalledTimes(2);
  });

  it('preserves manifest state and runs final verification when observation replacement fails', async () => {
    const fixture = await completeEligibleVisualRun();
    const verifyInputs = vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS));
    await expect(
      recordObservations(fixture.paths, fixture.manifest, fixture.observations, {
        verifyInputs,
        replaceOwnedFile: vi.fn().mockRejectedValue(new Error('observation write failed')),
      } as never),
    ).rejects.toThrow('observation write failed');
    expect(verifyInputs).toHaveBeenCalledTimes(2);
    expect(fixture.manifest.status).toBe(STATUS.PENDING_USER_APPROVAL);
  });

  it('rejects browser evidence when a required media field is missing or non-boolean', async () => {
    const fixture = await completeEligibleVisualRun();
    const malformed = JSON.parse(JSON.stringify(fixture.manifest));
    delete malformed.browserReceipts[0].receipt.ended;
    await writeFile(fixture.paths.manifestPath, JSON.stringify(malformed, null, 2));
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(/browser|field/i);
    const dependencies: any = { readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')) };
    await expect(
      recordDecision(
        fixture.paths,
        malformed,
        fixture.observations,
        { outcome: 'no-change', candidate: null, approvalReference: 'malformed-browser' },
        dependencies,
      ),
    ).rejects.toThrow(/browser|field/i);
  });

  it.each([
    ['direct-playback index', 'visuals/index.html', 'tampered-index'],
    ['lossless frame', 'visuals/frames/h264-crf18-forward-frame-000.png', 'tampered-frame'],
    ['local sequence', 'visuals/h264-crf18-forward-focus-reverse.mp4', 'tampered-sequence'],
  ])('rejects tampered %s bytes during visual identity validation', async (_label, relativePath, bytes) => {
    const fixture = await completeEligibleVisualRun(true);
    await writeFile(path.resolve(fixture.paths.runRoot, relativePath), bytes);
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(/visual|hash|artifact/i);
  });

  it('keeps final approved decision identity authenticated', async () => {
    const fixture = await completeEligibleVisualRun(true);
    await recordDecision(
      fixture.paths,
      fixture.manifest,
      fixture.observations,
      { outcome: 'approved', candidate: 'h264-crf18', approvalReference: 'approved-test' },
      decisionDependencies(fixture),
    );
    const decision = JSON.parse(await readFile(fixture.paths.decisionPath, 'utf8'));
    decision.winningPairId = 'vp9-cq24';
    await writeFile(fixture.paths.decisionPath, JSON.stringify(decision));
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(/decision|identity/i);
  });

  it('keeps final eligible reject-all decision identity authenticated', async () => {
    const fixture = await completeEligibleVisualRun(true);
    const rejected = JSON.parse(JSON.stringify(fixture.observations));
    rejected.observations[0].verdict = 'VISUALLY_REJECTED';
    await writeFile(fixture.paths.visualObservationsPath, JSON.stringify(rejected));
    await recordDecision(
      fixture.paths,
      fixture.manifest,
      rejected,
      { outcome: 'no-change', candidate: null, approvalReference: 'reject-all-test' },
      decisionDependencies(fixture),
    );
    const decision = JSON.parse(await readFile(fixture.paths.decisionPath, 'utf8'));
    decision.objectiveManifestSha256 = SHA;
    await writeFile(fixture.paths.decisionPath, JSON.stringify(decision));
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(
      /decision|hash|identity/i,
    );
  });

  it('keeps final zero-eligible decision identity authenticated', async () => {
    const fixture = await completeNoChangeRun();
    await recordDecision(
      fixture.paths,
      fixture.manifest,
      { schemaVersion: 1, runId: fixture.manifest.runId, observations: [] },
      { outcome: 'no-change', candidate: null, approvalReference: 'zero-test' },
      decisionDependencies(fixture),
    );
    const decision = JSON.parse(await readFile(fixture.paths.decisionPath, 'utf8'));
    decision.approvalReference = '';
    await writeFile(fixture.paths.decisionPath, JSON.stringify(decision));
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(/decision|identity/i);
  });

  it('rejects decision closeout when persisted observations differ from submitted observations', async () => {
    const fixture = await completeEligibleVisualRun(true);
    const tampered = JSON.parse(await readFile(fixture.paths.visualObservationsPath, 'utf8'));
    tampered.observations[0].defects.blocking = true;
    await writeFile(fixture.paths.visualObservationsPath, JSON.stringify(tampered));
    await expect(
      recordDecision(
        fixture.paths,
        fixture.manifest,
        fixture.observations,
        { outcome: 'approved', candidate: 'h264-crf18', approvalReference: 'observation-binding' },
        decisionDependencies(fixture),
      ),
    ).rejects.toThrow(/observation|hash|identity/i);
    expect(existsSync(fixture.paths.decisionPath)).toBe(false);
  });

  it('rejects final decision after visual observations are altered', async () => {
    const fixture = await completeEligibleVisualRun(true);
    await recordDecision(
      fixture.paths,
      fixture.manifest,
      fixture.observations,
      { outcome: 'approved', candidate: 'h264-crf18', approvalReference: 'observation-tamper' },
      decisionDependencies(fixture),
    );
    const observations = JSON.parse(await readFile(fixture.paths.visualObservationsPath, 'utf8'));
    observations.observations[0].normalSpeedVisibleDifference = true;
    await writeFile(fixture.paths.visualObservationsPath, JSON.stringify(observations));
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(
      /observation|hash|decision/i,
    );
  });

  it('binds final zero-eligible decision to exact empty observations', async () => {
    const fixture = await completeNoChangeRun();
    await recordDecision(
      fixture.paths,
      fixture.manifest,
      { schemaVersion: 1, runId: fixture.manifest.runId, observations: [] },
      { outcome: 'no-change', candidate: null, approvalReference: 'empty-observation-binding' },
      decisionDependencies(fixture),
    );
    const decision = JSON.parse(await readFile(fixture.paths.decisionPath, 'utf8'));
    expect(decision.visualObservationsSha256).toBeNull();
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).not.toThrow();
  });
});

describe('atomic lifecycle and objective authentication', () => {
  it('opens zero-eligible objective inventory before decision.json, then closes NO_CHANGE atomically', async () => {
    const { repositoryRoot, paths, manifest } = await completeNoChangeRun();
    expect(openRun(repositoryRoot, 'zero-eligible', 'decision').status).toBe(STATUS.NO_CHANGE);
    const dependencies: any = {
      readJson: (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')),
      verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
      writeFileExclusive: (filePath: string, bytes: Uint8Array) => writeFile(filePath, bytes, { flag: 'wx' }),
      replaceOwnedFile: (filePath: string, bytes: Uint8Array | string) => writeFile(filePath, bytes),
      getProtectedPlanHashes: vi.fn().mockResolvedValue([
        {
          relativePath: 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
          bytes: 1,
          sha256: SHA,
        },
        { relativePath: 'docs/superpowers/plans/phase-2-task-3-execution.md', bytes: 1, sha256: SHA },
      ]),
    };
    dependencies.writeManifestAtomic = (nextPaths: any, nextManifest: any) =>
      writeManifestAtomic(nextPaths, nextManifest, dependencies);
    const result = await recordDecision(
      paths,
      manifest,
      { schemaVersion: 1, runId: manifest.runId, observations: [] },
      { outcome: 'no-change', candidate: null, approvalReference: 'zero-eligible-test' },
      dependencies,
    );
    expect(result.decision.outcome).toBe('NO_CHANGE');
    expect(await readFile(paths.decisionPath, 'utf8')).toContain('zero-eligible-test');
    expect(await readFile(paths.deliveryReportPath, 'utf8')).toContain('objectiveManifestSha256');
    expect(await readFile(paths.deliveryReportPath, 'utf8')).not.toMatch(/absolute|Safari|fallback|rollout|deployed/i);
    expect(openRun(repositoryRoot, 'zero-eligible', 'decision').status).toBe(STATUS.NO_CHANGE);
    expect(() => resolveRunPaths(repositoryRoot, 'zero-eligible', 'open')).not.toThrow();
  });

  it('rejects objective evidence when snapshot hash is changed', async () => {
    const { repositoryRoot, paths } = await completeNoChangeRun();
    const evidence = JSON.parse(await readFile(paths.objectiveEvidencePath, 'utf8'));
    evidence.objectiveManifestSha256 = SHA;
    await writeFile(paths.objectiveEvidencePath, JSON.stringify(evidence));
    expect(() => validateManifestIdentity(paths.runRoot, 'zero-eligible', 'identity')).toThrow(/authentication|hash/i);
  });

  it('rejects objective evidence when a metric file bytes/hash no longer match', async () => {
    const { repositoryRoot, paths } = await completeNoChangeRun();
    const metricPath = path.resolve(paths.runRoot, 'metrics/h264-crf18-forward-vmaf.json');
    await writeFile(metricPath, '{"pooled_metrics":{"vmaf":{"mean":94}}}tampered');
    expect(() => validateManifestIdentity(paths.runRoot, 'zero-eligible', 'identity')).toThrow(/metric|hash/i);
  });

  it('cross-validates every direction receipt sequence array against objective receipts', async () => {
    const { paths, manifest } = await completeNoChangeRun();
    const tampered = JSON.parse(JSON.stringify(manifest));
    tampered.pairResults[0].directions.forward.metricReceiptSequences = [999999];
    const objectiveBytes = Buffer.from(JSON.stringify(tampered, null, 2) + '\n');
    await writeFile(paths.objectiveManifestPath, objectiveBytes);
    await writeFile(
      paths.objectiveEvidencePath,
      JSON.stringify({
        schemaVersion: 1,
        runId: tampered.runId,
        implementationBaseline: BASELINE,
        harnessCommit: HARNESS,
        objectiveManifestSha256: hash(objectiveBytes),
        createdAt: '2026-08-31T00:00:00.000Z',
      }),
    );
    await writeFile(paths.manifestPath, JSON.stringify(tampered, null, 2));
    expect(() => validateManifestIdentity(paths.runRoot, tampered.runId, 'identity')).toThrow(/sequence|linkage/i);
  });

  it('uses exact partial/final paths and never deletes a partial manifest', async () => {
    const { paths, manifest } = await createdRun();
    const calls: string[] = [];
    const dependencies: any = {
      verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
      writeFileExclusive: vi.fn(async (filePath: string) => calls.push(`write:${filePath}`)),
      replaceOwnedFile: vi.fn(async (filePath: string) => calls.push(`replace:${filePath}`)),
    };
    dependencies.writeFileExclusive = vi.fn(async (filePath: string, bytes: Uint8Array) => {
      await writeFile(filePath, bytes, { flag: 'wx' });
      calls.push(`write:${filePath}`);
    });
    await expect(writeManifestAtomic(paths, manifest, dependencies)).resolves.toHaveLength(64);
    expect(calls).toContain(`write:${paths.manifestPartialPath}`);
    expect(calls.some((call) => /rm|unlink|delete/i.test(call))).toBe(false);
  });

  it('uses injected final replacement and authenticates final manifest bytes', async () => {
    const { paths, manifest } = await createdRun();
    const replaceOwnedFile = vi.fn(async (filePath: string, bytes: Uint8Array | string) => writeFile(filePath, bytes));
    const dependencies: any = {
      verifyInputs: vi.fn().mockResolvedValue(ENCODE_SOURCE_CONTRACTS.concat(VISUAL_SUPPORT_CONTRACTS)),
      writeFileExclusive: (filePath: string, bytes: Uint8Array) => writeFile(filePath, bytes, { flag: 'wx' }),
      replaceOwnedFile,
    };
    const expected = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
    await expect(writeManifestAtomic(paths, manifest, dependencies)).resolves.toBe(hash(expected));
    expect(replaceOwnedFile).toHaveBeenCalledWith(paths.manifestPath, expect.anything());
    expect(hash(await readFile(paths.manifestPath))).toBe(hash(expected));
  });
});

describe('manifest validation', () => {
  it('returns deep-frozen initial identity and rejects foreign run IDs', async () => {
    const { paths, manifest } = await createdRun();
    expect(Object.isFrozen(validateManifestIdentity(paths.runRoot, 'pilot-01', 'identity'))).toBe(true);
    const foreign = JSON.parse(await readFile(paths.manifestPath, 'utf8'));
    foreign.runId = 'foreign';
    await writeFile(paths.manifestPath, JSON.stringify(foreign));
    expect(() => validateManifestIdentity(paths.runRoot, 'pilot-01', 'identity')).toThrow(/run id/i);
    expect(manifest.runId).toBe('pilot-01');
  });

  it('rejects unknown top-level manifest fields', async () => {
    const fixture = await createdRun();
    const tampered = JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8'));
    tampered.metadata = 'not allowed';
    await writeFile(fixture.paths.manifestPath, JSON.stringify(tampered));
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(/fields|schema/i);
  });

  it('rejects missing pair, direction, probe, metric, and command fields', async () => {
    const cases = [
      ['pair', (manifest: any) => delete manifest.pairResults[0].eligible],
      ['direction', (manifest: any) => delete manifest.pairResults[0].directions.forward.direction],
      ['probe', (manifest: any) => delete manifest.pairResults[0].directions.forward.probe.codecName],
      ['metric', (manifest: any) => delete manifest.pairResults[0].directions.forward.metrics.vmaf.value],
      ['command', (manifest: any) => delete manifest.commandReceipts[0].exitCode],
    ] as const;
    for (const [label, mutate] of cases) {
      const fixture = await completeNoChangeRun();
      const tampered = JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8'));
      mutate(tampered);
      await writeFile(fixture.paths.manifestPath, JSON.stringify(tampered));
      expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity'), label).toThrow(
        /fields|identity|evidence|receipt|unauthenticated/i,
      );
    }
  });

  it('rejects unknown visual, browser-command, and browser-evidence fields', async () => {
    for (const mutate of [
      (manifest: any) => (manifest.visualReceipts[0].metadata = true),
      (manifest: any) => (manifest.browserCommandReceipts[0].metadata = true),
      (manifest: any) => (manifest.browserReceipts[0].metadata = true),
    ]) {
      const fixture = await completeEligibleVisualRun(true);
      const tampered = JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8'));
      mutate(tampered);
      await writeFile(fixture.paths.manifestPath, JSON.stringify(tampered));
      expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity')).toThrow(
        /fields|schema|receipt/i,
      );
    }
  });
});

describe('visual main transition lifecycle', () => {
  it('creates the exact visual frames parent before the first frame spawn', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const dependencies = await mainVisualDependencies(fixture);
    const framesRoot = path.resolve(fixture.paths.runRoot, 'visuals/frames');
    dependencies.spawnProcess.mockImplementation(async (item: any) => {
      if (item.artifactRelativePath?.startsWith('visuals/frames/')) {
        expect(existsSync(framesRoot)).toBe(true);
        expect((await import('node:fs')).statSync(framesRoot).isDirectory()).toBe(true);
      }
      if (item.artifactRelativePath) {
        const artifactPath = path.resolve(fixture.paths.runRoot, item.artifactRelativePath);
        await writeFile(artifactPath, Buffer.from('visual'));
      }
      return { exitCode: 0, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
    });
    await expect(main(['visuals', '--run-id', fixture.manifest.runId], dependencies)).resolves.toBe(0);
    expect(dependencies.spawnProcess).toHaveBeenCalled();
  });

  it('publishes pending approval only after presentation and server close succeed', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const dependencies = await mainVisualDependencies(fixture);
    await expect(main(['visuals', '--run-id', fixture.manifest.runId], dependencies)).resolves.toBe(0);
    const stored = JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8'));
    expect(stored.status).toBe(STATUS.PENDING_USER_APPROVAL);
    expect(dependencies.presentReviewPackage).toHaveBeenCalledOnce();
    expect(dependencies.startLoopbackServer).toHaveBeenCalledOnce();
    const handle = await dependencies.startLoopbackServer.mock.results[0].value;
    expect(handle.close).toHaveBeenCalledOnce();
    expect(dependencies.presentReviewPackage.mock.invocationCallOrder[0]).toBeLessThan(
      handle.close.mock.invocationCallOrder[0],
    );
    expect(openRun(fixture.repositoryRoot, fixture.manifest.runId, 'identity').status).toBe(
      STATUS.PENDING_USER_APPROVAL,
    );
  });

  it('keeps failed presentation run non-reopenable and requires new run ID', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const dependencies = await mainVisualDependencies(fixture);
    dependencies.presentReviewPackage.mockRejectedValue(new Error('presentation failed'));
    await expect(main(['visuals', '--run-id', fixture.manifest.runId], dependencies)).rejects.toThrow(
      'presentation failed',
    );
    expect(JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8')).status).toBe(STATUS.OBJECTIVE_EVIDENCE_READY);
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'visuals')).toThrow(/inventory|new run/i);
  });

  it('keeps server-close failure run non-reopenable and requires new run ID', async () => {
    const fixture = await completeEligibleObjectiveRun();
    const dependencies = await mainVisualDependencies(fixture);
    dependencies.startLoopbackServer.mockImplementationOnce(async () => ({
      requestedPort: 0,
      resolvedPort: 4123,
      origin: 'http://127.0.0.1:4123',
      close: vi.fn().mockRejectedValue(new Error('server close failed')),
    }));
    await expect(main(['visuals', '--run-id', fixture.manifest.runId], dependencies)).rejects.toThrow(
      'server close failed',
    );
    expect(JSON.parse(await readFile(fixture.paths.manifestPath, 'utf8')).status).toBe(STATUS.OBJECTIVE_EVIDENCE_READY);
    expect(() => openRun(fixture.repositoryRoot, fixture.manifest.runId, 'visuals')).toThrow(/inventory|new run/i);
  });
});
