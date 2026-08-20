# Architecture decisions

## ADR-001 — foundation reuse

Reuse `fashion-shop` as the production foundation. Preserve stable platform, commerce, payment, security, CI, and operations code unless the furniture domain requires change. Do not reimplement proven behavior without a concrete incompatibility.

## ADR-002 — source and target boundaries

`D:\Новая папка (2)\evironn-clone` is a read-only design archive. `D:\Projects\fashion-shop` is the read-only technical source. All production edits occur in `D:\Projects\evironn`.

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
