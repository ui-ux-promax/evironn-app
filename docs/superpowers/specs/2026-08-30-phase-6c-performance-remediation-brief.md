# Phase 6C Primary Image Remediation Brief

## Status and gate

Planning only. No production code, tests, package/lockfile, schema, provider, database, deployment, public after-measurement, push, PR, merge, build, broad E2E, or Phase 6D action is authorized. Worktree branch is `phase/06-hardening-release`; planning baseline is `f2910e3378fa47117df86378aa5c8172ae2755e1`.

Protected untracked files remain untouched:

- `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` — `c9ac4d833e4f0aea2a474115f3aef58ffd04ef0c`
- `docs/superpowers/plans/phase-2-task-3-execution.md` — `acbeaf76e79ad2ae6dcb3541a306e6af7c80055e`

## Single candidate

Primary candidate is only `components/evironn/home/furniture-editorial-sections.tsx`. Exact change: add native `loading="lazy"` to two category `<img>` templates and one parallax `<img>` template, producing five below-fold editorial image nodes. No other production file or owner is eligible.

One focused test, `e2e/performance/furniture-editorial-lazy.spec.ts`, covers source invariants plus viewport entry for all five exact nodes. `/catalog` and selected PDP receive guardrail measurements only.

## Controlled local evidence

Use one controlled local before/after A/B against fresh `next dev` at `http://127.0.0.1:3106`: fresh anonymous Chromium contexts, service workers blocked, disabled cache, `390x844`, 4x CPU slowdown, 150 ms latency, 200000 B/s download, 93750 B/s upload, no interaction for metric runs, identical installed Playwright/Chromium. Capture three home runs before and after; three catalog and three selected-PDP guardrail runs before and after; fixed home screenshots and exact five-image request/DOM/readiness data.

Local `next dev` is controlled diagnostic A/B only. It is not production-like and cannot support a deployed or production-bundle performance claim. Vercel/public after-measurement remains later authorized scope.

## Retain/reject gate

Retain only when all six home runs are comparable; five-image group request starts reach metric endpoint with at least one fewer request and at least `50%` median reduction; one of FCP, observed LCP candidate, or TBT improves at least `10%`; other two do not regress over `10%`; fixed screenshots/DOM show no above-fold or hero-readiness regression; and catalog/PDP metrics TTFB, FCP, observed LCP candidate, TBT, CLS, and request starts show no median regression over `10%`.

Missing, non-finite, failed, incomparable, visual, performance, request, or guardrail evidence fails gate. Restore only primary owner to immutable baseline, preserve before/after evidence, write `PRIMARY_CANDIDATE_REJECTED`, stop candidate progression, complete closeout, then stop for user approval. Never write `NO_CHANGE` in newly generated remediation artifacts; preserve historical `NO_CHANGE` text in `docs/roadmap/STATUS.md`; never select a fallback candidate.

## Out of scope

No interactive cards, hero videos, Instagram, nature, benefits, editorial statement edits. No fallback ladder, seven-candidate delivery, attempt archives, multi-owner exclusions, owner-selection transitions, generic trace/ownership framework, production-like claim, Vercel/public after-measurement, build/gate, deploy, push, PR, merge, or Phase 6D.
