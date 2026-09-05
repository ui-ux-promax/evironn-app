# Phase 6C Planning Brief — Performance and Resilience

**Status:** User-approved design on 2026-08-30. This brief authorizes planning evidence only. It does not authorize production implementation, commit, push, deployment, provider operation, database operation, or Phase 6D work.

## Objective

Measure the public Evironn Vercel deployment under a reproducible anonymous mobile protocol, identify the largest evidenced owner-local bottleneck on `/`, and produce one executable, portfolio-proportional Phase 6C plan. A no-change diagnosis is a valid outcome when evidence does not support a safe local change.

## Binding scope

- Repository: `D:\Projects\evironn`.
- Branch: `phase/06-hardening-release`.
- Planning start HEAD: `071807cba8e1c4cfb4185306e9534014107fe3e1` (`docs: approve phase 6c performance design`).
- Public target: `https://evironn-app.vercel.app/`.
- Optimization target: `/` only.
- Regression guardrails: `/catalog` and `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle`, selected from the public catalog without writes.
- Vercel Authentication is disabled by user. Public checks use no login, token, cookie inspection, credentials, environment values, or personal data.
- Phase 6A and 6B security, provider, payment, database, admin, and demo boundaries remain frozen contracts.
- Phase 6D owns production build, full gate, broad E2E, deployment, comparable public after-measurement, release documentation closeout, push, PR, merge, and deployed-performance claims.

## Planning-only prohibitions

Do not modify production code, tests, package files, lockfiles, Prisma/schema/migrations, workflows, Vercel/provider configuration, or protected untracked files. Do not run production build, full gate, broad E2E, deployment, push, PR, merge, provider/database mutations, or secret-bearing inspection. Do not add dependencies or paid services. Do not optimize `/catalog` or the PDP.

## Required evidence protocol

1. Record safe deployment/response metadata only: HTTP status, date, server, matched path, cache status, cache-control, encoding, transfer mode, stable public build/resource identifiers where exposed. Never retain `Set-Cookie` values or credential-bearing headers.
2. Treat the first request after idle as `cold candidate` only. Do not claim proven Vercel cold start without platform evidence.
3. Run at least three fresh mobile browser runs per route with identical tool, `390x844` viewport, throttling, location, and navigation protocol. Use unique query cache-busters only where needed to avoid route data mutation. Retain individual observations and median for comparable metrics.
4. Capture TTFB, FCP, LCP, CLS, INP or TBT, transfer bytes, request count, cache headers, and LCP owner/resource whenever the selected tool exposes them. Record unavailable fields and why; never substitute one score for missing evidence.
5. Separate likely server delay from browser/resource delay using response timing, route rendering/data-read ownership, resource counts/sizes, and LCP owner. Record uncertainty and incomparable/noisy samples.

## Candidate boundary

Current evidence points to one candidate family only: initial home media scheduling at existing home-media owners, especially inactive hero video elements rendered with `preload="auto"`. The planner must choose one narrow implementation boundary only if the final evidence supports it. The candidate must preserve accepted media quality, visual behavior, keyboard/touch interaction, reduced-motion behavior, accessibility, SEO, and Phase 6A/6B contracts. If browser evidence cannot establish a safe owner-local gain, the plan must execute a no-change diagnosis instead.

## Required plan contents

The executable plan must derive task count from evidence and include exact paths/owners, measurement and implementation boundaries, stable commands/conditions, raw and summary artifact paths, exact expected outputs, bite-sized TDD or characterization semantics, focused checks, review boundaries, commit ownership, changed-path allowlist/collector, protected-file checks, value-free secret scan, stop conditions, no-change execution, immutable implementation baseline based on the future commit containing approved Phase 6C planning artifacts, and explicit Phase 6D separation.
