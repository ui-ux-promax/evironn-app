# Phase 6C Performance and Resilience Design

**Status:** User-approved design on 2026-08-30. Planning and implementation remain separate approval gates.

## Goal

Measure the previously accepted slow first load of the public Evironn Vercel deployment, identify the dominant evidenced bottleneck, and produce one narrow portfolio-proportional optimization candidate without redesigning the application or claiming a deployed improvement before Phase 6D.

## Approved target and route scope

- Public baseline target: `https://evironn-app.vercel.app/`. A read-only HEAD request returned HTTP `200` on 2026-08-30.
- The user disabled Vercel Authentication for public deployment viewing. Phase 6C needs no Vercel login or token for read-only measurement.
- Primary route: `/`.
- Guardrail routes: `/catalog` and one currently reachable real product-detail route selected from the public catalog without creating or mutating data.
- Phase 6C optimizes only the primary route. Guardrail routes detect material regressions; they do not expand Phase 6C into a catalog or PDP optimization project.

## Measurement design

Use a reproducible evidence-first protocol rather than one Lighthouse score:

1. Record public deployment identity and response metadata without cookies, credentials, environment values, or personal data.
2. Capture one first-observed request after an idle interval as a **cold candidate**. Do not call it a proven Vercel cold start unless platform evidence proves that state.
3. Run at least three fresh-browser, cache-cleared mobile measurements for `/` under the same tool, viewport, throttling, and location. Use the median for comparison and retain the individual results.
4. Record at minimum TTFB, FCP, LCP, CLS, INP or TBT where the tool exposes it, transferred bytes, request count, cache headers, and the LCP resource or element.
5. Run the same bounded protocol for `/catalog` and one real PDP only as guardrails.
6. Separate likely server delay from browser/resource delay using response timing, cache status, request waterfall, bundle/resource sizes, and the LCP owner. Do not infer a cause from a score alone.

Public measurements are observational and may vary with Vercel region, load, network, and cache state. Store raw or summarized evidence without secrets and report uncertainty explicitly.

## Optimization decision rule

The planner must inventory the current route, data reads, cache/dynamic-rendering choices, fonts, hero media, client boundaries, scripts, and loading behavior before proposing changes.

- Change only the largest bottleneck supported by baseline evidence.
- Prefer an existing Next.js/React capability and owner-local change over a new dependency or performance framework.
- Preserve accepted Evironn visual design, responsive behavior, accessibility, SEO metadata/schema, authentication, business logic, provider behavior, and Phase 6A/6B security boundaries.
- Do not remove intentional hero/product media or degrade image quality merely to improve a synthetic score.
- Do not convert dynamic or personalized data to shared caching without proving that the data is public, non-user-specific, and safe to cache.
- Do not chase `100/100`, perform broad refactors, or optimize routes that baseline evidence does not implicate.
- If evidence shows no owner-local code bottleneck, Phase 6C may close with a diagnosis and no production change.

The primary success criterion is a material improvement in the evidenced dominant local/proxy metric with no functional or visual regression. Because Phase 6C does not deploy, it must not claim a percentage improvement on Vercel. Guardrail measurements or focused local proxies must show no regression greater than 10%; noise or incomparable measurements must be reported instead of forced into a pass claim.

## Verification and delivery boundary

Phase 6C owns:

- public read-only baseline measurement;
- compact current-state evidence;
- one narrow optimization candidate when evidence warrants it;
- focused tests for the changed owner boundary;
- touched-file formatting and bounded diff inspection;
- a bounded task review and one fresh final Sol Medium performance/functional/security review;
- durable progress and status updates;
- a stop for explicit user approval.

Phase 6D owns:

- the complete gate, production build, broad E2E, deployment, and deployed smoke;
- the first comparable public Vercel after-measurement on a deployment containing the Phase 6C candidate;
- the final claim about deployed performance improvement or lack of improvement;
- push, pull request, merge, release closeout, and final `dev` to `main` work.

Phase 6C must not push, deploy, mutate Vercel/GitHub/provider/database settings, run real provider or database operations, print secrets, or open a pull request. It must preserve the two protected untracked Phase 2 plan files.

## Planning requirements

The separate planning session must:

- use Luna High for evidence collection/coordinator work and fresh isolated Sol Medium for the plan and plan review;
- inspect the repository and public baseline before fixing task count or naming implementation files;
- distinguish measurement tasks from implementation tasks and avoid duplicating Phase 6D closeout;
- specify exact commands, stable measurement conditions, artifact locations, file ownership, focused tests, review boundaries, commits, stop conditions, and changed-path controls;
- make a no-change diagnosis an executable valid outcome;
- obtain one fresh Sol Medium plan review, resolve all Critical and Important findings, and stop for user approval before implementation.

## Stop conditions

Stop planning or implementation if measurement needs authentication, a deployment, environment/provider/database mutation, secret access, a new paid service, a broad architecture change, shared caching of user-specific data, visual degradation, or scope owned by Phase 6D. Record the finding and request explicit user direction.
