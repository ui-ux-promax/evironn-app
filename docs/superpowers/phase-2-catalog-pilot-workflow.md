# Phase 2 catalog pilot — historical workflow

## Scope

This document records the completed bounded catalog experiment. It is superseded by `docs/superpowers/full-frontend-migration-workflow.md` and authorizes no further work.

Tasks 1, 2, and 3 produced reusable canonical catalog/PDP logic. Their temporary visual presentation was not accepted as Evironn frontend delivery. Task 4 is cancelled in favor of Phase 2A/2B/2C.

The pilot covers only the approved catalog work selected by the planning agent from `docs/roadmap/ROADMAP.md` and the existing furniture catalog implementation. It must preserve the server-authority, normalized SKU, 360-media, and deferred-scope decisions in `docs/roadmap/DECISIONS.md`.

## Agent roles

- Root coordinator: Luna High. Owns sequencing, durable progress, verification, and final pilot report.
- Planner: fresh Sol Medium agent with isolated context. Inspects roadmap and relevant catalog code; writes executable task plan under `docs/superpowers/plans/`.
- Implementer: fresh Luna High agent per task. Receives only task brief, required interfaces, decisions, report path, and test commands. Uses TDD, focused verification, configured Git identity, and writes report.
- Task reviewer: fresh Sol Medium agent per task. Reviews generated task diff package for specification compliance and code quality.
- Final reviewer: one Sol High agent. Reviews only pilot merge-base-to-HEAD diff.

## Required sequence

1. Confirm Phase 1 merge, branch `phase/02-storefront`, and clean starting state.
2. Dispatch planner; review plan for conflicts before Task 1.
3. Execute tasks sequentially with fresh implementer, focused verification, task review, and remediation loop for Critical/Important findings.
4. Record completed tasks and review results in `.superpowers/sdd/progress.md`.
5. Dispatch final Sol High pilot-only review.
6. Run the Phase 2 quality gate and relevant catalog E2E scenarios.
7. Record invocations, review iterations, findings, failed checks, interventions, and model-limit readings in the final pilot report.
8. Stop for user desktop/mobile visual review. Do not start remaining storefront scope.

## Binding constraints

- One phase, one branch, bounded pilot only.
- No direct commits to `dev` or `main`.
- No architecture changes without focused brainstorming and an ADR update.
- New behavior follows TDD: failing test first, then minimal implementation.
- Server remains authoritative for SKU resolution, price, stock, and media selection.
- Catalog filters remain URL-driven and pagination server-side.
- Reduced motion and 360 poster/static fallback behavior remain required where applicable.
- Commits use English conventional messages and the configured user Git identity; no bot or AI trailers.
