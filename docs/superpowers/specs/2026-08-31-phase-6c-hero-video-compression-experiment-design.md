# Phase 6C Hero Video Compression Experiment Design

**Date:** 2026-08-31  
**Status:** Proposed for user review  
**Branch:** `phase/06-hardening-release`  
**Current baseline:** `9ed6ccae0b04591170d64aafe59e38293378537e`

## Goal

Determine a repeatable hero-transition video encoding profile that cuts transferred bytes by at least 50% while remaining visually indistinguishable from the current assets and preserving the existing interaction contract.

## Pilot assets

The pilot uses the two `terrace-sofa` transition assets from the fourth and final hero room, Terrace:

- `public/assets/hero/terrace-sofa-forward.mp4`: 1168 x 784, 24 FPS, 6.04 seconds, H.264 High, 9.48 MiB;
- `public/assets/hero/terrace-sofa-reverse.mp4`: 1168 x 784, 24 FPS, 6.04 seconds, H.264 High, 8.23 MiB.

The immutable originals remain available throughout the experiment. The pilot must not overwrite them or change production source references.

## Candidate strategies

### Optimized H.264 MP4

Create constant-quality H.264 candidates using a slow encoder preset, stripped audio, compatible 4:2:0 pixel format, and fast-start MP4 metadata. This is the maximum-compatibility and lowest-integration-cost option.

### VP9 WebM with H.264 fallback

Create VP9 WebM candidates and retain an optimized H.264 MP4 fallback. Modern browsers may choose the smaller WebM source while devices without suitable WebM support retain the broadly compatible MP4 path. This is the recommended delivery strategy if quality, decoding behavior, and byte reduction pass.

### AV1 WebM with H.264 fallback

Create AV1 WebM candidates to measure the best achievable compression. AV1 remains experimental for this interaction because older Apple devices lack universal hardware decode support and software decoding may add latency or power cost. AV1 is accepted only if browser playback evidence is as strong as VP9 and its size advantage is material.

## Encoding ladder

Generate a small deterministic quality ladder for both directions:

- H.264: CRF 18 and 20, `preset=slow`, `yuv420p`, no audio, MP4 fast start;
- VP9: constant-quality levels 24 and 28, deterministic two-pass encoding, `yuv420p`, no audio;
- AV1: constant-quality levels 24 and 28, deterministic high-quality encoding, `yuv420p`, no audio.

Every candidate must preserve 1168 x 784 dimensions, 24 FPS, 6.04-second timeline, frame order, and forward/reverse direction. Candidate filenames must be versioned or experiment-scoped and must not replace production paths.

## Objective acceptance

For each candidate and direction, record:

- exact byte size and percentage reduction from its matching original;
- codec, profile, dimensions, frame rate, duration, pixel format, and bitrate from `ffprobe`;
- VMAF, SSIM, and PSNR against the matching original after timestamp alignment;
- decode or playback failures;
- first-frame and transition readiness under the existing interaction flow.

A candidate remains eligible only when:

- VMAF is at least 95 for both forward and reverse;
- the combined forward/reverse byte size is at least 50% below the combined originals;
- duration and frame cadence remain aligned closely enough to preserve the existing progress, completion, and reverse-transition logic;
- no visible frame corruption, color shift, blocking, banding, dropped ending, or transition seam is found.

SSIM and PSNR are supporting diagnostics, not independent approval gates. VMAF and byte reduction cannot override a visible defect.

## Visual acceptance

Produce matched comparison evidence for each eligible strategy:

- synchronized original and candidate playback at normal speed;
- representative same-timestamp frame pairs from the beginning, high-motion middle, and end;
- forward to focus to reverse interaction playback;
- desktop and mobile viewport checks;
- reduced-motion and failed-media fallback confirmation after any future integration candidate exists.

The user selects the winning candidate only after reviewing the visual evidence. "No visible difference" is binding even when objective metrics pass.

## Experiment boundary

This experiment may create ignored evidence and candidate media in a dedicated workspace. It may add measurement scripts or tests only through a later approved executable plan. It must not:

- overwrite or delete original media;
- change `hero-products.ts`, `<video>` source order, preload behavior, or production UI;
- convert the remaining hero assets;
- push, deploy, open a pull request, merge, or mutate provider configuration;
- claim a site-performance improvement from file-size evidence alone.

## Follow-up decision

If one strategy passes all gates and receives user visual approval, a separate bounded integration decision will define source ordering, fallback behavior, versioned filenames, interaction tests, Preview measurements, and rollout to the remaining 14 hero transition files. If no candidate passes, production remains unchanged and the report records `NO_CHANGE`.
