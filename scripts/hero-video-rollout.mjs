import { createHash } from 'node:crypto';
import { spawn as spawnChild } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import * as fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

/** @typedef {'CHARACTERIZED'|'GENERATING'|'VALIDATED'|'PROMOTED'|'NO_CHANGE'|'BLOCKED'} RolloutStatus */
/** @typedef {'UNCHANGED'|'VERIFIED'|'ROLLED_BACK'|'UNKNOWN'} ProductionState */
/** @typedef {'webm'|'mp4'} VideoFormat */
/** @typedef {28|24|20|18} Quality */
/** @typedef {{id:string,sourcePath:string,bytes:number,sha256:string,width:number,height:number}} HeroVideoSource */
/** @typedef {{loadeddata:boolean,playing:boolean,ended:boolean,error:null|string,events:string[],url:string,browserVersion:string}} PlaybackEvidence */
/** @typedef {{codecName:string,width:number,height:number,pixelFormat:string,rFrameRate:string,avgFrameRate:string,packets:number,durationSeconds:number,videoStreams:number,audioStreams:number,attachedPictures:number,streamTags:Record<string,string>,formatTags:Record<string,string>}} ProbeEvidence */
/** @typedef {{sourceId:string,format:VideoFormat,quality:Quality,attempt:number,candidatePath:string,bytes:number,sha256:string,probe:ProbeEvidence,vmaf:number,playback:PlaybackEvidence}} CandidateEvidence */
/** @typedef {{path:string,bytes:number,sha256:string,format:VideoFormat}} ProductionEvidence */
/** @typedef {{accepted:boolean,failedGates:string[],classification:'PASS'|'RETRY'|'NO_CHANGE'|'BLOCKED'}} CandidateAssessment */
/** @typedef {{sequence:number,kind:string,sourceId:string|null,format:VideoFormat|null,quality:Quality|null,attempt:number|null,candidateSha256:string|null,status:'SUCCEEDED'|'FAILED',executable:string|null,args:string[],exitCode:number|null,artifactPath:string|null,artifactSha256:string|null}} RolloutReceipt */
/** @typedef {{sequence:number,operation:'exists'|'lstat'|'stat'|'realpath'|'readFile'|'readdir'|'mkdir'|'writeFile'|'open'|'copyFile'|'rename'|'unlink',mode:'OBSERVE'|'MUTATE',path:string,secondaryPath:string|null}} FilesystemReceipt */
/** @typedef {{targetRelative:string,temporaryRelative:string,format:VideoFormat,candidateSha256:string,originalSha256:string|null,state:'INTENT'|'COMPLETED'}} PromotionTargetIntent */
/** @typedef {{schemaVersion:1,runId:string,implementationBaseline:string,pilotHarnessCommit:'7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe',status:RolloutStatus,productionState:'UNCHANGED'|'VERIFIED'|'ROLLED_BACK'|'UNKNOWN',immutableSources:HeroVideoSource[],backupSources:Array<{sourcePath:string,backupPath:string,bytes:number,sha256:string}>,candidates:CandidateEvidence[],aggregate:null|{originalBytes:103076167,webmBytes:number,reductionBytes:number,reductionPercent:number,passed:boolean},production:Array<{path:string,bytes:number,sha256:string,format:VideoFormat}>,promotionAttempt:null|{id:string,mutationStarted:boolean,entries:PromotionTargetIntent[]},failure:null|{sourceId:string|null,format:VideoFormat|null,quality:Quality|null,failedGates:string[],reason:string},receipts:RolloutReceipt[],filesystemReceipts:FilesystemReceipt[]}} RolloutManifest */
/** @typedef {{platform?:NodeJS.Platform,spawn:(executable:string,args:string[],options:{cwd:string,shell:false,windowsHide:true})=>import('node:child_process').ChildProcessWithoutNullStreams,exists:(path:string)=>Promise<boolean>,lstat:(path:string)=>Promise<import('node:fs').Stats>,realpath:(path:string)=>Promise<string>,readFile:(path:string)=>Promise<Buffer>,writeFile:(path:string,data:Buffer,options:{flag:'wx'})=>Promise<void>,copyFile:(from:string,to:string,flags:number)=>Promise<void>,rename:(from:string,to:string)=>Promise<void>,unlink:(path:string)=>Promise<void>,mkdir:(path:string,options:{recursive:boolean})=>Promise<void>,open:(path:string,flags:string)=>Promise<{sync:()=>Promise<void>,close:()=>Promise<void>}>,readdir:(path:string)=>Promise<string[]>,stat:(path:string)=>Promise<import('node:fs').Stats>,playCandidate:(candidatePath:string,format:VideoFormat,timeoutMs:number)=>Promise<PlaybackEvidence>,hashFile?:(path:string)=>Promise<string>,verifyImmutableSources?:(repositoryRoot:string)=>Promise<void>,verifyPromotedTrackedIdentity?:(context:RolloutContext)=>Promise<void>,assertPreMutationSnapshot?:(context:RolloutContext)=>Promise<void>,assertGenerationBoundary?:(repositoryRoot:string,implementationBaseline:string)=>Promise<void>,loadManifest?:(paths:RolloutPaths)=>Promise<RolloutManifest>,characterizeRollout?:(repositoryRoot:string,paths:RolloutPaths,parsed:Record<string,string>,dependencies:RolloutDependencies)=>Promise<RolloutManifest>,runCandidateBatch?:(context:RolloutContext)=>Promise<RolloutManifest>,promoteValidatedBatch?:(context:RolloutContext)=>Promise<RolloutManifest>,recoverInterruptedPromotion?:(context:RolloutContext)=>Promise<RolloutManifest>,verifyProduction?:(context:RolloutContext)=>Promise<RolloutManifest>,reportPromotedRollout?:(context:RolloutContext)=>Promise<Record<string,unknown>>,encodeProbeMetricAndPlay?:(source:HeroVideoSource,format:VideoFormat,quality:Quality,attempt:number,context:RolloutContext)=>Promise<CandidateEvidence>,assessCandidate?:(source:HeroVideoSource,candidate:CandidateEvidence)=>Promise<CandidateAssessment>}} RolloutDependencies */
/** @typedef {{repositoryRoot:string,runId:'phase-6c-rollout-20260901-01',implementationBaseline:string,paths:RolloutPaths,manifest:RolloutManifest,dependencies:RolloutDependencies,filesystemReceipts:FilesystemReceipt[]}} RolloutContext */

export const ROLLOUT_STATUS = Object.freeze({
  CHARACTERIZED: 'CHARACTERIZED',
  GENERATING: 'GENERATING',
  VALIDATED: 'VALIDATED',
  PROMOTED: 'PROMOTED',
  NO_CHANGE: 'NO_CHANGE',
  BLOCKED: 'BLOCKED',
});
export const FORBIDDEN_INHERITED_TAGS = Object.freeze([
  'title',
  'comment',
  'description',
  'synopsis',
  'creation_time',
  'date',
  'location',
  'artist',
  'album',
  'album_artist',
  'copyright',
  'encoder_settings',
]);
export const PERMITTED_STREAM_TAGS = Object.freeze({
  webm: ['DURATION', 'ENCODER'],
  mp4: ['encoder', 'handler_name', 'language', 'vendor_id'],
});
export const PERMITTED_FORMAT_TAGS = Object.freeze({
  webm: ['encoder'],
  mp4: ['compatible_brands', 'encoder', 'major_brand', 'minor_version'],
});

const STATUS_TRANSITIONS = Object.freeze({
  CHARACTERIZED: ['GENERATING', 'BLOCKED'],
  GENERATING: ['VALIDATED', 'NO_CHANGE', 'BLOCKED'],
  VALIDATED: ['PROMOTED', 'NO_CHANGE', 'BLOCKED'],
  PROMOTED: ['NO_CHANGE', 'BLOCKED'],
  NO_CHANGE: [],
  BLOCKED: [],
});

function resolveForFilesystem(...segments) {
  return path.resolve(...segments).replaceAll('\\', '/');
}

export function resolveRolloutPaths(repositoryRoot, runId) {
  if (runId !== 'phase-6c-rollout-20260901-01') throw new Error('Run ID is not authorized.');
  const evidenceRoot = resolveForFilesystem(repositoryRoot, '.superpowers/sdd/phase-6c-hero-video-rollout');
  const runRoot = resolveForFilesystem(evidenceRoot, 'runs', runId);
  if (!isAtOrInside(evidenceRoot, runRoot) || evidenceRoot === runRoot)
    throw new Error('Run root escapes evidence root.');
  return Object.freeze({
    repositoryRoot: resolveForFilesystem(repositoryRoot),
    evidenceRoot,
    runRoot,
    candidates: resolveForFilesystem(runRoot, 'candidates'),
    passlogs: resolveForFilesystem(runRoot, 'passlogs'),
    probes: resolveForFilesystem(runRoot, 'probes'),
    metrics: resolveForFilesystem(runRoot, 'metrics'),
    browser: resolveForFilesystem(runRoot, 'browser'),
    backups: resolveForFilesystem(runRoot, 'backups'),
    manifest: resolveForFilesystem(runRoot, 'manifest.json'),
  });
}

function transitionStatus(manifest, next) {
  if (!STATUS_TRANSITIONS[manifest.status]?.includes(next))
    throw new Error(`Invalid manifest transition: ${manifest.status} to ${next}`);
  manifest.status = next;
}

function validateManifest(manifest) {
  const exactKeys = [
    'schemaVersion',
    'runId',
    'implementationBaseline',
    'pilotHarnessCommit',
    'status',
    'productionState',
    'immutableSources',
    'backupSources',
    'candidates',
    'aggregate',
    'production',
    'promotionAttempt',
    'failure',
    'receipts',
    'filesystemReceipts',
  ];
  if (Object.keys(manifest).sort().join('\n') !== exactKeys.sort().join('\n'))
    throw new Error('Manifest key set mismatch.');
  if (manifest.schemaVersion !== 1 || manifest.runId !== 'phase-6c-rollout-20260901-01')
    throw new Error('Manifest identity mismatch.');
  if (!/^[0-9a-f]{40}$/u.test(manifest.implementationBaseline)) throw new Error('Manifest baseline is invalid.');
  if (manifest.pilotHarnessCommit !== '7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe')
    throw new Error('Pilot harness identity mismatch.');
  validateSourceInventory(manifest.immutableSources);
  if (!Object.values(ROLLOUT_STATUS).includes(manifest.status)) throw new Error('Manifest status is invalid.');
  if (!['UNCHANGED', 'VERIFIED', 'ROLLED_BACK', 'UNKNOWN'].includes(manifest.productionState))
    throw new Error('Manifest production state is invalid.');
  const sequences = manifest.receipts.map(({ sequence }) => sequence);
  if (sequences.some((sequence, index) => sequence !== index + 1)) throw new Error('Receipt sequence is invalid.');
  return manifest;
}

function defaultDependencies() {
  const audit = [];
  const observe =
    (operation, implementation) =>
    async (...args) => {
      audit.push({
        sequence: audit.length + 1,
        operation,
        mode: 'OBSERVE',
        path: String(args[0]),
        secondaryPath: null,
      });
      return await implementation(...args);
    };
  const mutate =
    (operation, implementation) =>
    async (...args) => {
      audit.push({
        sequence: audit.length + 1,
        operation,
        mode: 'MUTATE',
        path: String(args[0]),
        secondaryPath: args[1] && typeof args[1] === 'string' ? args[1] : null,
      });
      return await implementation(...args);
    };
  return {
    audit,
    platform: process.platform,
    spawn: spawnChild,
    exists: observe(
      'exists',
      async (target) =>
        await fsp.access(target).then(
          () => true,
          (error) => (error.code === 'ENOENT' ? false : Promise.reject(error)),
        ),
    ),
    lstat: observe('lstat', fsp.lstat),
    realpath: observe('realpath', fsp.realpath),
    readFile: observe('readFile', fsp.readFile),
    writeFile: mutate('writeFile', fsp.writeFile),
    copyFile: mutate('copyFile', fsp.copyFile),
    rename: mutate('rename', fsp.rename),
    unlink: mutate('unlink', fsp.unlink),
    mkdir: mutate('mkdir', fsp.mkdir),
    open: async (...args) => {
      const recorder = args[1] === 'r' ? observe('open', fsp.open) : mutate('open', fsp.open);
      return await recorder(...args);
    },
    readdir: observe('readdir', fsp.readdir),
    stat: observe('stat', fsp.stat),
    playCandidate,
  };
}

export const MP4_PROMOTION_ALLOWLIST = Object.freeze([
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
]);

export const WEBM_PROMOTION_ALLOWLIST = Object.freeze([
  'public/assets/hero/bedroom-bed-forward.webm',
  'public/assets/hero/bedroom-bed-reverse.webm',
  'public/assets/hero/bedroom-chair-forward.webm',
  'public/assets/hero/bedroom-chair-reverse.webm',
  'public/assets/hero/chair-forward.webm',
  'public/assets/hero/chair-reverse.webm',
  'public/assets/hero/kitchen-dining-forward.webm',
  'public/assets/hero/kitchen-dining-reverse.webm',
  'public/assets/hero/kitchen-island-forward.webm',
  'public/assets/hero/kitchen-island-reverse.webm',
  'public/assets/hero/sofa-forward.webm',
  'public/assets/hero/sofa-reverse.webm',
  'public/assets/hero/terrace-chair-forward.webm',
  'public/assets/hero/terrace-chair-reverse.webm',
  'public/assets/hero/terrace-sofa-forward.webm',
  'public/assets/hero/terrace-sofa-reverse.webm',
]);

export const HERO_VIDEO_SOURCES = Object.freeze(
  [
    [
      'bedroom-bed-forward',
      'public/assets/hero/bedroom-bed-forward.mp4',
      3979743,
      '34c684217333b446253485a15659999d6e465d7ac52902f8a7f657cf35370ed1',
      1168,
      768,
    ],
    [
      'bedroom-bed-reverse',
      'public/assets/hero/bedroom-bed-reverse.mp4',
      3211117,
      '84b9481ca9ec1e6a049ba5955c902431c1876b37ed051b0a202bbc46e20ee8fa',
      1168,
      768,
    ],
    [
      'bedroom-chair-forward',
      'public/assets/hero/bedroom-chair-forward.mp4',
      6476041,
      '8f192f5a2e735116340391cda3db0f17caeb91102ec69c97b6d624d86b0dc0e7',
      1168,
      768,
    ],
    [
      'bedroom-chair-reverse',
      'public/assets/hero/bedroom-chair-reverse.mp4',
      5437362,
      'a48d8f03959196904a5eedd7241435c57b00740ad56cc1d416a98729b9a91cc4',
      1168,
      768,
    ],
    [
      'chair-forward',
      'public/assets/hero/chair-forward.mp4',
      9022617,
      '830bfcdf25fc3af7b137e4fdcace3775dafcf7f1b02a05aba340b0fc6ae0e3de',
      1168,
      768,
    ],
    [
      'chair-reverse',
      'public/assets/hero/chair-reverse.mp4',
      7696268,
      'a458d20808a0c843a1deb0afaf812613bb34303dfcc0f7fc4a99990a03ac1ed8',
      1168,
      768,
    ],
    [
      'kitchen-dining-forward',
      'public/assets/hero/kitchen-dining-forward.mp4',
      6138461,
      '1a2b06356edab8950d2c3ab6cc47fb8e96e13453e3dc3dceff38fda0ef88d5ac',
      1168,
      784,
    ],
    [
      'kitchen-dining-reverse',
      'public/assets/hero/kitchen-dining-reverse.mp4',
      5330779,
      '89e1aef8be033d717cd652a15a41669e6d5aeae63374aed6fee2075331fa6dc9',
      1168,
      784,
    ],
    [
      'kitchen-island-forward',
      'public/assets/hero/kitchen-island-forward.mp4',
      4664253,
      '8b0347469a1d3dafdbbd35c1da90ab6dbb2046163de5286a09cab9517c3de8c2',
      1168,
      784,
    ],
    [
      'kitchen-island-reverse',
      'public/assets/hero/kitchen-island-reverse.mp4',
      4013620,
      '7ebab953d4fa7abaca66a452ea2bcac00528d94be0cfe314c9ac9f75c9ee9c1f',
      1168,
      784,
    ],
    [
      'sofa-forward',
      'public/assets/hero/sofa-forward.mp4',
      6918992,
      '97928b8a8659750df9cd89fc2109f57a943413564b6d320214c8bc7c43de6655',
      1168,
      768,
    ],
    [
      'sofa-reverse',
      'public/assets/hero/sofa-reverse.mp4',
      5679663,
      'dd38f87e057a9a13176ff7a35bc624419c4102fd61aae6b4b19044fa4d4177f5',
      1168,
      768,
    ],
    [
      'terrace-chair-forward',
      'public/assets/hero/terrace-chair-forward.mp4',
      8556765,
      'e375a3c87f142df574abe4371967a4fcba99356067ff6c716292e746d615381f',
      1168,
      784,
    ],
    [
      'terrace-chair-reverse',
      'public/assets/hero/terrace-chair-reverse.mp4',
      7382094,
      '726404a4e234fad318b65609a9dfcb838e878cc7eb21f30743e49d2dca686c6d',
      1168,
      784,
    ],
    [
      'terrace-sofa-forward',
      'public/assets/hero/terrace-sofa-forward.mp4',
      9941316,
      '68c5db691631c94f141a230fe5f37f9f74e7115302b57398b4dfb036065d4892',
      1168,
      784,
    ],
    [
      'terrace-sofa-reverse',
      'public/assets/hero/terrace-sofa-reverse.mp4',
      8627076,
      '1683f5051bcf4f91e946af436fcbd894ed3cd76d08d2446d8306e44a9494973c',
      1168,
      784,
    ],
  ].map(([id, sourcePath, bytes, sha256, width, height]) =>
    Object.freeze({ id, sourcePath, bytes, sha256, width, height }),
  ),
);

function isAtOrInside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export async function assertContainedRegularFile(root, target, dependencies) {
  const lexicalStat = await dependencies.lstat(target);
  if (!lexicalStat.isFile() || lexicalStat.isSymbolicLink())
    throw new Error('Owned artifact must be a regular non-link file.');
  const realRoot = await dependencies.realpath(root);
  const realTarget = await dependencies.realpath(target);
  if (realRoot === realTarget || !isAtOrInside(realRoot, realTarget)) throw new Error('Path escapes owned root.');
  const stat = await dependencies.lstat(realTarget);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Owned artifact must be a regular non-link file.');
  return realTarget;
}

async function assertContainedNewPath(root, target, dependencies) {
  const realRoot = await dependencies.realpath(root);
  const realParent = await dependencies.realpath(path.dirname(target));
  if (!isAtOrInside(realRoot, realParent)) throw new Error('New path parent escapes owned root.');
  try {
    const stat = await dependencies.lstat(target);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('Existing target is a link or non-file.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function spawnChecked(executable, args, cwd, dependencies, timeoutMs = 120000) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string' || /[\0\r\n]/u.test(arg))) {
    throw new Error('Process argument is invalid.');
  }
  return await new Promise((resolve, reject) => {
    const child = dependencies.spawn(executable, args, { cwd, shell: false, windowsHide: true });
    const stdout = [];
    const stderr = [];
    let settled = false;
    const finish = (callback) => (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(reject)(Object.assign(new Error(`${executable} timed out after ${timeoutMs}ms.`), { gate: 'process' }));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
    child.once('error', finish(reject));
    child.once(
      'close',
      finish((exitCode) => {
        const result = {
          exitCode,
          stdout: Buffer.concat(stdout).toString('utf8'),
          stderr: Buffer.concat(stderr).toString('utf8'),
        };
        if (exitCode !== 0) reject(Object.assign(new Error(`${executable} exited ${exitCode}.`), { gate: 'process' }));
        else resolve(result);
      }),
    );
  });
}

const PROCESS_TIMEOUT_MS = Object.freeze({
  'encode-pass-1': 900000,
  'encode-pass-2': 900000,
  encode: 900000,
  probe: 120000,
  vmaf: 120000,
  'post-promotion-vmaf': 120000,
});

export function timeoutForInvocation(invocation) {
  const timeout = PROCESS_TIMEOUT_MS[invocation.kind];
  if (!Number.isSafeInteger(timeout)) throw new Error(`No timeout policy for invocation kind: ${invocation.kind}`);
  return timeout;
}

export function buildWebmAbsenceGates(repositoryRoot, implementationBaseline) {
  return {
    gitChecks: WEBM_PROMOTION_ALLOWLIST.flatMap((relative) => [
      ['cat-file', '-e', `${implementationBaseline}:${relative}`],
      ['cat-file', '-e', `HEAD:${relative}`],
      ['ls-files', '--error-unmatch', '--', relative],
    ]),
    worktreeWebmTargets: WEBM_PROMOTION_ALLOWLIST.map((relative) => path.resolve(repositoryRoot, relative)),
    temporarySiblings: [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST].flatMap((relative) =>
      ['.phase-6c-rollout.tmp', '.phase-6c-rollback.tmp'].map(
        (suffix) => `${path.resolve(repositoryRoot, relative)}${suffix}`,
      ),
    ),
  };
}

export function commandPreflightPolicy(command) {
  return {
    requireGenerationBoundary: command === 'characterize' || command === 'run',
  };
}

async function preflightRollout(command, repositoryRoot, implementationBaseline, dependencies) {
  const branch = await spawnChecked('git', ['branch', '--show-current'], repositoryRoot, dependencies);
  if (branch.stdout.trim() !== 'phase/06-hardening-release') throw new Error('BLOCKED: rollout branch mismatch.');
  await spawnChecked(
    'git',
    ['check-ignore', '-q', '--', '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01'],
    repositoryRoot,
    dependencies,
  );
  const attributes = await spawnChecked(
    'git',
    ['check-attr', 'filter', '--', ...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST],
    repositoryRoot,
    dependencies,
  );
  const attributeLines = attributes.stdout.trim().split(/\r?\n/u);
  if (attributeLines.length !== 32 || attributeLines.some((line) => !line.endsWith(': filter: lfs')))
    throw new Error('BLOCKED: Git LFS attribute coverage mismatch.');
  if (!['characterize', 'run', 'report'].includes(command)) return;
  const ffmpegVersion = await spawnChecked('ffmpeg', ['-version'], repositoryRoot, dependencies);
  const encoders =
    command === 'report'
      ? null
      : await spawnChecked('ffmpeg', ['-hide_banner', '-encoders'], repositoryRoot, dependencies);
  const filters = await spawnChecked('ffmpeg', ['-hide_banner', '-filters'], repositoryRoot, dependencies);
  const ffprobeVersion =
    command === 'report' ? null : await spawnChecked('ffprobe', ['-version'], repositoryRoot, dependencies);
  if (
    !ffmpegVersion.stdout.includes('ffmpeg version 8.1.2') ||
    (ffprobeVersion && !ffprobeVersion.stdout.includes('ffprobe version 8.1.2'))
  )
    throw new Error('BLOCKED: FFmpeg tool version mismatch.');
  if (encoders)
    for (const encoder of ['libvpx-vp9', 'libx264'])
      if (!encoders.stdout.includes(encoder)) throw new Error(`BLOCKED: missing encoder ${encoder}.`);
  if (!filters.stdout.includes('libvmaf')) throw new Error('BLOCKED: missing libvmaf filter.');
  if (process.version !== 'v24.18.0') throw new Error('BLOCKED: Node version mismatch.');
  if (command === 'report') return;
  const browser = await chromium.launch({ timeout: 30000 });
  try {
    if (!browser.version().startsWith('148.0.7778.')) throw new Error('BLOCKED: Chromium version mismatch.');
  } finally {
    await browser.close();
  }
}

async function assertGenerationBoundary(repositoryRoot, implementationBaseline, dependencies) {
  for (const artifact of [
    'docs/superpowers/specs/2026-09-01-phase-6c-hero-video-rollout-planning-brief.md',
    'docs/superpowers/plans/2026-09-01-phase-6c-hero-video-rollout.md',
  ])
    await spawnChecked(
      'git',
      ['cat-file', '-e', `${implementationBaseline}:${artifact}`],
      repositoryRoot,
      dependencies,
    );
  try {
    await spawnChecked(
      'git',
      ['cat-file', '-e', `${implementationBaseline}:scripts/hero-video-rollout.mjs`],
      repositoryRoot,
      dependencies,
    );
    throw new Error('BLOCKED: implementation baseline already contains rollout code.');
  } catch (error) {
    if (error.message === 'BLOCKED: implementation baseline already contains rollout code.') throw error;
  }
  for (const [relative, expectedHash] of [
    [
      'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
      'fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9',
    ],
    [
      'docs/superpowers/plans/phase-2-task-3-execution.md',
      'f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2',
    ],
  ])
    if ((await sha256File(path.resolve(repositoryRoot, relative), dependencies)) !== expectedHash)
      throw new Error(`BLOCKED: protected file drift: ${relative}`);
  const expectGitMiss = async (args, label) => {
    try {
      await spawnChecked('git', args, repositoryRoot, dependencies, 30000);
    } catch (error) {
      if (/exited 1|exited 128/u.test(error.message)) return;
      throw error;
    }
    throw new Error(`BLOCKED: unexpected tracked WebM at ${label}.`);
  };
  const absence = buildWebmAbsenceGates(repositoryRoot, implementationBaseline);
  for (const args of absence.gitChecks) await expectGitMiss(args, args.join(' '));
  for (const target of absence.worktreeWebmTargets) {
    if (await dependencies.exists(target))
      throw new Error(`BLOCKED: WebM target exists in worktree: ${path.relative(repositoryRoot, target)}`);
  }
  for (const target of absence.temporarySiblings)
    if (await dependencies.exists(target)) throw new Error(`BLOCKED: stale promotion sibling: ${target}`);
}

async function sha256File(target, dependencies) {
  if (dependencies.hashFile) return await dependencies.hashFile(target);
  return createHash('sha256')
    .update(await dependencies.readFile(target))
    .digest('hex');
}

export function validateSourceInventory(sources) {
  if (JSON.stringify(sources) !== JSON.stringify(HERO_VIDEO_SOURCES))
    throw new Error('Source inventory identity mismatch.');
}

export async function verifyImmutableSources(repositoryRoot, dependencies = defaultDependencies()) {
  validateSourceInventory(HERO_VIDEO_SOURCES);
  if (HERO_VIDEO_SOURCES.reduce((sum, source) => sum + source.bytes, 0) !== 103076167)
    throw new Error('Immutable source byte total mismatch.');
  for (const source of HERO_VIDEO_SOURCES) {
    const target = resolveForFilesystem(repositoryRoot, source.sourcePath);
    await assertContainedRegularFile(resolveForFilesystem(repositoryRoot, 'public/assets/hero'), target, dependencies);
    const stat = await dependencies.stat(target);
    if (stat.size !== source.bytes || (await sha256File(target, dependencies)) !== source.sha256) {
      throw new Error(`Immutable source drift: ${source.sourcePath}`);
    }
  }
}

export function computeAggregateReduction(webmBytes) {
  if (!Number.isSafeInteger(webmBytes) || webmBytes < 1) throw new Error('Aggregate WebM bytes are invalid.');
  const originalBytes = 103076167;
  const reductionBytes = originalBytes - webmBytes;
  return {
    originalBytes,
    webmBytes,
    reductionBytes,
    reductionPercent: (reductionBytes * 100) / originalBytes,
    passed: reductionBytes * 10000 >= originalBytes * 4000,
  };
}

export async function writeJsonAtomic(ownedRunRoot, target, value, dependencies) {
  value.filesystemReceipts = [...(dependencies.audit ?? value.filesystemReceipts ?? [])];
  const temporary = `${target}.partial`;
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await assertContainedNewPath(ownedRunRoot, target, dependencies);
  await assertContainedNewPath(ownedRunRoot, temporary, dependencies);
  let temporaryCreated = false;
  try {
    await dependencies.writeFile(temporary, bytes, { flag: 'wx' });
    temporaryCreated = true;
    const file = await dependencies.open(temporary, 'r+');
    await file.sync();
    await file.close();
    await dependencies.rename(temporary, target);
    if (dependencies.platform !== 'win32') {
      const directory = await dependencies.open(path.dirname(target), 'r');
      await directory.sync();
      await directory.close();
    }
  } catch (error) {
    if (!temporaryCreated) throw error;
    try {
      await assertContainedNewPath(ownedRunRoot, temporary, dependencies);
      await dependencies.unlink(temporary);
    } catch (cleanupError) {
      Object.assign(error, { atomicCleanupFailed: true, atomicCleanupError: cleanupError.message });
    }
    throw error;
  }
}

async function characterize(repositoryRoot, paths, parsed, dependencies) {
  const expectedDirectories = [
    paths.evidenceRoot,
    path.dirname(paths.runRoot),
    paths.runRoot,
    paths.candidates,
    paths.passlogs,
    paths.probes,
    paths.metrics,
    paths.browser,
    paths.backups,
  ];
  for (const directoryPath of expectedDirectories) {
    try {
      await dependencies.mkdir(directoryPath, { recursive: false });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const stat = await dependencies.lstat(directoryPath);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Rollout directory must be a non-link directory.');
  }
  await verifyImmutableSources(repositoryRoot, dependencies);
  const manifest = {
    schemaVersion: 1,
    runId: parsed.runId,
    implementationBaseline: parsed.implementationBaseline,
    pilotHarnessCommit: '7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe',
    status: 'CHARACTERIZED',
    productionState: 'UNCHANGED',
    immutableSources: HERO_VIDEO_SOURCES,
    backupSources: [],
    candidates: [],
    aggregate: null,
    production: [],
    promotionAttempt: null,
    failure: null,
    receipts: [],
    filesystemReceipts: [],
  };
  for (const source of HERO_VIDEO_SOURCES) {
    const original = resolveForFilesystem(repositoryRoot, source.sourcePath);
    const backup = resolveForFilesystem(paths.backups, source.sourcePath);
    await dependencies.mkdir(path.dirname(backup), { recursive: true });
    await assertContainedNewPath(paths.runRoot, backup, dependencies);
    await dependencies.copyFile(original, backup, fsConstants.COPYFILE_EXCL);
    const stat = await dependencies.stat(backup);
    const sha256 = await sha256File(backup, dependencies);
    if (stat.size !== source.bytes || sha256 !== source.sha256)
      throw new Error(`Characterization backup mismatch: ${source.sourcePath}`);
    manifest.backupSources.push({
      sourcePath: source.sourcePath,
      backupPath: path.relative(paths.runRoot, backup),
      bytes: source.bytes,
      sha256,
    });
  }
  await writeJsonAtomic(paths.runRoot, paths.manifest, validateManifest(manifest), dependencies);
  return manifest;
}

export function buildCandidateInvocations(source, format, quality, paths) {
  const input = resolveForFilesystem(paths.repositoryRoot, source.sourcePath);
  const output = resolveForFilesystem(paths.candidates, `${source.id}.${format}`);
  const common = ['-y', '-i', input, '-map', '0:v:0', '-an', '-map_metadata', '-1', '-vf', 'fps=24,format=yuv420p'];
  if (format === 'webm') {
    if (![28, 24].includes(quality)) throw new Error('Invalid WebM quality.');
    const passlog = resolveForFilesystem(paths.passlogs, `${source.id}-webm-${quality}`);
    const codec = [
      '-c:v',
      'libvpx-vp9',
      '-crf',
      String(quality),
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
    ];
    const tail = ['-fps_mode', 'cfr', '-t', '6.041667'];
    return [
      {
        kind: 'encode-pass-1',
        executable: 'ffmpeg',
        args: [
          ...common,
          ...codec,
          '-pass',
          '1',
          '-passlogfile',
          passlog,
          ...tail,
          '-f',
          'null',
          process.platform === 'win32' ? 'NUL' : '/dev/null',
        ],
        passlogPath: passlog,
        candidatePath: output,
        sourcePath: input,
      },
      {
        kind: 'encode-pass-2',
        executable: 'ffmpeg',
        args: [...common, ...codec, '-pass', '2', '-passlogfile', passlog, ...tail, '-f', 'webm', output],
        passlogPath: passlog,
        candidatePath: output,
        sourcePath: input,
      },
    ];
  }
  if (![20, 18].includes(quality)) throw new Error('Invalid MP4 quality.');
  return [
    {
      kind: 'encode',
      executable: 'ffmpeg',
      args: [
        ...common,
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
        output,
      ],
      candidatePath: output,
      sourcePath: input,
    },
  ];
}

export function buildProbeInvocation(candidatePath) {
  return {
    executable: 'ffprobe',
    args: [
      '-v',
      'error',
      '-count_packets',
      '-show_entries',
      'stream=index,codec_type,codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_packets:stream_disposition=attached_pic:stream_tags:format=duration:format_tags',
      '-of',
      'json',
      candidatePath,
    ],
  };
}

export function buildMetricInvocation(source, candidate, paths) {
  const candidatePath = resolveForFilesystem(paths.runRoot, candidate.candidatePath);
  const referencePath = resolveForFilesystem(paths.backups, source.sourcePath);
  const reportPath = path.resolve(paths.metrics, `${source.id}-${candidate.format}-${candidate.quality}.json`);
  const reportName = path.basename(reportPath);
  return {
    kind: 'vmaf',
    executable: 'ffmpeg',
    candidatePath,
    sourcePath: referencePath,
    reportPath,
    cwd: paths.metrics,
    args: [
      '-v',
      'error',
      '-i',
      candidatePath,
      '-i',
      referencePath,
      '-lavfi',
      `[0:v][1:v]libvmaf=log_fmt=json:log_path=${reportName}`,
      '-f',
      'null',
      process.platform === 'win32' ? 'NUL' : '/dev/null',
    ],
  };
}

export function buildPromotedMetricInvocation(source, production, paths) {
  const candidatePath = resolveForFilesystem(paths.repositoryRoot, production.path);
  const referencePath = resolveForFilesystem(paths.backups, source.sourcePath);
  const reportPath = path.resolve(paths.metrics, `${source.id}-${production.format}-post-promotion.json`);
  const reportName = path.basename(reportPath);
  return {
    kind: 'post-promotion-vmaf',
    executable: 'ffmpeg',
    candidatePath,
    sourcePath: referencePath,
    reportPath,
    cwd: paths.metrics,
    args: [
      '-v',
      'error',
      '-i',
      candidatePath,
      '-i',
      referencePath,
      '-lavfi',
      `[0:v][1:v]libvmaf=log_fmt=json:log_path=${reportName}`,
      '-f',
      'null',
      process.platform === 'win32' ? 'NUL' : '/dev/null',
    ],
  };
}

export function parseProbe(raw, format) {
  const parsed = JSON.parse(raw);
  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const videos = streams.filter((stream) => stream.codec_type === 'video');
  const audios = streams.filter((stream) => stream.codec_type === 'audio');
  if (videos.length !== 1) throw new Error('Candidate must contain exactly one video stream.');
  const video = videos[0];
  const streamTags = Object.fromEntries(
    Object.entries(video.tags ?? {}).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
  const formatTags = Object.fromEntries(
    Object.entries(parsed.format?.tags ?? {}).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
  const permittedStream = new Set(PERMITTED_STREAM_TAGS[format].map((tag) => tag.toLowerCase()));
  const permittedFormat = new Set(PERMITTED_FORMAT_TAGS[format].map((tag) => tag.toLowerCase()));
  for (const key of Object.keys(streamTags)) {
    if (FORBIDDEN_INHERITED_TAGS.includes(key) || !permittedStream.has(key))
      throw new Error(`Forbidden stream metadata tag: ${key}`);
  }
  for (const key of Object.keys(formatTags)) {
    if (FORBIDDEN_INHERITED_TAGS.includes(key) || !permittedFormat.has(key))
      throw new Error(`Forbidden format metadata tag: ${key}`);
  }
  return {
    codecName: String(video.codec_name),
    width: Number(video.width),
    height: Number(video.height),
    pixelFormat: String(video.pix_fmt),
    rFrameRate: String(video.r_frame_rate),
    avgFrameRate: String(video.avg_frame_rate),
    packets: Number(video.nb_read_packets),
    durationSeconds: Number(parsed.format?.duration),
    videoStreams: videos.length,
    audioStreams: audios.length,
    attachedPictures: videos.filter((stream) => Number(stream.disposition?.attached_pic) === 1).length,
    streamTags,
    formatTags,
  };
}

const VP9_RETRY_GATES = new Set([
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
]);
const H264_RETRY_GATES = new Set([...VP9_RETRY_GATES, 'size', 'playback']);
const BLOCKED_GATES = new Set([
  'immutableSource',
  'toolchain',
  'process',
  'containment',
  'receiptIdentity',
  'promotionBoundary',
]);

class AttemptFailure extends Error {
  constructor(gate, message, cause) {
    super(message, { cause });
    this.gate = gate;
  }
}

function classifyAttemptError(error, stage) {
  if (error instanceof AttemptFailure) return error.gate;
  if (stage === 'metadata') return 'metadata';
  if (stage === 'vmaf-report') return 'vmaf';
  if (stage === 'playback') return 'playback';
  return 'process';
}

export function nextQuality(format, attemptedQuality, assessment) {
  if (assessment.failedGates.some((gate) => BLOCKED_GATES.has(gate))) return null;
  if (format === 'webm' && attemptedQuality === 28 && assessment.failedGates.every((gate) => VP9_RETRY_GATES.has(gate)))
    return 24;
  if (format === 'mp4' && attemptedQuality === 20 && assessment.failedGates.every((gate) => H264_RETRY_GATES.has(gate)))
    return 18;
  return null;
}

export function classifyFailure(format, attemptedQuality, failedGates) {
  if (failedGates.some((gate) => BLOCKED_GATES.has(gate))) return 'BLOCKED';
  const retry = nextQuality(format, attemptedQuality, { accepted: false, failedGates, classification: 'NO_CHANGE' });
  return retry === null ? 'NO_CHANGE' : 'RETRY';
}

export function assessCandidate(source, candidate) {
  const probe = candidate.probe;
  const expectedCodec = candidate.format === 'webm' ? 'vp9' : 'h264';
  const failedGates = [];
  if (probe.codecName !== expectedCodec) failedGates.push('codec');
  if (probe.width !== source.width || probe.height !== source.height) failedGates.push('dimensions');
  if (probe.pixelFormat !== 'yuv420p') failedGates.push('pixelFormat');
  if (probe.rFrameRate !== '24/1') failedGates.push('rFrameRate');
  if (probe.avgFrameRate !== '24/1') failedGates.push('avgFrameRate');
  if (probe.packets !== 145) failedGates.push('packets');
  if (Math.abs(probe.durationSeconds - 6.041667) > 0.001) failedGates.push('duration');
  if (probe.videoStreams !== 1) failedGates.push('videoStreams');
  if (probe.audioStreams !== 0) failedGates.push('audioStreams');
  if (probe.attachedPictures !== 0) failedGates.push('attachedPictures');
  if (
    [...Object.keys(probe.streamTags), ...Object.keys(probe.formatTags)].some((key) =>
      FORBIDDEN_INHERITED_TAGS.includes(key.toLowerCase()),
    )
  )
    failedGates.push('metadata');
  if (candidate.vmaf < 95) failedGates.push('vmaf');
  if (candidate.bytes >= source.bytes) failedGates.push('size');
  const expectedPlaybackEvents = ['loadeddata', 'playing', 'ended'];
  let loopbackCandidate = false;
  try {
    const url = new URL(candidate.playback.url);
    loopbackCandidate =
      url.protocol === 'http:' &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost') &&
      url.pathname === '/candidate';
  } catch {
    loopbackCandidate = false;
  }
  if (
    !candidate.playback.loadeddata ||
    !candidate.playback.playing ||
    !candidate.playback.ended ||
    candidate.playback.error !== null ||
    JSON.stringify(candidate.playback.events) !== JSON.stringify(expectedPlaybackEvents) ||
    !loopbackCandidate ||
    typeof candidate.playback.browserVersion !== 'string' ||
    !candidate.playback.browserVersion.startsWith('148.0.7778.')
  )
    failedGates.push('playback');
  return {
    accepted: failedGates.length === 0,
    failedGates,
    classification:
      failedGates.length === 0 ? 'PASS' : classifyFailure(candidate.format, candidate.quality, failedGates),
  };
}

async function playCandidate(candidatePath, format, timeoutMs = 30000) {
  const bytes = await fsp.readFile(candidatePath);
  const route = '/candidate';
  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' || new URL(request.url, 'http://127.0.0.1').pathname !== route) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': format === 'webm' ? 'video/webm' : 'video/mp4',
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store',
    });
    response.end(bytes);
  });
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const address = server.address();
  if (typeof address === 'string' || address === null) throw new Error('Loopback address is invalid.');
  const browser = await chromium.launch({ timeout: timeoutMs });
  const page = await browser.newPage();
  page.setDefaultTimeout(timeoutMs);
  const url = `http://127.0.0.1:${address.port}${route}`;
  try {
    const evidence = await page.evaluate(
      async ({ url }) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        const events = [];
        return await new Promise((resolve, reject) => {
          for (const name of ['loadeddata', 'playing', 'ended']) video.addEventListener(name, () => events.push(name));
          video.addEventListener('error', () => reject(new Error(`media-error-${video.error?.code ?? 0}`)), {
            once: true,
          });
          video.addEventListener(
            'ended',
            () =>
              resolve({
                loadeddata: events.includes('loadeddata'),
                playing: events.includes('playing'),
                ended: true,
                error: null,
                events,
                url,
              }),
            { once: true },
          );
          video.src = url;
          document.body.append(video);
          video.play().catch(reject);
          setTimeout(() => reject(Object.assign(new Error('browser playback timeout'), { gate: 'playback' })), 30000);
        });
      },
      { url },
    );
    return { ...evidence, browserVersion: browser.version() };
  } finally {
    await Promise.allSettled([page.close(), browser.close()]);
    await Promise.race([
      new Promise((resolve) => server.close(resolve)),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  }
}

async function removeRetryArtifacts(source, format, quality, paths, dependencies) {
  const exact = [resolveForFilesystem(paths.candidates, `${source.id}.${format}`)];
  if (format === 'webm')
    exact.push(
      resolveForFilesystem(paths.passlogs, `${source.id}-webm-${quality}-0.log`),
      resolveForFilesystem(paths.passlogs, `${source.id}-webm-${quality}-0.log.mbtree`),
    );
  for (const target of exact) {
    await assertContainedNewPath(paths.runRoot, target, dependencies);
    try {
      await dependencies.unlink(target);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return exact;
}

export async function runCandidateBatch(context) {
  const { dependencies, manifest, paths } = context;
  try {
    if (dependencies.verifyImmutableSources) await dependencies.verifyImmutableSources(context.repositoryRoot);
    else await verifyImmutableSources(context.repositoryRoot, dependencies);
  } catch (error) {
    manifest.status = 'BLOCKED';
    manifest.productionState = 'UNCHANGED';
    manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['immutableSource'],
      reason: `BLOCKED:immutableSource:${error.message}`,
    };
    return manifest;
  }
  const preflightFailure = dependencies.preflight ? await dependencies.preflight() : null;
  if (preflightFailure) {
    return await finishFailure(manifest, 'BLOCKED', null, null, null, [preflightFailure], paths, dependencies);
  }
  manifest.status = 'GENERATING';
  await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
  for (const source of HERO_VIDEO_SOURCES) {
    for (const format of ['webm', 'mp4']) {
      let quality = format === 'webm' ? 28 : 20;
      let attempt = 1;
      for (;;) {
        let candidate;
        let assessment;
        try {
          candidate = context.dependencies.encodeProbeMetricAndPlay
            ? await context.dependencies.encodeProbeMetricAndPlay(source, format, quality, attempt, context)
            : await encodeProbeMetricAndPlay(source, format, quality, attempt, context);
          assessment = context.dependencies.assessCandidate
            ? await context.dependencies.assessCandidate(source, candidate)
            : assessCandidate(source, candidate);
        } catch (error) {
          const gate = classifyAttemptError(error, error.stage ?? 'process');
          assessment = {
            accepted: false,
            failedGates: [gate],
            classification: classifyFailure(format, quality, [gate]),
          };
          context.manifest.receipts.push({
            sequence: context.manifest.receipts.length + 1,
            kind: 'attempt-failure',
            sourceId: source.id,
            format,
            quality,
            attempt,
            candidateSha256: null,
            status: 'FAILED',
            executable: null,
            args: [],
            exitCode: 1,
            artifactPath: null,
            artifactSha256: null,
          });
        }
        if (assessment.accepted) {
          manifest.candidates.push(candidate);
          break;
        }
        const classification = classifyFailure(format, quality, assessment.failedGates);
        if (classification === 'BLOCKED')
          return await finishFailure(
            manifest,
            'BLOCKED',
            source,
            format,
            quality,
            assessment.failedGates,
            paths,
            dependencies,
          );
        const retryQuality = nextQuality(format, quality, assessment);
        await removeRetryArtifacts(source, format, quality, paths, dependencies);
        if (classification === 'NO_CHANGE' || retryQuality === null)
          return await finishFailure(
            manifest,
            'NO_CHANGE',
            source,
            format,
            quality,
            assessment.failedGates,
            paths,
            dependencies,
          );
        quality = retryQuality;
        attempt += 1;
      }
    }
  }
  const webmBytes = manifest.candidates
    .filter((candidate) => candidate.format === 'webm')
    .reduce((sum, candidate) => sum + candidate.bytes, 0);
  manifest.aggregate = computeAggregateReduction(webmBytes);
  if (!manifest.aggregate.passed)
    return await finishFailure(manifest, 'NO_CHANGE', null, null, null, ['aggregate'], paths, dependencies);
  assertFinalReceiptCoverage(manifest);
  manifest.status = 'VALIDATED';
  await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
  return manifest;
}

export async function promoteValidatedBatch(context) {
  const { dependencies, manifest, paths, repositoryRoot } = context;
  try {
    if (manifest.status !== 'VALIDATED' || manifest.candidates.length !== 32)
      throw new Error('Validated candidate coverage must equal 32.');
    assertFinalReceiptCoverage(manifest);
    if (dependencies.verifyImmutableSources) await dependencies.verifyImmutableSources(repositoryRoot);
    else await verifyImmutableSources(repositoryRoot, dependencies);
    await assertProductionBoundaryVacant(context);
    await verifyBackupsAgainstOriginalLiterals(context);
    if (dependencies.assertPreMutationSnapshot) await dependencies.assertPreMutationSnapshot(context);
    else await assertPreMutationSnapshot(context);
    await stageAndRenameExactProductionAllowlist(context);
    await verifyPromotedProductionHashes(context);
    manifest.status = 'PROMOTED';
    manifest.productionState = 'VERIFIED';
    await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
    return manifest;
  } catch (error) {
    let rollbackReason = error.message;
    let rollbackVerified = false;
    if (manifest.promotionAttempt?.mutationStarted) {
      try {
        await rollbackFromImmutableBackups(context);
        await verifyBackupsAgainstOriginalLiterals(context);
        rollbackVerified = true;
      } catch (rollbackError) {
        rollbackReason = `${error.message}; rollback failed: ${rollbackError.message}`;
      }
    }
    if (rollbackVerified) {
      transitionStatus(manifest, 'NO_CHANGE');
      manifest.productionState = 'ROLLED_BACK';
      manifest.production = [];
    } else if (manifest.promotionAttempt?.mutationStarted) {
      if (manifest.status !== 'BLOCKED') transitionStatus(manifest, 'BLOCKED');
      manifest.productionState = 'UNKNOWN';
    } else {
      if (manifest.status !== 'BLOCKED') transitionStatus(manifest, 'BLOCKED');
      manifest.productionState = 'UNCHANGED';
    }
    manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['promotionBoundary'],
      reason: rollbackReason,
    };
    try {
      await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
      return manifest;
    } catch (durableError) {
      manifest.status = 'BLOCKED';
      manifest.productionState = 'UNKNOWN';
      if (manifest.production.length === 0 && manifest.promotionAttempt?.mutationStarted) {
        manifest.production = manifest.candidates.map((candidate) => ({
          path: `public/assets/hero/${candidate.sourceId}.${candidate.format}`,
          bytes: candidate.bytes,
          sha256: candidate.sha256,
          format: candidate.format,
        }));
      }
      manifest.failure.reason = `${rollbackReason}; durable manifest write failed: ${durableError.message}`;
      return manifest;
    }
  }
}

async function assertProductionBoundaryVacant(context) {
  for (const relative of WEBM_PROMOTION_ALLOWLIST) {
    if (await context.dependencies.exists(resolveForFilesystem(context.repositoryRoot, relative)))
      throw new AttemptFailure('promotionBoundary', `WebM target already exists: ${relative}`);
  }
  for (const relative of [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST]) {
    for (const suffix of ['.phase-6c-rollout.tmp', '.phase-6c-rollback.tmp']) {
      if (await context.dependencies.exists(`${resolveForFilesystem(context.repositoryRoot, relative)}${suffix}`))
        throw new AttemptFailure('promotionBoundary', `Temporary sibling already exists: ${relative}${suffix}`);
    }
  }
}

async function assertPreMutationSnapshot(context) {
  const status = await spawnChecked(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    context.repositoryRoot,
    context.dependencies,
    30000,
  );
  const expectedStatus = [
    '?? docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
    '?? docs/superpowers/plans/phase-2-task-3-execution.md',
  ].sort();
  const actualStatus = status.stdout.trim().split(/\r?\n/u).filter(Boolean).sort();
  if (JSON.stringify(actualStatus) !== JSON.stringify(expectedStatus))
    throw new AttemptFailure('promotionBoundary', 'Pre-mutation workspace set mismatch.');
  for (const [relative, expectedHash] of [
    [
      'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
      'fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9',
    ],
    [
      'docs/superpowers/plans/phase-2-task-3-execution.md',
      'f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2',
    ],
  ])
    if (
      (await sha256File(resolveForFilesystem(context.repositoryRoot, relative), context.dependencies)) !== expectedHash
    )
      throw new AttemptFailure('promotionBoundary', `Pre-mutation protected hash mismatch: ${relative}`);
  const index = await spawnChecked(
    'git',
    ['diff', '--cached', '--name-only'],
    context.repositoryRoot,
    context.dependencies,
    30000,
  );
  if (index.stdout.trim() !== '') throw new AttemptFailure('promotionBoundary', 'Pre-mutation index is not empty.');
  const expectedCandidates = context.manifest.candidates
    .map(({ candidatePath }) => path.basename(candidatePath))
    .sort();
  const actualCandidates = (await context.dependencies.readdir(context.paths.candidates)).sort();
  if (expectedCandidates.length !== 32 || JSON.stringify(actualCandidates) !== JSON.stringify(expectedCandidates))
    throw new AttemptFailure('promotionBoundary', 'Candidate directory set mismatch.');
  for (const candidate of context.manifest.candidates) {
    const target = resolveForFilesystem(context.paths.runRoot, candidate.candidatePath);
    await assertContainedRegularFile(context.paths.runRoot, target, context.dependencies);
    const stat = await context.dependencies.stat(target);
    if (stat.size !== candidate.bytes || (await sha256File(target, context.dependencies)) !== candidate.sha256)
      throw new AttemptFailure('promotionBoundary', `Candidate snapshot identity mismatch: ${candidate.candidatePath}`);
  }
}

async function recordInvocation(invocation, identity, context) {
  const result = await spawnChecked(
    invocation.executable,
    invocation.args,
    invocation.cwd ?? context.repositoryRoot,
    context.dependencies,
    timeoutForInvocation(invocation),
  );
  context.manifest.receipts.push({
    sequence: context.manifest.receipts.length + 1,
    kind: invocation.kind,
    sourceId: identity.sourceId,
    format: identity.format,
    quality: identity.quality,
    attempt: identity.attempt,
    candidateSha256: identity.candidateSha256,
    status: 'SUCCEEDED',
    executable: invocation.executable,
    args: invocation.args,
    exitCode: result.exitCode,
    artifactPath: invocation.candidatePath ? path.relative(context.paths.runRoot, invocation.candidatePath) : null,
    artifactSha256:
      invocation.candidatePath && (await context.dependencies.exists(invocation.candidatePath))
        ? await sha256File(invocation.candidatePath, context.dependencies)
        : null,
  });
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return result;
}

async function encodeProbeMetricAndPlay(source, format, quality, attempt, context) {
  const identity = { sourceId: source.id, format, quality, attempt, candidateSha256: null };
  const encode = buildCandidateInvocations(source, format, quality, context.paths);
  try {
    for (const invocation of encode) await recordInvocation(invocation, identity, context);
  } catch (error) {
    throw new AttemptFailure('process', `encode failed: ${error.message}`, error);
  }
  const candidatePath = encode.at(-1).candidatePath;
  await assertContainedRegularFile(context.paths.runRoot, candidatePath, context.dependencies);
  const stat = await context.dependencies.stat(candidatePath);
  const probeInvocation = { kind: 'probe', ...buildProbeInvocation(candidatePath), candidatePath };
  let probeResult;
  try {
    probeResult = await recordInvocation(probeInvocation, identity, context);
  } catch (error) {
    throw new AttemptFailure('process', `probe failed: ${error.message}`, error);
  }
  let probe;
  try {
    probe = parseProbe(probeResult.stdout, format);
  } catch (error) {
    throw new AttemptFailure('metadata', `probe metadata invalid: ${error.message}`, error);
  }
  const preliminary = {
    sourceId: source.id,
    format,
    quality,
    attempt,
    candidatePath: path.relative(context.paths.runRoot, candidatePath),
    bytes: stat.size,
    sha256: await sha256File(candidatePath, context.dependencies),
    probe,
    vmaf: 0,
    playback: { loadeddata: false, playing: false, ended: false, error: null, events: [], url: '', browserVersion: '' },
  };
  const metric = buildMetricInvocation(source, preliminary, context.paths);
  try {
    await recordInvocation(metric, identity, context);
  } catch (error) {
    throw new AttemptFailure('process', `VMAF process failed: ${error.message}`, error);
  }
  let vmaf;
  try {
    const metricReport = JSON.parse((await context.dependencies.readFile(metric.reportPath)).toString('utf8'));
    vmaf = Number(metricReport.pooled_metrics?.vmaf?.mean);
    if (!Number.isFinite(vmaf)) throw new Error('VMAF mean is absent.');
  } catch (error) {
    throw new AttemptFailure('vmaf', `VMAF report invalid: ${error.message}`, error);
  }
  let playback;
  try {
    playback = await context.dependencies.playCandidate(candidatePath, format, 30000);
  } catch (error) {
    throw new AttemptFailure('playback', `playback failed: ${error.message}`, error);
  }
  const candidate = { ...preliminary, vmaf, playback };
  context.manifest.receipts.push({
    sequence: context.manifest.receipts.length + 1,
    kind: 'browser-playback',
    sourceId: source.id,
    format,
    quality,
    attempt,
    candidateSha256: candidate.sha256,
    status: 'SUCCEEDED',
    executable: null,
    args: [candidatePath],
    exitCode: playback.error === null ? 0 : 1,
    artifactPath: candidate.candidatePath,
    artifactSha256: candidate.sha256,
  });
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return candidate;
}

export function assertFinalReceiptCoverage(manifest) {
  if (manifest.candidates.length !== 32)
    throw new AttemptFailure('receiptIdentity', 'Final candidate count is not 32.');
  const finalReceipts = [];
  for (const candidate of manifest.candidates) {
    const matches = manifest.receipts.filter(
      (receipt) =>
        receipt.kind === 'browser-playback' &&
        receipt.status === 'SUCCEEDED' &&
        receipt.sourceId === candidate.sourceId &&
        receipt.format === candidate.format &&
        receipt.quality === candidate.quality &&
        receipt.attempt === candidate.attempt &&
        receipt.candidateSha256 === candidate.sha256 &&
        receipt.artifactSha256 === candidate.sha256,
    );
    if (matches.length !== 1)
      throw new AttemptFailure('receiptIdentity', `Final receipt mismatch: ${candidate.sourceId}.${candidate.format}`);
    finalReceipts.push(matches[0]);
  }
  return finalReceipts;
}

async function finishFailure(manifest, status, source, format, quality, failedGates, paths, dependencies) {
  manifest.status = status;
  manifest.failure = {
    sourceId: source?.id ?? null,
    format,
    quality,
    failedGates,
    reason: `${status}:${source?.id ?? 'aggregate'}:${format ?? 'all'}:${failedGates.join(',')}`,
  };
  await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
  return manifest;
}

async function stageAndRenameExactProductionAllowlist(context) {
  const byTarget = new Map();
  for (const candidate of context.manifest.candidates) {
    const extension = candidate.format === 'webm' ? '.webm' : '.mp4';
    const targetRelative = `public/assets/hero/${candidate.sourceId}${extension}`;
    byTarget.set(targetRelative, candidate);
  }
  const orderedTargets = [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST];
  if (orderedTargets.some((target) => !byTarget.has(target)) || byTarget.size !== 32) {
    throw new Error('Promotion candidate identity mismatch.');
  }
  const staged = [];
  context.manifest.promotionAttempt = {
    id: `${context.runId}-promotion-1`,
    mutationStarted: false,
    entries: [],
  };
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  for (const targetRelative of orderedTargets) {
    const candidate = byTarget.get(targetRelative);
    const source = resolveForFilesystem(context.paths.runRoot, candidate.candidatePath);
    const target = resolveForFilesystem(context.repositoryRoot, targetRelative);
    const temporary = `${target}.phase-6c-rollout.tmp`;
    const original = HERO_VIDEO_SOURCES.find(({ sourcePath }) => sourcePath === targetRelative);
    const intent = {
      targetRelative,
      temporaryRelative: `${targetRelative}.phase-6c-rollout.tmp`,
      format: candidate.format,
      candidateSha256: candidate.sha256,
      originalSha256: original?.sha256 ?? null,
      state: 'INTENT',
    };
    context.manifest.promotionAttempt.entries.push(intent);
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
    await assertContainedNewPath(
      resolveForFilesystem(context.repositoryRoot, 'public/assets/hero'),
      temporary,
      context.dependencies,
    );
    context.manifest.promotionAttempt.mutationStarted = true;
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
    await context.dependencies.copyFile(source, temporary, fsConstants.COPYFILE_EXCL);
    const file = await context.dependencies.open(temporary, 'r+');
    await file.sync();
    await file.close();
    if ((await sha256File(temporary, context.dependencies)) !== candidate.sha256)
      throw new Error('Staged candidate hash mismatch.');
    staged.push({ targetRelative, target, temporary, candidate });
  }
  for (const item of staged) {
    await context.dependencies.rename(item.temporary, item.target);
    const intent = context.manifest.promotionAttempt.entries.find(
      ({ targetRelative }) => targetRelative === item.targetRelative,
    );
    intent.state = 'COMPLETED';
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  }
  if (context.dependencies.platform !== 'win32') {
    const directory = await context.dependencies.open(
      resolveForFilesystem(context.repositoryRoot, 'public/assets/hero'),
      'r',
    );
    await directory.sync();
    await directory.close();
  }
  context.manifest.production = staged.map(({ targetRelative, candidate }) => ({
    path: targetRelative,
    bytes: candidate.bytes,
    sha256: candidate.sha256,
    format: candidate.format,
  }));
}

async function verifyPromotedProductionHashes(context) {
  if (context.manifest.production.length !== 32) throw new Error('Production manifest coverage must equal 32.');
  for (const item of context.manifest.production) {
    const target = resolveForFilesystem(context.repositoryRoot, item.path);
    await assertContainedRegularFile(
      resolveForFilesystem(context.repositoryRoot, 'public/assets/hero'),
      target,
      context.dependencies,
    );
    const stat = await context.dependencies.stat(target);
    if (stat.size !== item.bytes || (await sha256File(target, context.dependencies)) !== item.sha256) {
      throw new Error(`Promoted production identity mismatch: ${item.path}`);
    }
  }
}

async function verifyBackupsAgainstOriginalLiterals(context) {
  if (context.manifest.backupSources.length !== 16) throw new Error('Backup coverage must equal 16.');
  for (const source of HERO_VIDEO_SOURCES) {
    const receipt = context.manifest.backupSources.find((item) => item.sourcePath === source.sourcePath);
    if (!receipt || receipt.bytes !== source.bytes || receipt.sha256 !== source.sha256)
      throw new Error('Backup receipt identity mismatch.');
    const backup = resolveForFilesystem(context.paths.runRoot, receipt.backupPath);
    await assertContainedRegularFile(context.paths.runRoot, backup, context.dependencies);
    const stat = await context.dependencies.stat(backup);
    if (stat.size !== source.bytes || (await sha256File(backup, context.dependencies)) !== source.sha256) {
      throw new Error(`Backup source drift: ${source.sourcePath}`);
    }
  }
}

async function rollbackFromImmutableBackups(context) {
  await verifyBackupsAgainstOriginalLiterals(context);
  for (const source of HERO_VIDEO_SOURCES) {
    const receipt = context.manifest.backupSources.find((item) => item.sourcePath === source.sourcePath);
    const backup = resolveForFilesystem(context.paths.runRoot, receipt.backupPath);
    const target = resolveForFilesystem(context.repositoryRoot, source.sourcePath);
    const temporary = `${target}.phase-6c-rollback.tmp`;
    await context.dependencies.copyFile(backup, temporary, fsConstants.COPYFILE_EXCL);
    if ((await sha256File(temporary, context.dependencies)) !== source.sha256)
      throw new Error('Rollback temporary hash mismatch.');
    await context.dependencies.rename(temporary, target);
  }
  const attemptedWebms = (context.manifest.promotionAttempt?.entries ?? []).filter(({ format }) => format === 'webm');
  if (attemptedWebms.some(({ targetRelative }) => !WEBM_PROMOTION_ALLOWLIST.includes(targetRelative)))
    throw new Error('Rollback WebM receipt escapes allowlist.');
  for (const entry of attemptedWebms) {
    const target = resolveForFilesystem(context.repositoryRoot, entry.targetRelative);
    if (!(await context.dependencies.exists(target))) continue;
    if ((await sha256File(target, context.dependencies)) !== entry.candidateSha256)
      throw new Error(`Rollback refuses unowned WebM identity: ${entry.targetRelative}`);
    await context.dependencies.unlink(target);
  }
  for (const entry of context.manifest.promotionAttempt?.entries ?? []) {
    for (const relative of [entry.temporaryRelative, `${entry.targetRelative}.phase-6c-rollback.tmp`]) {
      const target = resolveForFilesystem(context.repositoryRoot, relative);
      try {
        await context.dependencies.unlink(target);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  await verifyBackupsAgainstOriginalLiterals(context);
  for (const source of HERO_VIDEO_SOURCES) {
    const target = resolveForFilesystem(context.repositoryRoot, source.sourcePath);
    if ((await sha256File(target, context.dependencies)) !== source.sha256)
      throw new Error('Rollback production hash mismatch.');
  }
  for (const relative of WEBM_PROMOTION_ALLOWLIST) {
    if (await context.dependencies.exists(resolveForFilesystem(context.repositoryRoot, relative)))
      throw new Error(`Rollback WebM remains present: ${relative}`);
  }
}

export async function recoverInterruptedPromotion(context) {
  const attempt = context.manifest.promotionAttempt;
  if (!attempt?.mutationStarted || context.manifest.status === 'PROMOTED') return context.manifest;
  const allowed = new Set([...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST]);
  const targets = attempt.entries.map(({ targetRelative }) => targetRelative);
  const valid =
    attempt.entries.length >= 1 &&
    attempt.entries.length <= 32 &&
    new Set(targets).size === targets.length &&
    attempt.entries.every((entry) => {
      const source = HERO_VIDEO_SOURCES.find(
        ({ id }) => entry.targetRelative === `public/assets/hero/${id}.${entry.format}`,
      );
      const candidate = context.manifest.candidates.find(
        ({ sourceId, format, sha256 }) =>
          sourceId === source?.id && format === entry.format && sha256 === entry.candidateSha256,
      );
      return (
        allowed.has(entry.targetRelative) &&
        candidate &&
        entry.temporaryRelative === `${entry.targetRelative}.phase-6c-rollout.tmp` &&
        (entry.format === 'webm' ? entry.originalSha256 === null : entry.originalSha256 === source.sha256) &&
        ['INTENT', 'COMPLETED'].includes(entry.state)
      );
    });
  if (!valid) {
    context.manifest.status = 'BLOCKED';
    context.manifest.productionState = 'UNKNOWN';
    context.manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['receiptIdentity'],
      reason: 'BLOCKED: invalid crash-recovery intent ledger.',
    };
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
    return context.manifest;
  }
  try {
    await rollbackFromImmutableBackups(context);
    transitionStatus(context.manifest, 'NO_CHANGE');
    context.manifest.productionState = 'ROLLED_BACK';
    context.manifest.production = [];
    context.manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['promotionBoundary'],
      reason: `NO_CHANGE: recovered interrupted promotion ${attempt.id}.`,
    };
  } catch (error) {
    context.manifest.status = 'BLOCKED';
    context.manifest.productionState = 'UNKNOWN';
    context.manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['promotionBoundary'],
      reason: `BLOCKED: crash recovery failed: ${error.message}`,
    };
  }
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return context.manifest;
}

async function verifyPromotedTrackedIdentity(context) {
  if (context.manifest.status !== 'PROMOTED')
    throw new AttemptFailure('promotionBoundary', 'Command requires PROMOTED manifest.');
  const expected = [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST].sort();
  const actual = context.manifest.production.map(({ path: productionPath }) => productionPath).sort();
  if (context.manifest.production.length !== 32 || JSON.stringify(actual) !== JSON.stringify(expected))
    throw new AttemptFailure('promotionBoundary', 'Promoted manifest path identity mismatch.');
  for (const item of context.manifest.production) {
    await spawnChecked(
      'git',
      ['ls-files', '--error-unmatch', '--', item.path],
      context.repositoryRoot,
      context.dependencies,
      30000,
    );
    const pointer = await spawnChecked(
      'git',
      ['show', `:${item.path}`],
      context.repositoryRoot,
      context.dependencies,
      30000,
    );
    const expectedPointer = `version https://git-lfs.github.com/spec/v1\noid sha256:${item.sha256}\nsize ${item.bytes}`;
    if (pointer.stdout.trim() !== expectedPointer)
      throw new AttemptFailure('promotionBoundary', `Promoted index pointer mismatch: ${item.path}`);
    const target = resolveForFilesystem(context.repositoryRoot, item.path);
    const stat = await context.dependencies.stat(target);
    if (stat.size !== item.bytes || (await sha256File(target, context.dependencies)) !== item.sha256)
      throw new AttemptFailure('promotionBoundary', `Promoted worktree identity mismatch: ${item.path}`);
  }
}

export async function verifyProduction(context) {
  validateManifest(context.manifest);
  try {
    if (context.dependencies.verifyPromotedTrackedIdentity)
      await context.dependencies.verifyPromotedTrackedIdentity(context);
    else await verifyPromotedTrackedIdentity(context);
    await verifyPromotedProductionHashes(context);
    assertFinalReceiptCoverage(context.manifest);
    return context.manifest;
  } catch (error) {
    return await recoverPostPromotionFailure(context, 'NO_CHANGE', ['promotionBoundary'], error);
  }
}

export async function reportPromotedRollout(context) {
  validateManifest(context.manifest);
  try {
    if (context.dependencies.verifyPromotedTrackedIdentity)
      await context.dependencies.verifyPromotedTrackedIdentity(context);
    else await verifyPromotedTrackedIdentity(context);
    await verifyBackupsAgainstOriginalLiterals(context);
    await verifyPromotedProductionHashes(context);
    assertFinalReceiptCoverage(context.manifest);
    const refreshedVmaf = [];
    for (const candidate of context.manifest.candidates) {
      const source = HERO_VIDEO_SOURCES.find(({ id }) => id === candidate.sourceId);
      const production = context.manifest.production.find(
        ({ path: productionPath, format }) =>
          productionPath === `public/assets/hero/${candidate.sourceId}.${format}` && format === candidate.format,
      );
      if (!production)
        throw new Error(`Promoted candidate identity missing: ${candidate.sourceId}.${candidate.format}`);
      const invocation = buildPromotedMetricInvocation(source, production, context.paths);
      const result = await spawnChecked(
        invocation.executable,
        invocation.args,
        invocation.cwd,
        context.dependencies,
        120000,
      );
      if (result.exitCode !== 0) throw new Error('Post-promotion VMAF process failed.');
      const report = JSON.parse((await context.dependencies.readFile(invocation.reportPath)).toString('utf8'));
      const value = Number(report.pooled_metrics?.vmaf?.mean);
      if (!Number.isFinite(value) || value < 95)
        throw new Error(`Post-promotion VMAF failed: ${candidate.sourceId}.${candidate.format}`);
      refreshedVmaf.push({ sourceId: candidate.sourceId, format: candidate.format, value });
    }
    const playbackReceipts = assertFinalReceiptCoverage(context.manifest);
    if (playbackReceipts.length !== 32) throw new Error('Browser playback receipt coverage must equal 32.');
    const webmBytes = context.manifest.production
      .filter(({ format }) => format === 'webm')
      .reduce((sum, item) => sum + item.bytes, 0);
    const aggregate = computeAggregateReduction(webmBytes);
    if (!aggregate.passed) throw new Error('Post-promotion aggregate reduction failed.');
    return {
      status: 'ROLLOUT_READY_LOCAL',
      backups: 16,
      production: context.manifest.production.map(({ path: productionPath, bytes, sha256, format }) => ({
        path: productionPath,
        bytes,
        sha256,
        format,
      })),
      refreshedVmaf,
      playbackReceipts: 32,
      aggregate,
    };
  } catch (error) {
    return await recoverPostPromotionFailure(
      context,
      error.gate === 'process' ? 'BLOCKED' : 'NO_CHANGE',
      [error.gate ?? 'promotionBoundary'],
      error,
    );
  }
}

async function recoverPostPromotionFailure(context, _requestedStatus, failedGates, error) {
  let terminal = 'NO_CHANGE';
  let reason = `NO_CHANGE:post-promotion:${error.message}`;
  try {
    await rollbackFromImmutableBackups(context);
    await verifyBackupsAgainstOriginalLiterals(context);
    context.manifest.production = [];
    context.manifest.productionState = 'ROLLED_BACK';
  } catch (rollbackError) {
    terminal = 'BLOCKED';
    context.manifest.productionState = 'UNKNOWN';
    reason = `BLOCKED:post-promotion:${error.message}; rollback failed: ${rollbackError.message}`;
  }
  transitionStatus(context.manifest, terminal);
  context.manifest.failure = { sourceId: null, format: null, quality: null, failedGates, reason };
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return context.manifest;
}

function parseCli(argv) {
  const command = argv[0];
  if (!['characterize', 'run', 'recover', 'verify-production', 'report'].includes(command))
    throw new Error('Unknown rollout command.');
  const values = Object.create(null);
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--run-id', '--implementation-baseline'].includes(flag) || typeof value !== 'string')
      throw new Error('Invalid rollout CLI arguments.');
    if (values[flag] !== undefined) throw new Error('Duplicate rollout CLI flag.');
    values[flag] = value;
  }
  if (
    values['--run-id'] !== 'phase-6c-rollout-20260901-01' ||
    !/^[0-9a-f]{40}$/u.test(values['--implementation-baseline'])
  )
    throw new Error('Rollout CLI identity is invalid.');
  return { command, runId: values['--run-id'], implementationBaseline: values['--implementation-baseline'] };
}

export async function main(argv, injectedDependencies) {
  let output;
  let observedManifest = null;
  try {
    const parsed = parseCli(argv);
    const dependencies = { ...defaultDependencies(), ...(injectedDependencies ?? Object.create(null)) };
    const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const paths = resolveRolloutPaths(repositoryRoot, parsed.runId);
    if (parsed.command === 'characterize') {
      if (dependencies.preflight) {
        const failure = await dependencies.preflight(parsed.command, null);
        if (failure) throw new Error(failure);
      } else await preflightRollout(parsed.command, repositoryRoot, parsed.implementationBaseline, dependencies);
      if (dependencies.assertGenerationBoundary)
        await dependencies.assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline);
      else await assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline, dependencies);
      const manifest = dependencies.characterizeRollout
        ? await dependencies.characterizeRollout(repositoryRoot, paths, parsed, dependencies)
        : await characterize(repositoryRoot, paths, parsed, dependencies);
      output = {
        command: parsed.command,
        status: manifest.status,
        exitCode: 0,
        sources: 16,
        sourceBytes: 103076167,
        mp4Targets: 16,
        webmTargets: 16,
        productionState: 'UNCHANGED',
        production: [],
      };
    } else {
      const loadedManifest = dependencies.loadManifest
        ? await dependencies.loadManifest(paths)
        : JSON.parse((await dependencies.readFile(paths.manifest)).toString('utf8'));
      observedManifest = {
        productionState: ['UNCHANGED', 'VERIFIED', 'ROLLED_BACK', 'UNKNOWN'].includes(loadedManifest?.productionState)
          ? loadedManifest.productionState
          : 'UNKNOWN',
        production: Array.isArray(loadedManifest?.production) ? loadedManifest.production : null,
      };
      const manifest = validateManifest(loadedManifest);
      observedManifest = manifest;
      if (manifest.implementationBaseline !== parsed.implementationBaseline)
        throw new Error('CLI baseline differs from manifest.');
      const context = {
        repositoryRoot,
        runId: parsed.runId,
        implementationBaseline: parsed.implementationBaseline,
        paths,
        manifest,
        dependencies,
        filesystemReceipts: dependencies.audit ?? manifest.filesystemReceipts,
      };
      if (
        ['run', 'recover'].includes(parsed.command) &&
        manifest.promotionAttempt?.mutationStarted &&
        manifest.status !== 'PROMOTED'
      ) {
        if (dependencies.preflight) {
          const failure = await dependencies.preflight('recover', manifest);
          if (failure) throw new Error(failure);
        } else await preflightRollout('recover', repositoryRoot, parsed.implementationBaseline, dependencies);
        const recovered = dependencies.recoverInterruptedPromotion
          ? await dependencies.recoverInterruptedPromotion(context)
          : await recoverInterruptedPromotion(context);
        output = manifestResult(parsed.command, recovered);
      } else {
        if (dependencies.preflight) {
          const failure = await dependencies.preflight(parsed.command, manifest);
          if (failure) throw new Error(failure);
        } else await preflightRollout(parsed.command, repositoryRoot, parsed.implementationBaseline, dependencies);
        if (parsed.command === 'run') {
          if (dependencies.assertGenerationBoundary)
            await dependencies.assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline);
          else await assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline, dependencies);
        }
        if (parsed.command === 'recover') {
          if (manifest.status !== 'PROMOTED') throw new Error('Recover found no valid interrupted intent ledger.');
          output = manifestResult(parsed.command, manifest);
        } else if (parsed.command === 'run') {
          const generated = dependencies.runCandidateBatch
            ? await dependencies.runCandidateBatch(context)
            : await runCandidateBatch(context);
          const terminal =
            generated.status === 'VALIDATED'
              ? dependencies.promoteValidatedBatch
                ? await dependencies.promoteValidatedBatch({ ...context, manifest: generated })
                : await promoteValidatedBatch({ ...context, manifest: generated })
              : generated;
          output = manifestResult(parsed.command, terminal);
        } else if (parsed.command === 'verify-production')
          output = manifestResult(
            parsed.command,
            dependencies.verifyProduction
              ? await dependencies.verifyProduction(context)
              : await verifyProduction(context),
          );
        else {
          const report = dependencies.reportPromotedRollout
            ? await dependencies.reportPromotedRollout(context)
            : await reportPromotedRollout(context);
          output =
            report.status === 'ROLLOUT_READY_LOCAL'
              ? {
                  ...report,
                  command: parsed.command,
                  status: 'PROMOTED',
                  productionState: 'VERIFIED',
                  verdict: 'ROLLOUT_READY_LOCAL',
                  exitCode: 0,
                }
              : manifestResult(parsed.command, report);
        }
      }
    }
  } catch (error) {
    const productionState = observedManifest?.productionState ?? 'UNCHANGED';
    output = {
      command: argv[0] ?? null,
      status: 'BLOCKED',
      exitCode: 1,
      reason: error.message,
      productionState,
      production:
        productionState === 'VERIFIED'
          ? observedManifest.production
          : productionState === 'UNKNOWN'
            ? (observedManifest?.production ?? null)
            : [],
    };
  }
  console.log(JSON.stringify(output));
  process.exitCode = output.exitCode;
  return output.exitCode;
}

export function manifestResult(command, manifest) {
  const exitCode = manifest.status === 'PROMOTED' ? 0 : manifest.status === 'NO_CHANGE' ? 2 : 1;
  return {
    command,
    status: manifest.status,
    exitCode,
    reason: manifest.failure?.reason ?? null,
    productionState: manifest.productionState,
    aggregate: manifest.aggregate,
    production: manifest.production.map(({ path: productionPath, bytes, sha256, format }) => ({
      path: productionPath,
      bytes,
      sha256,
      format,
    })),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  void main(process.argv.slice(2));
}
