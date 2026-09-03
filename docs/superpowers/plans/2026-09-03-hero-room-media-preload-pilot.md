# Hero Room Media Preload Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a poster-first living-room/kitchen hero pilot that prepares complete room bundles before transitions, reuses retained Blob-backed media, and recovers safely from bounded failures.

**Architecture:** Keep the existing hero composition, product phase helpers, room animations, and asset registries. Add one hero-local preparation/cache module, owned by the mounted `Hero`, and extend the existing pure room state; media components render only requested pilot rooms and play retained video elements. Preparation has three distinct phases: fetch each full file into a Blob, prove media readiness on the retained element, then expose playback only after the visible `playing` event. Preparation and playback have separate operation ownership, while reduced motion uses decoded images without downloading transition videos.

**Tech Stack:** Existing Next.js, React, TypeScript, scoped CSS, native HTML image/video APIs, Vitest/Testing Library, and Playwright. No new dependency, worker, service worker, provider, or media transformation.

## Global Constraints

- This document is the bounded pilot plan and implementation authorization supplied by the user. It requires a fresh isolated Sol Medium review before code changes. After a READY review, execution may continue without another approval of the same design.
- Repository: `D:\Projects\evironn`. Evidence baseline: `28b1407fdbad94ce1303c4de24d7e6b4a31ee39d` on `phase/06-hardening-release`, independently verified before this update.
- Pilot only `living-room` and `kitchen`. Bedroom/terrace controls remain visible, disabled, and inaccessible to runtime preparation. Their hero images and videos must never be requested, including through preload hints or image optimizer URLs.
- Preserve both protected untracked plans: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` and `docs/superpowers/plans/phase-2-task-3-execution.md`. Never edit, stage, delete, or clean them.
- No other section, product-card implementation, catalog, PDP, admin, database, provider, asset, route, configuration, or decision changes. Keep all 44 hero assets and all registry entries. No re-encoding or asset quality changes. Coordinator closeout may update only the named progress/status/evidence files in the allowlist.
- Use existing same-origin `/assets/hero/*` media and the existing same-origin Next image optimizer for the living poster. Video preparation uses exactly one `fetch`, one full `Blob`, and one `URL.createObjectURL` per successfully prepared file; never use data-video URLs, external media, service worker, IndexedDB, HLS, or a general media engine.
- Production CSP change is limited to `media-src 'self' blob:` in `lib/security/headers.mjs` plus its focused test updates. Do not add wildcards, new domains, `unsafe-inline`, or any other directive change. Do not copy the diagnostic stand's simplified CSP.
- No full gate, production build, broad E2E, database/provider commands, push, deploy, PR, or merge. Local commits are allowed only for the reviewed plan checkpoint and the exact implementation allowlist below. Full Phase 6 closeout remains outside this pilot.
- Durable documents, code, tests, and commit subjects use complete technical English. Authorized agent commentary uses caveman ultra. Use normal/default service tier.

---

## Ownership and dependencies

All paths below are relative to `D:\Projects\evironn`; the exact write allowlist is:

1. Task 1: `components/evironn/home/hero-room-state.ts`, `components/evironn/home/hero-rooms.ts`, and `tests/evironn-hero-state.test.ts`.
2. Task 2: create `components/evironn/home/hero-room-preload.ts` and `tests/evironn-hero-preload.test.ts`; modify `lib/security/headers.mjs` and `tests/security-headers.test.ts`. The new module owns only Blob resource preparation, media readiness, cache identity, and resource cleanup. The security files own only the approved Blob media directive and its focused assertions.
3. Task 3: `components/evironn/home/hero.tsx`, `components/evironn/home/hero-room-media.tsx`, `components/evironn/home/hero-product-media.tsx`, `styles/evironn/home/hero.css`, and `tests/evironn-hero-shell.test.tsx`.
4. Task 4: create `playwright.hero.config.ts`; modify `e2e/evironn-hero-video-rollout.spec.ts` and only hero-related assertions/helpers in `e2e/evironn-home.spec.ts`.

`hero-products.ts`, `hero-product-state.ts`, and `tests/evironn-hero-assets.test.ts` are read-only contracts. Do not modify product-card source. Tasks execute sequentially; Task 2 consumes Task 1's pilot type, Task 3 consumes both, and Task 4 verifies the integrated result. Coordinator closeout may update only `.superpowers/sdd/progress.md`, `docs/roadmap/STATUS.md`, and `.superpowers/sdd/hero-room-media-preload-pilot-delivery.md` after implementation checks; no other durable file is in scope. No general media framework or unrelated refactor is permitted.

## Binding readiness and lifecycle contract

### Complete bundle and poster-first behavior

- A normal-motion bundle contains the room poster, both product focus images, and exactly four directional video resources: each room product's forward and reverse directions. Living products are `chair` and `sofa`; kitchen products are `kitchen-dining` and `kitchen-island`.
- The initial rendered media is the existing eager/high-priority living Next `<Image>` with its current dimensions, quality, and responsive source set. Decode that actual element; do not create a second raw living-poster request. Start living focus/video preparation only after poster decode and a following animation frame, with a cancellable 100 ms scheduling fallback for suspended animation frames. The attempt deadline includes this wait. A failed initial poster shows the existing neutral background and retry UI, not an invented ready room.
- Kitchen is not mounted or prepared until an explicit kitchen activation. Its poster is then mounted with eager loading; it must not wait for an invisible lazy image. Decode the actual poster node before starting that room's remaining resources. No hover, idle, observer, keyboard focus, or speculative kitchen prefetch.
- Image readiness requires `decode()` fulfillment and `naturalWidth > 0 && naturalHeight > 0`; `load` alone is insufficient. Observe `complete` on registration for hydration/cache hits and still decode. A rejected decode or image error fails the attempt. Reuse the prepared focus image nodes in the media host rather than creating replacement images on product selection.
- For each selected video format, first require a successful full-file `fetch` response and non-empty `response.blob()`. Store that exact Blob and create exactly one object URL. Then require media readiness on that exact retained element/source generation: `loadedmetadata` (or already-present `readyState >= HAVE_METADATA`), finite positive duration, and a usable first frame (`readyState >= HAVE_CURRENT_DATA` or equivalent `loadeddata` proof). `buffered` is diagnostic only; an empty or evicted range does not mean the retained Blob is lost and must not trigger an HTTP fetch. Visible playback is a separate phase: reset the retained element, call `play()`, and reveal the transient layer only after guarded `playing`.
- Fetching full files is not the same as media readiness or visible playback. Use one serial resource queue per room with at most one active full-file fetch at a time; the queue-wait deadline is the remaining absolute room deadline. Each active fetch has a 15,000 ms cap, capped by the remaining room deadline; the room hard deadline is 45,000 ms. These limits are justified by measured Blob preflight times (~16 s WebM living, ~12 s WebM kitchen; ~25 s/~18 s MP4 under 10 Mbit/s), not by four competing timeout assumptions. No polling loop is needed to prove full Blob receipt; media listeners have a bounded readiness timer.
- Attach only one source format per resource: use VP9 WebM exactly when the existing `canPlayType('video/webm; codecs="vp9"') !== ''` policy selects it; otherwise attach MP4 directly. Preserve `selectHeroVideoSource`'s existing exported signature and tests. On a WebM fetch, Blob, object-URL, or media-readiness failure/timeout, dispose only that WebM attempt and allow exactly one matching MP4 attempt before playback, under the same room deadline. Reset metadata/media proof and source generation. Never fetch both formats upfront; never fall back after `play()` is called. MP4 failure is terminal for that user attempt.

### Cache, cleanup, failure, and reduced motion

- One cache instance belongs to one mounted `Hero`. It stores each successful full Blob, its single object URL, and its retained media element by room/product/direction/selected format. Append prepared elements once into the permanent `.furni-hero-product-media` host and keep them attached, hidden when inactive. Normal product completion, phase changes, and room switches remove playback listeners and pause/reset elements, but never clear `src`, call `load()`, recreate nodes, refetch, or discard successful Blob/object-URL pairs.
- Replay uses the exact prepared element and Blob URL: pause, set `currentTime = 0`, set the registry `playbackRate`, bind fresh guarded playback listeners, then call `play()`. Cached room switches have no preparation spinner. Do not use buffered-range emptiness as cache invalidation. If media readiness is genuinely lost while the Blob remains, rebind the same retained object URL or rebuild the media element from the same Blob without HTTP fetch; only missing Blob/object URL or an explicit fetch failure invalidates the entry. No replay path may call `fetch`.
- Each preparation has a monotonically increasing room operation ID and an `AbortSignal`; each source assignment has its own generation. All callbacks, decode promises, timers, source fallback, and delayed state updates validate cache lifetime, operation ID, generation, and assigned source. Check the current operation again before changing React state. Stale completions do nothing.
- Use a 45,000 ms hard deadline per room attempt. Poster/focus image preparation and each active video fetch/media-readiness step have a 15,000 ms cap, while resources waiting in the serial queue consume only the remaining room deadline. At most one active video fetch exists per room; WebM plus one MP4 fallback is still bounded by the same room deadline. Progress never extends a deadline. No infinite retries. One click on `Повторить` starts one fresh operation; duplicate clicks while busy are ignored.
- On failure or cancellation, clear all attempt listeners, readiness timers, animation-frame handles, and timers. Abort only the operation-owned active fetch. Revoke object URLs and drop Blobs only for newly owned failed/superseded resources; committed successful resources belong to the cache and survive. Empty buffered ranges never revoke or refetch a committed Blob. Store successfully decoded images independently of the all-or-nothing room readiness flag, preserving the active poster, decoded focus images, and unrelated successful rooms. A playback/media-readiness failure uses media-only invalidation: pause/detach listeners and mark only its media binding unready while preserving the committed Blob/object URL when present. A fetch/Blob/object-URL failure uses resource disposal and may revoke/drop only that entry. `dispose()` on actual hero unmount stops videos, removes sources from cache-owned nodes, aborts requests, revokes every object URL, clears Blob/element references, and prevents subsequent state updates; it is idempotent. React Strict Mode effect cleanup/setup must create a usable new cache lifetime without reviving disposed operations.
- Keep the last stable room visible while preparing or failing. A pending room request does not change the visible stack or product until its complete bundle is ready. If a product is already focused, preserve its phase/card snapshot during preparation; on readiness, cancel the product and use the existing direct room transition. On preparation failure, retain that snapshot and restore safe controls. During initial living failure, keep product controls disabled because no normal-motion bundle exists, but allow retry, kitchen selection, and non-media links.
- Show `Не удалось загрузить комнату. Повторить загрузку?` and a `Повторить` button on preparation failure. Clear busy state and its interaction shield. Successful cached rooms, normal navigation, and the rest of the page remain usable. Retry targets the failed room; selecting another allowed room clears the old error and invalidates stale retry callbacks.
- Selecting the already-active ready room while a different room has failed is error dismissal, not a room transition. Increment the room operation ID, clear target/error, return to idle, and preserve the active room and product/card snapshot. Abort obsolete preparation ownership and invalidate old retry callbacks without preparing, animating, requesting media, or cancelling the stable product. A later kitchen activation is a new explicit attempt; the dismissed retry button cannot remain active.
- Check the complete current bundle before every normal-motion product/back activation and again immediately before playback entry. Missing Blob/object URL or genuine media-binding readiness failure at either boundary uses the explicit Task 3 unavailable-playback callback; an empty/evicted `buffered` range alone does neither. Recover to idle for forward or the focused product for reverse, clear busy/shield, and expose Russian retry. Never leave an entering/returning phase waiting for a nonexistent ready bundle. Explicit retry repairs resources within the existing room deadline and never starts playback automatically.
- Preserve `recoverHeroMediaFailure`: failed forward playback returns to room idle, failed reverse playback retains the focused product/card. Surface the same retry affordance for the failed direction; retry repairs the room bundle and leaves the recovered stable phase intact until a fresh product/back activation. Do not automatically replay a failed transition. A play rejection uses this path, not a codec retry. Bound playback startup by 5,000 ms and completion by `5,000 + Math.ceil(duration / playbackRate * 1,000) + 2,000` ms; remove both timers on completion/cancellation.
- With reduced motion enabled before preparation, the ready bundle is images-only: decoded poster plus two focus images, zero video sources and zero video requests. Product enter/return completes through the existing guarded reduced-motion callback path without `play()`. Preserve existing reduced room CSS behavior; the spinner is static, not rotating.
- If reduced motion becomes enabled during preparation/playback, invalidate the pending operation/playback generation, pause playback, cancel only uncommitted video work, and complete the requested action through image readiness. Retain already successful Blob/object-URL caches, paused. If it becomes disabled, prepare the active room's missing videos under the same shield before enabling animated product controls; never fetch unrequested kitchen media. Image-only cache readiness never implies normal-motion readiness.

## Task 1: Establish pilot availability and guarded preparation state

**Files:** Modify the three Task 1 paths in the ownership list. Preserve the four-room registry and eight-product registry; keep `AvailableHeroRoomId` compatible with their existing entries and add a distinct pilot type instead of narrowing those registries.

**Interfaces:** Add these definitions to `hero-room-state.ts`; existing `completeHeroRoomTransition`, `recoverHeroRoomTransition`, and `isHeroRoomTransitioning` continue to accept `HeroRoomState`. The last helper means only `phase === 'changing'`, not preparation.

```ts
export const PILOT_HERO_ROOM_IDS = ['living-room', 'kitchen'] as const;
export type PilotHeroRoomId = (typeof PILOT_HERO_ROOM_IDS)[number];
export type AvailableHeroRoomId = HeroRoomId;
export type HeroRoomState = {
  activeRoom: PilotHeroRoomId;
  targetRoom: PilotHeroRoomId | null;
  phase: 'idle' | 'preparing' | 'changing' | 'error';
  direct: boolean;
  operationId: number;
  error: { room: PilotHeroRoomId; message: string } | null;
};
export function isAvailableHeroRoom(room: HeroRoomId): room is PilotHeroRoomId;
export function requestHeroRoom(
  state: HeroRoomState,
  target: HeroRoomId,
  targetReady: boolean,
  direct?: boolean,
  operationId?: number,
): HeroRoomState;
export function completeHeroRoomPreparation(state: HeroRoomState, operationId: number): HeroRoomState;
export function restartHeroRoomPreparation(state: HeroRoomState, operationId: number): HeroRoomState;
export function dismissHeroRoomError(state: HeroRoomState, target: HeroRoomId, targetReady: boolean): HeroRoomState;
export function failHeroRoomPreparation(state: HeroRoomState, operationId: number, message: string): HeroRoomState;
```

- [ ] **RED:** Add state assertions for disabled bedroom/terrace, preparing an unready kitchen, same-room living bootstrap/retry, monotonic IDs, stale success/failure, error recovery, and cached transition. Replace old expectations that all four rooms are available, but preserve all-room registry/codec mapping assertions. Use this minimal regression with imports from the interface above:

  ```ts
  it('waits for the matching complete kitchen bundle', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const pending = requestHeroRoom(ready, 'kitchen', false, false, 1);
    expect(pending.phase).toBe('preparing');
    expect(pending.activeRoom).toBe('living-room');
    expect(completeHeroRoomPreparation(pending, 0)).toBe(pending);
    expect(completeHeroRoomPreparation(pending, 1).phase).toBe('changing');
    expect(requestHeroRoom(ready, 'bedroom', true)).toBe(ready);
    expect(requestHeroRoom(ready, 'terrace', true)).toBe(ready);
  });
  ```

- [ ] **RED — error dismissal:** Add this exact state regression, plus rejection assertions for an unready active target, a different target, and a non-error phase. The corresponding component regression belongs to Task 3, not to this task's write set.

  ```ts
  it('dismisses failed kitchen on living selection and ignores stale completion', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const pending = requestHeroRoom(ready, 'kitchen', false, false, 1);
    const failed = failHeroRoomPreparation(pending, 1, 'Kitchen failed');
    expect(requestHeroRoom(failed, 'living-room', true)).toBe(failed);
    const dismissed = dismissHeroRoomError(failed, 'living-room', true);
    expect(dismissed).toEqual({
      activeRoom: 'living-room',
      targetRoom: null,
      phase: 'idle',
      direct: false,
      operationId: 2,
      error: null,
    });
    expect(completeHeroRoomPreparation(dismissed, 1)).toBe(dismissed);
    expect(failHeroRoomPreparation(dismissed, 1, 'Late failure')).toBe(dismissed);
    const retry = requestHeroRoom(dismissed, 'kitchen', false, false, 3);
    expect(retry.phase).toBe('preparing');
    expect(completeHeroRoomPreparation(retry, 1)).toBe(retry);
    const changing = completeHeroRoomPreparation(retry, 3);
    expect(changing.phase).toBe('changing');
    expect(completeHeroRoomTransition(changing).activeRoom).toBe('kitchen');
  });
  ```

- [ ] Run `npx vitest run tests/evironn-hero-state.test.ts`. Expected RED: missing preparation functions or old immediate/availability assertions, not unrelated setup failure.
- [ ] **GREEN:** Initialize `{ activeRoom: 'living-room', targetRoom: 'living-room', phase: 'preparing', direct: false, operationId: 0, error: null }`. `requestHeroRoom` rejects nonpilot targets, busy phases, and nonincreasing IDs; its default ID is `state.operationId + 1`. It rejects an already-active ready target, accepts an unready same-room retry/upgrade, clears error, and selects `preparing` versus `changing` from `targetReady`. A matching preparation completion enters idle for the active room or changing for another room. Failure enters error with the failed target recorded and the active room unchanged. Transition completion commits target; animation recovery returns active room to idle. `restartHeroRoomPreparation` is reserved for a motion-preference change: require a larger ID, retain `targetRoom ?? activeRoom` and `direct`, set preparing, and clear error. This permits replacing a busy operation without accepting competing user input. Test a motion restart followed by stale completion of the original ID. All invalid/stale operations return the same object. Change only bedroom/terrace option flags to `available: false`; align the existing availability constant with the pilot tuple while explicitly retaining `AvailableHeroRoomId = HeroRoomId` for the four-room registry key type.
- [ ] **GREEN — error dismissal:** Keep `requestHeroRoom`'s already-active ready rejection as the normal no-op. Implement the separate pure helper below. It owns no media/product side effect; Task 3 calls it before the normal no-op guard when `state.phase === 'error'` and the selected target is the active ready room. Synchronize the coordinator's operation counter with its incremented ID before accepting another callback or activation.

  ```ts
  export function dismissHeroRoomError(state: HeroRoomState, target: HeroRoomId, targetReady: boolean): HeroRoomState {
    if (state.phase !== 'error' || target !== state.activeRoom || !targetReady) return state;
    return {
      ...state,
      targetRoom: null,
      phase: 'idle',
      direct: false,
      operationId: state.operationId + 1,
      error: null,
    };
  }
  ```

  Run `npx vitest run tests/evironn-hero-state.test.ts -t "dismisses failed kitchen"` for RED before this helper and GREEN after it; expected RED is the missing dismissal transition and GREEN is the complete assertion sequence above passing.

- [ ] Rerun the same command; expected all state tests PASS. Run `npx prettier --check components/evironn/home/hero-room-state.ts components/evironn/home/hero-rooms.ts tests/evironn-hero-state.test.ts` and `npx eslint components/evironn/home/hero-room-state.ts components/evironn/home/hero-rooms.ts tests/evironn-hero-state.test.ts`; expected no new errors. Dependent shell assertions migrate in Task 3, not by deleting them here.
- [ ] **Review/commit boundary:** Review pure transitions, IDs, unchanged registries, and narrowed availability. Proposed commit, only after coordinator authorization and user Git identity verification: `feat: define hero preload pilot state`. Stage only these three paths. Stop for any Critical/Important finding.

## Task 2: Implement full-Blob preparation and retained room cache

**Files:** Create `components/evironn/home/hero-room-preload.ts` and `tests/evironn-hero-preload.test.ts`; modify only `lib/security/headers.mjs` and `tests/security-headers.test.ts` for the approved Blob CSP directive. The module receives source choices from `selectHeroVideoSource` through a callback, so it does not import a React component or introduce an import cycle.

**Interfaces:** Export the following types and functions from `hero-room-preload.ts`. Import `PilotHeroRoomId`, `HeroProductId`, and `HeroVideoSources` from their existing owners; derive products only from the requested room registry. `setPoster` registers the actual rendered poster, while the permanent host holds cache-owned focus images/videos.

```ts
export type HeroPreparationMode = 'animated' | 'static';
export type HeroVideoDirection = 'forward' | 'reverse';
export type HeroVideoEntryId = Readonly<{
  productId: HeroProductId;
  direction: HeroVideoDirection;
}>;
export type HeroPreparationFailure = Error & {
  room: PilotHeroRoomId;
  resource: 'poster' | 'focus' | 'video' | 'registration';
};
export type HeroPreparedVideo = Readonly<{
  entry: HeroVideoEntryId;
  format: 'webm' | 'mp4';
  blob: Blob;
  objectUrl: string;
  element: HTMLVideoElement;
  mediaReady: boolean;
}>;
export type HeroPreparedRoom = Readonly<{
  room: PilotHeroRoomId;
  mode: HeroPreparationMode;
  poster: HTMLImageElement;
  focus: ReadonlyMap<HeroProductId, HTMLImageElement>;
  videos: ReadonlyMap<string, HeroPreparedVideo>;
}>;
export type HeroRoomMediaCache = {
  setHost(host: HTMLDivElement | null): void;
  setPoster(room: PilotHeroRoomId, image: HTMLImageElement | null): void;
  get(room: PilotHeroRoomId, mode: HeroPreparationMode): HeroPreparedRoom | null;
  getUnreadyVideo(room: PilotHeroRoomId): HeroVideoEntryId | null;
  prepare(
    room: PilotHeroRoomId,
    mode: HeroPreparationMode,
    operationId: number,
    signal: AbortSignal,
  ): Promise<HeroPreparedRoom>;
  invalidateVideoMedia(room: PilotHeroRoomId, product: HeroProductId, direction: HeroVideoDirection): void;
  disposeVideoResource(room: PilotHeroRoomId, product: HeroProductId, direction: HeroVideoDirection): void;
  dispose(): void;
};
export function createHeroRoomMediaCache(
  selectSource: (
    sources: HeroVideoSources,
    canPlayType: (mime: string) => string,
  ) => Readonly<{ format: 'webm' | 'mp4'; src: string }>,
): HeroRoomMediaCache;
export function isHeroVideoMediaReady(video: HTMLVideoElement, metadataSeen: boolean): boolean;
```

`videos` uses keys `${productId}:${direction}`; its internal entry also records selected format, full Blob, single object URL, assigned source, media-readiness proof, and source generation. `get` returns null unless the requested mode is currently fully ready. Static reads may reuse independently decoded images even if video preparation failed. `prepare` returns an existing valid bundle without `fetch`, Blob creation, object-URL creation, source assignment, or media-node creation; otherwise it creates only missing entries, atomically marks the complete room ready, or rejects with `HeroPreparationFailure`. Video resources fetch full files serially, then bind the resulting object URL to the retained element and await metadata/first-frame readiness. Cancellation rejects with `AbortError` and does not surface user-visible failure. Missing host/poster registration waits inside the same bounded attempt; it is not an unbounded promise. Ref detachment does not itself dispose a cache. All construction before mount is DOM/network-free.

`getUnreadyVideo` is a synchronous, read-only inspection of the requested room's four expected entries, in registry product order and forward/reverse order. It returns the first missing entry or entry lacking its committed Blob/object URL/element/media-readiness proof, otherwise null. It must not inspect `buffered` as proof of Blob retention, invalidate a healthy entry, assign a source, call `load()`, fetch, or start preparation. This identifies the actual failed entry even when it is not the direction the user clicked. Task 2's retained-Blob regression asserts that an empty `buffered` range does not return an unready entry or cause any fetch/object-URL/source side effect. `invalidateVideoMedia` marks only the media binding unready while preserving Blob/object URL; `disposeVideoResource` removes the identified resource and revokes/drops its object URL/Blob. Repeated checks during explicit retry identify any missing resources without discarding healthy entries.

- [ ] **RED:** In the new jsdom test file, mock `fetch`, `Response.blob`, `URL.createObjectURL/revokeObjectURL`, native media properties/events, image decode, and timers, not the cache itself. Add this media-readiness regression and independently cover nonfinite duration, missing metadata, missing first-frame proof, and empty buffered ranges:

  ```ts
  it('does not treat an empty buffered range as loss of a retained Blob', () => {
    const video = document.createElement('video');
    Object.defineProperties(video, {
      duration: { value: 6 },
      readyState: { value: 2 },
    });
    expect(isHeroVideoMediaReady(video, true)).toBe(true);
  });
  ```

  Add named cases `waits for decoded poster before fetching four videos`, `stores one full Blob and one object URL per video`, `serializes video fetches and separates queue from active deadlines`, `reuses all four retained elements without fetch or object-URL assignment`, `falls back once with fresh Blob/media proof`, `times out and retries without stale completion`, and `static mode attaches no videos`. Fake timers must prove 15-second active resource deadlines and the absolute 45-second room deadline without real waits. Cover a failing focus decode, abort during decode/fetch, fallback double error, stale source events, failed-entry-only disposal, unmount, Strict Mode remount, and empty-buffer replay. Assertions must count all four directions and both decoded focus images, and must distinguish full Blob receipt, media readiness, and visible playback.

- [ ] Run `npx vitest run tests/evironn-hero-preload.test.ts`. Expected RED: missing cache implementation/readiness export. Retain this output as the regression receipt.
- [ ] **GREEN:** Implement the interfaces and binding lifecycle above. For each video, enqueue one active fetch at a time; require `response.ok`, consume `response.blob()` once, reject empty blobs, create one object URL, append one muted/inline video node to the cache host, attach readiness listeners before assigning the object URL, and commit only after full Blob receipt and media readiness. Keep fetch/media metadata ownership in the per-source record rather than sharing it across fallback attempts. `invalidateVideoMedia` pauses/detaches only the media binding and preserves Blob/object URL; `disposeVideoResource` revokes/drops them. Never use `buffered` emptiness as invalidation or make `prepare` call `play()`.

  ```ts
  export function isHeroVideoMediaReady(video: HTMLVideoElement, metadataSeen: boolean): boolean {
    return (
      metadataSeen &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    );
  }
  ```

  Create video nodes with `muted = true`, `playsInline = true`, and `preload = 'auto'`; never call `play()` during preparation. Assign one object URL only after listeners are attached. Keep per-operation disposers and a generation check around every asynchronous continuation. Cache commit occurs after all seven resources meet the contract, or all three images in static mode. Blob byte counts are payload retention only, not total RAM. Do not add MediaSource or another transport/cache architecture.

- [ ] Rerun the same command; expected all cache tests PASS. Run `npx vitest run tests/security-headers.test.ts`; expected CSP tests PASS with exact `media-src 'self' blob:` in both preview and production variants and all other directives unchanged. Run `npx prettier --check components/evironn/home/hero-room-preload.ts tests/evironn-hero-preload.test.ts lib/security/headers.mjs tests/security-headers.test.ts` and `npx eslint components/evironn/home/hero-room-preload.ts tests/evironn-hero-preload.test.ts`; expected no new errors. Assert the security diff changes only `media-src 'self' blob:`.
- [ ] **Review/commit boundary:** Fresh bounded review of fetch queue, Blob/object-URL ownership, media readiness, fallback, timeout/retry, cache retention, cleanup, and CSP scope. Proposed authorized commit: `feat: prepare and retain hero room media bundles`. No GREEN claim from mocked events substitutes for Task 4's real-browser evidence.

## Task 3: Connect preparation, retained playback, and hero-only recovery UI

**Files:** Modify only the five Task 3 paths. Do not modify `HeroProductCard`, its motion helpers, or product state semantics.

**Interfaces:** Keep the existing callbacks on `HeroProductMedia`, adding `cache: HeroRoomMediaCache`, `room: PilotHeroRoomId`, `roomOperationId: number`, `playbackGeneration: number`, and `onPlaybackUnavailable: (failure: HeroPlaybackUnavailable) => void`. Replace the previously unspecified zero-argument cache-invalidation callback with this exact contract. Its permanent root passes its element to `cache.setHost`; React must not also reconcile cache-owned child nodes. It no longer mounts a selected `<video>` or replacement focus `<img>`. Keep `selectHeroVideoSource` exported here. Replace `HeroRoomMedia.onRoomReady` with `onPosterElement: (room: PilotHeroRoomId, image: HTMLImageElement | null) => void`; add `requestedRooms: readonly PilotHeroRoomId[]` and `posterVersions: Readonly<Partial<Record<PilotHeroRoomId, number>>>`. Key each poster by room and its version, initially zero. On retry of a tagged poster failure only, increment that room's version so a failed request/decode gets a fresh actual image node; successful posters do not remount on video retry or room switches. Add `operationId: number` to its completion/failure callback arguments so delayed animation events and its existing 1,400 ms timeout cannot complete a newer operation.

Export `HeroPlaybackUnavailable` from `hero-product-media.tsx`; import `HeroVideoEntryId` from Task 2 and the existing room/product types. The two handlers below are local to `Hero` in `hero.tsx` and own both hotspot and Back activation; they introduce no new file or product-state change.

```ts
export type HeroPlaybackUnavailable = Readonly<{
  room: PilotHeroRoomId;
  entry: HeroVideoEntryId;
  failedPhase: HeroPhase;
  stage: 'before-activation' | 'playback-entry';
  roomOperationId: number;
  playbackGeneration: number;
}>;
function activateHeroProduct(product: HeroProductId, direction: HeroVideoDirection): void;
function handleHeroPlaybackUnavailable(failure: HeroPlaybackUnavailable): void;
```

- [ ] **RED:** Update shell fixtures to explicitly decode registered images and supply finite metadata plus first-frame readiness for each retained video. Replace the obsolete single-video/release-on-ended and four-unlocked-rooms assertions with poster-first, complete-bundle, and Blob-cache-retention assertions. Add this immediate-render regression:

  ```tsx
  it('does not mount unrequested room posters', () => {
    render(<Hero />);
    const hero = document.querySelector('#evironn-hero')!;
    expect(hero.querySelectorAll('.furni-hero-room-media__image')).toHaveLength(1);
    expect(hero.querySelector('img[src="/assets/hero/kitchen-idle.webp"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'СПАЛЬНЯ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ТЕРРАСА' })).toBeDisabled();
  });
  ```

  Add component cases for kitchen activation before its readiness, three-of-four video readiness, failed fourth video, image decode failure, initial error, retry, stale completion after switching targets, room animation timeout, repeated forward/reverse playback, focus preservation during preparation, and motion changes in both directions. Verify no transition class or stack timer before bundle readiness, cached switches without busy state, and no calls to `load()`/source reassignment on successful replay. Preserve poster optimization, route links, card reveal at 0.72, product failure semantics, responsive class names, and codec tests. Replace obsolete source-text assertions about `loadeddata` readiness with behavioral assertions; do not weaken codec or cleanup coverage.

- [ ] **RED — dismissal component regression:** Add `dismisses kitchen error without disturbing living product and permits explicit retry`. Prepare living, complete sofa forward so its focus image/card are stable, activate kitchen, and fail a kitchen directional source terminally. Capture that attempt's completion/failure/retry callbacks and the living media identities, `play()`/`load()`/source-assignment counts, and preparation-call count. Activate `ГОСТИНАЯ`: require no alert or retry button, `aria-busy="false"`, no `.is-incoming` or `.is-changing`, unchanged living poster/focus/card/collection link, and no additional preparation, animation, source assignment, load, or play. Deliver the captured kitchen callbacks: require the same snapshot and counts. Activate `КУХНЯ` again, fail this fresh attempt once, activate its new `Повторить`, then resolve all seven resources and finish the real component animation callback. Require kitchen stable only after the new operation's readiness; old completions remain inert throughout. After dismissal, kitchen reactivation is the explicit new attempt, not a hidden retained retry button. Run `npx vitest run tests/evironn-hero-shell.test.tsx -t "dismisses kitchen error"`; expected RED is uncleared error or stale mutation, and GREEN is the complete snapshot/request sequence passing.
- [ ] **RED — retained-Blob component regressions:** Add a `describe('retained-Blob component regressions', ...)` group with four named cases: `replays after empty buffered ranges without refetch`, `repairs a lost media element from the retained Blob`, `recovers missing Blob before forward activation`, and `recovers missing Blob before back activation`. Start with a fully prepared living bundle; Back cases first complete sofa forward. Override only the selected retained video's `buffered` property to an empty `TimeRanges` before clicking in the first case and assert the activation still proceeds without `fetch`, object-URL creation, source assignment, or cache invalidation. In the second case, simulate media readiness loss while preserving the committed Blob/object URL; explicit retry may rebind the same object URL to a fresh retained element, but must not issue HTTP fetch or create a second object URL. Missing Blob/object-URL cases may invalidate only that entry. Assert all healthy source/node identities remain unchanged, no entering/returning state is stranded, the hero has `aria-busy="false"`, and no inert/shield remains after recovery. Forward retains the stable living poster with no product card; Back retains the sofa focus image/card and Back control. Both expose the exact Russian error and `Повторить` only for genuine media/resource failure. Assert no preparation/request occurs until retry. Click retry, restore the missing entry's media readiness within 45,000 ms, and require the same stable phase with no play; only the next explicit hotspot/Back activation may play. Deliver captured old progress/ended/error, startup/completion timer callbacks, and play rejection after recovery and after retry: all must be inert. Advance fake timers past the old completion bound and verify no phase/error change or leaked timer. Run `npx vitest run tests/evironn-hero-shell.test.tsx -t "retained-Blob component regressions"`; expected RED is a stranded phase, repeat fetch/object URL, or premature playback, and GREEN is all four cases passing.
- [ ] Run `npx vitest run tests/evironn-hero-shell.test.tsx`. Expected RED includes four mounted posters, missing preparation UI, or old selected-video lifecycle. Do not accept an unrelated fixture exception as evidence.
- [ ] **GREEN — orchestration:** Remove the seeded `readyRooms` truth and idle-image readiness callback. Own cache lifetime, requested room IDs, attempt AbortController, and monotonic operation IDs in `Hero`. Bootstrap living preparation; enable kitchen after bootstrap success or bounded failure, even though kitchen is not prepared. On room click, check `cache.get(room, mode)` before the same-room no-op guard. When `roomState.phase === 'error'`, `room === roomState.activeRoom`, and that bundle is ready, abort obsolete preparation ownership, call `dismissHeroRoomError`, synchronize the operation counter, and clear old retry ownership without mutating the product/card snapshot. Return immediately: no preparation, animation, source request, stack timer, or `cancelHeroProduct`. Otherwise keep `requestHeroRoom`'s normal already-active ready rejection; a different ready room begins the existing transition without busy UI, and an unready room starts preparation while preserving the stable snapshot. On matching success, record readiness and only then request the changing state; start the existing 360 ms stack handoff only in changing. Guard transition finish/failure and queued focus work by the current operation. In reduced motion, avoid the 360 ms spatial stack delay while retaining reduced room transition semantics. `HeroRoomMedia` renders only requested pilot IDs, marks the active poster stable in preparing/error as well as idle, and never maps all `HERO_ROOMS`.
- [ ] **GREEN — activation preflight:** Route both hotspot and Back through `activateHeroProduct`. Reject locked/invalid activations first. Compute the prospective phase with the existing `selectHeroProduct` or `startHeroReturn`, but do not mutate phase/card visibility yet. Allocate a fresh playback generation and synchronously inspect `cache.get(activeRoom, 'animated')` and `getUnreadyVideo(activeRoom)`. Empty `buffered` alone is never a failure: a committed Blob/object URL/media entry remains eligible. If an entry is missing its retained Blob/object URL or has a genuine media-readiness failure, call `handleHeroPlaybackUnavailable` with that exact entry, prospective `failedPhase`, stage `before-activation`, and the current room operation/new playback generation; return without setting entering/returning, preparing, fetching, or calling play. A complete bundle permits the phase mutation. Reduced-motion activation uses the already-defined static readiness path, not this video check.
- [ ] **GREEN — playback-entry recovery:** In `HeroProductMedia`, recheck the current animated bundle and entry immediately before resetting time/rate or calling `play()`. If media readiness failed after phase mutation, cancel that playback generation's startup/completion timers and all playback listeners, hide/pause its transient video, and call `onPlaybackUnavailable` with stage `playback-entry`; do not infer failure from an empty buffered range when the Blob/object URL remains. Never silently return from an entering/returning effect because the bundle is null. `handleHeroPlaybackUnavailable` first checks room identity, room operation ID, playback generation, and phase: preflight expects the current phase to equal `recoverHeroMediaFailure(failedPhase)`, while entry failure expects the exact `failedPhase`. Ignore stale/duplicate callbacks. For the matching failure, call `invalidateVideoMedia` for a media-only failure or `disposeVideoResource` only when the Blob/object URL is genuinely unavailable, then advance both operation and playback-generation ownership, recover phase with `recoverHeroMediaFailure(failedPhase)`, set card visibility from the recovered phase, and set room state to error with active room unchanged, `targetRoom: null`, `direct: false`, the fresh operation ID, and `{ room: activeRoom, message: 'Не удалось загрузить комнату. Повторить загрузку?' }`. Clear busy/inert/shield and expose `Повторить`; render the preserved focus through `cache.get(room, 'static')`. No entering/returning phase, startup timer, or completion timer survives recovery. Bind generation checks to progress, ended, errors, and play-promise continuations so previous work cannot affect a repaired room.
- [ ] **GREEN — explicit repair and normal playback:** Retry allocates a fresh room operation/playback generation and AbortController, then calls `requestHeroRoom` for the same active unready room and `cache.prepare` with the existing 45,000 ms deadline. Repair only missing/invalid resources; preserve healthy videos, decoded images, committed Blobs, and object URLs. When only media readiness is lost, rebind the same retained Blob/object URL without HTTP fetch or a second object URL. On matching success return room state to idle while keeping the recovered product phase/card unchanged. Do not queue or automatically play the previous action; a fresh hotspot/Back activation must pass preflight. On retry failure, remove busy/shield and retain recovery/error UI. Normal playback resets the retained element's time/rate, binds guarded playback listeners/timers, and calls `play()`; visibility begins when playback starts, and reverse retains focus until then. Completion/cancellation hides, pauses, and resets without releasing healthy sources. Preserve the existing forward/reverse recovery behavior for ordinary play rejection or media errors, with the same generation/timer cleanup. Never switch codecs after `play()` is called.
- [ ] **GREEN — UI:** Put the preparation overlay inside `#evironn-hero`; set `aria-busy` on that section. Use a sibling overlay outside the inert hero-control wrapper containing the stack, hotspots, and product card. Give that wrapper `inert` only while preparing; also guard all handlers and disable buttons. Preserve an interaction shield over hero visuals, not over the header/page. Do not put `inert` on the section containing retry/status. Use a focusable `role="status"` loading message `Загрузка комнаты…` and a `role="alert"` error with `Повторить`; never trap Tab. Transfer focus to status only if preparation would disable the currently focused hero control; restore it only if focus has not moved outside the hero. Add only scoped overlay styles: absolute inset 0, a z-index above existing hero controls, neutral translucent background, `backdrop-filter: blur(6px)`, and a CSS border spinner. Add scoped `prefers-reduced-motion` rules disabling spinner rotation. Error UI removes the full-size input shield and blur, leaving a compact readable retry panel and safe controls accessible.
- [ ] Run `npx vitest run tests/evironn-hero-state.test.ts tests/evironn-hero-preload.test.ts tests/evironn-hero-shell.test.tsx tests/evironn-hero-assets.test.ts`; expected PASS including the unchanged 44-asset hashes. Run `npx prettier --check components/evironn/home/hero.tsx components/evironn/home/hero-room-media.tsx components/evironn/home/hero-product-media.tsx styles/evironn/home/hero.css tests/evironn-hero-shell.test.tsx` and `npx eslint components/evironn/home/hero.tsx components/evironn/home/hero-room-media.tsx components/evironn/home/hero-product-media.tsx tests/evironn-hero-shell.test.tsx`; expected no new errors. Local hero-only interfaces do not by themselves authorize a project-wide typecheck; request it only for a demonstrated broader compile boundary.
- [ ] **Review/commit boundary:** Review Tasks 1–3 integration, accessibility, product/room recovery, and source retention using the exact bounded diff and fresh focused evidence. Proposed authorized commit: `feat: integrate hero preload lock and retry recovery`. Stop on Critical/Important findings, unrelated required edits, or a need to change approved visual behavior beyond the overlay.

## Task 4: Prove real-browser request ordering, replay, and recovery

**Files:** Create `playwright.hero.config.ts`; modify only the two existing Task 4 specs. Narrow the existing rollout matrix to the four living/kitchen products, eight directions per viewport. Do not retain an active test requiring bedroom/terrace to unlock. Preserve non-hero home assertions and the existing all-asset unit manifest.

**Test-only instrumentation:** Install before navigation. Record every hero request with normalized original asset pathname, request sequence, Range header, response status/Content-Range, and completion/failure. Unwrap `_next/image?url=` before classification. Separately collect browser `performance.now()` events using capture listeners for metadata/loadeddata/play/playing/ended/error/animationstart and a MutationObserver for Blob URL source assignment, object-URL creation/revocation, node identity, `.is-incoming`, and hero busy state. Wrap `fetch`, `Response.prototype.blob`, and `URL.createObjectURL/revokeObjectURL` only to record calls while delegating to their originals; record actual full-file Blob completion separately from media readiness and visible `playing`. Wrap the original `HTMLImageElement.prototype.decode` in the init script to record actual successful decode resolution without changing its result; record each room's ready time as the maximum of its actual image-decode, full-Blob, and media-readiness timestamps. Sample actual duration and buffered ranges diagnostically at readiness/playback, but never use empty `buffered` as cache-loss proof. Keep all order assertions within the browser clock; do not compare Node and browser timestamps. No production analytics, globals, routes, or debug endpoints are required.

- [ ] **RED:** Change the rollout's zero-initial-video and one-video assumptions to the pilot contract and run only the failing pilot scenario after implementation authorization. Install capability overrides and error routes before the first preparation on a fresh page/context; the old tactic of forcing a fallback after a cached successful round trip no longer tests source selection. Do not dispatch fake metadata/progress/ended/animationend in the real-media rollout proof.
- [ ] **GREEN — normal-motion matrix:** For desktop `1440x1000` and mobile `390x844`, use fresh contexts, real video decoding, real animation completion, and natural media playback at registry rates. Record initial living-poster decode/paint opportunity, all four living resource readiness times, and kitchen click. Hold the kitchen final directional response with a bounded route gate while permitting the other three; assert no incoming room image/stack animation before the held resource completes. Preserve native Range headers and response semantics when continuing routes. Then release the gate and assert the transition event occurs strictly after the independently observed complete image/video bundle time. Release every gate in `finally`; do not use `networkidle` as readiness or hold a route indefinitely.
- [ ] **GREEN — request/replay assertions:** Before kitchen activation, assert no kitchen asset request, Blob fetch, object-URL creation, or source assignment. Across initial load, all interactions, retries, and both room visits, assert zero bedroom/terrace hero requests, including optimizer/preload requests. The successful capability scenario has four unique chosen video URLs per prepared room, one full Blob and one object URL per successful video, not necessarily one network transaction per file; expected focus/poster images are present. Assert both forward/reverse directions for all four pilot products actually reach playing/ended. After preparation settles, snapshot request/Blob/object-URL ledgers and node identities, repeat every direction and living/kitchen room visits, and require no new video request, fetch, Blob, object URL, source assignment, or preparation spinner; empty diagnostic buffered ranges must not change this result. A WebM-success case must never fetch/assign MP4; a fallback case may fetch/assign matching MP4 only after WebM failure, with one Blob/object URL for the successful fallback. If full-file Blob receipt, media readiness, or playback cannot meet these assertions, report failure rather than weakening the assertions.
- [ ] **GREEN — codec/failure matrix:** Use fresh pages for VP9 success, capability-unsupported MP4-only selection, and one pre-play WebM fetch/media failure followed by MP4 success; cover both in-scope rooms and both directions across these cases. Check that MP4 is never fetched or assigned before WebM failure in the fallback case, the replacement gets fresh full-Blob and media-readiness proof, and no retry follows MP4 failure. Hold a kitchen poster, hold one active full-file fetch through its bounded deadline, and inject a terminal video/media error in separate cases. Require bounded exit to the last stable room, Russian error/retry, restored safe keyboard/mouse controls, and a successful explicit retry after removing the fault. Include initial living failure, rejected playback, and return-direction recovery; capture stale events from the failed attempt and prove they cannot change the recovered state. Filter only the exact intentionally injected resource errors; unexpected console/page/CSP errors fail.
- [ ] **GREEN — accessibility/motion matrix:** Reach kitchen and retry using Tab/Enter/Space. While preparation is held, verify hero controls cannot activate, header links/mobile menu remain operable, Tab can leave the hero, and completion does not steal focus from outside. Verify horizontal overflow remains absent. Set reduced motion before navigation on fresh desktop/mobile pages: only requested-room images load, no video fetch/Blob/object-URL/play occurs, static product/back and room selection work, and no rotating spinner appears. Also toggle reduced motion during a held preparation and during playback, then toggle back; verify stale events, retained successful Blobs/object URLs, and demand-only video upgrading. Update `evironn-home.spec.ts` to await bundle readiness, select the actual active codec rather than hard-coded MP4, and assert only living/kitchen availability. Preserve all seven non-hero section, links, drawer, and footer checks verbatim.
- [ ] Run `npx playwright test --config=playwright.hero.config.ts e2e/evironn-hero-video-rollout.spec.ts e2e/evironn-home.spec.ts --list` first. `playwright.hero.config.ts` must contain no `globalSetup`, no `webServer`, no build command, no database/API setup, no provider calls, and must target an already running local server via `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`). The coordinator must start/inspect only an authorized local `npm run dev` server before the run, then execute exactly `npx playwright test --config=playwright.hero.config.ts e2e/evironn-hero-video-rollout.spec.ts e2e/evironn-home.spec.ts`; if the server or safe config cannot be confirmed, stop at test listing and report browser verification blocked. Expected authorized run: every selected scenario PASS with attached request/timing ledgers and desktop/mobile screenshots through Playwright's existing test attachments. Use `test.setTimeout(180_000)` for a multi-product matrix and bounded per-assertion waits of at most 50,000 ms for preparation; never extend production deadlines to make tests pass.
- [ ] Run `npx prettier --check e2e/evironn-hero-video-rollout.spec.ts e2e/evironn-home.spec.ts` and `npx eslint e2e/evironn-hero-video-rollout.spec.ts e2e/evironn-home.spec.ts`; expected no new errors. Review the bounded full pilot diff and reuse fresh unit/browser evidence. Verify headers, registries marked read-only, assets, and protected files are absent from the write/stage set. Proposed authorized commit: `test: verify hero preload pilot browser lifecycle`. No broad gate, build, deployment, or performance-improvement claim follows this task.

## Stop conditions, no-change outcomes, and handoff

- First dispatch one fresh isolated Sol Medium plan reviewer with the exact updated plan, baseline/evidence paths, Blob report, changed-path allowlist, and this scope. READY requires Critical 0 and Important 0. Root resolves confirmed blocking findings, writes the plan checkpoint commit containing only this plan, records its SHA as the immutable implementation baseline, then executes the four tasks sequentially. User has authorized continuation after READY; no second approval of this same scheme is required.
- At implementation start, the coordinator checks branch/worktree against the evidence without resetting, switching to stale `dev`, or overwriting intervening work. A changed overlapping baseline needs reconciliation before execution. Verify user Git identity before any later authorized commit; stage exact owned paths only.
- Reviews occur after each task at its owned risk boundary. Task 2 gets the resource-lifecycle review; Task 3 gets the interaction/accessibility review; Task 4 gets the final functional and CSP/same-origin review. Reviewers reuse current focused evidence. Remediation reruns affected tests only. No full completion gate is authorized by this plan.
- Valid no-change outcomes: already-correct asset inventory, registry entries, product phase helpers, codec selector, and CSP remain untouched. If a requested behavior already passes a genuine regression test, retain that code rather than refactoring it to match a preferred structure.
- If representative browsers cannot retain full Blobs/object URLs without replay HTTP fetches, visible playback stalls, asset changes, or extra transport/cache architecture, stop with a documented failed feasibility result for the coordinator. Do not weaken media readiness to a single incidental event, silently add another transport/cache architecture, or label an incomplete pilot successful. Leaving the baseline unpromoted is valid; removing an experimental candidate requires an explicit, scoped recovery instruction, never a destructive reset.
- Missing local browser runtime/authorized server, unverified runner side effects, out-of-scope failing tests, or exhausted bounded native preparation are reported as blockers with the exact affected case. No speculative provider, database, or configuration repair is permitted.
- Finish with four task outcomes, focused RED/GREEN commands/results, resource/request timing evidence, retained risks, changed-path/secret scan, local commit SHAs, and required user desktop/mobile visual acceptance. Coordinator may update only `.superpowers/sdd/progress.md`, `docs/roadmap/STATUS.md`, and the pilot delivery evidence report. Stop for user visual acceptance; never push, open PR, deploy, merge, or broaden the pilot to other rooms.
