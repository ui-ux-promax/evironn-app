# Architecture decisions

## ADR-001 — foundation reuse

Reuse `fashion-shop` as the production foundation. Preserve stable platform, commerce, payment, security, CI, and operations code unless the furniture domain requires change. Do not reimplement proven behavior without a concrete incompatibility.

## ADR-002 — source and target boundaries

`D:\Новая папка (2)\evironn-clone` is the read-only normative frontend implementation source for visual composition, copy, interactions, responsive behavior, CSS, media behavior, and selected route variants. `D:\Projects\fashion-shop` is the read-only technical source for reusable platform behavior. All production edits occur in `D:\Projects\evironn`.

## ADR-003 — branch model

`main` is accepted release state. `dev` is phase integration state. Work occurs only on named phase branches after Bootstrap. Phase and release pull requests use merge commits; squash and rebase merges are forbidden.

## ADR-004 — furniture variants

Furniture products use normalized option groups and values. Sellable SKUs reference selected values and own canonical combination key, unique article number, price, optional old price, stock, active state, and media overrides. Combination-key generation must be deterministic and tested.

## ADR-005 — immutable order history

Order items store snapshots of the purchased SKU, selected configuration, image, unit price, and totals. Later catalog edits must not alter historical orders.

## ADR-006 — 360 media

A category may feature at most one 360 product. MVP accepts turntable video with poster and static fallback; no frame-sequence viewer. Admin validation enforces the media contract.

## ADR-007 — server authority

The server owns SKU resolution, stock, prices, coupons, delivery/service rates, order totals, payment state, and review eligibility. Client values are display/input only.

## ADR-008 — demo isolation

`/demo-admin` remains public and read-only, uses synthetic fixtures, never reads Prisma, and exposes no mutations. `/admin` requires the ADMIN role.

## ADR-009 — deferred scope

Blog, newsletter, FAQ, and legal content routes are outside MVP. Reintroduction requires a new approved scope decision.

## ADR-010 — architecture changes

Approved phase requirements are executed without repeating discovery. Any new architecture choice pauses implementation, runs a focused brainstorming workflow, and updates this file before code resumes.

## ADR-011 — furniture schema cutover compatibility

Phase 1 makes `Category`, `Room`, `Product`, `OptionGroup`, `OptionValue`, `Sku`, normalized SKU selections, and product/SKU media the canonical furniture catalog. Legacy `ProductColorway`/`ProductVariant` relations remain as a typed compatibility adapter for inherited storefront and operational paths until Phase 2 rewires those reads and writes. New furniture seed data writes only canonical tables; order items keep nullable live SKU references while storing immutable article, combination, configuration, image, and pricing snapshots.

## ADR-012 — source port before redesign

Existing production clone interfaces are ported before any visual redesign. Preserve selected JSX structure, class names, CSS, motion, media behavior, copy, and responsive states by default. Tailwind remains available for new adapters and foundation-only UI, but converting proven clone CSS to Tailwind is not a migration goal. `framer-motion` and `react-icons` are reused where already required. Any material visual reinterpretation needs explicit user approval.

## ADR-013 — staged UI and data adaptation

Each route uses a Next Server Page or server module to produce a serializable Evironn DTO for the ported interactive shell. Server authority from ADR-007 remains unchanged. Phase 2 proceeds in order: shared shell and complete home, selected catalog B over Task 2 logic, exact showcase PDP over Task 3 logic. Until product-specific media packs are validated, all catalog cards target one showcase slug and non-showcase PDP routes redirect there. The showcase add-to-cart control remains decorative until Phase 3.

## ADR-014 — proportional verification cadence

Implementation tasks use the smallest verification set that proves the changed behavior: focused tests, checks for touched files, and critical task-level E2E only when necessary. Full formatting, lint, type checking, Vitest, production build, and current-delivery E2E run once after all tasks in the phase or acceptance-gated delivery are complete. Reviewers reuse valid focused evidence and do not rerun the complete project gate without a concrete cross-cutting risk. Final-review remediation reruns affected checks; the complete gate is repeated only when that remediation invalidates prior evidence or changes a cross-cutting surface.
