# Full Evironn frontend migration workflow

## Authority

Binding design: `docs/superpowers/specs/2026-08-12-full-frontend-migration-design.md`.

`evironn-clone` is the read-only normative frontend implementation source. `evironn` is the only production target. Existing Task 2/3 canonical server logic must be reused; inherited RITM presentation may be replaced.

## Delivery order

1. Phase 2A: Evironn tokens, fonts, header, footer, not-found page, and complete home.
2. User desktop/mobile visual acceptance.
3. Phase 2B: selected catalog B over existing canonical catalog logic.
4. User desktop/mobile visual acceptance.
5. Phase 2C: exact showcase PDP over existing canonical product logic.
6. User desktop/mobile, six-combination, and 360 acceptance.
7. Full Phase 2 quality gate, final review, push, English PR to `dev`, merge commit after acceptance.

No delivery starts before its predecessor is accepted. One phase branch remains `phase/02-storefront`; durable plans, reports, and status prevent context loss across sessions.

## Agent workflow per delivery

1. Coordinator reads `AGENTS.md`, roadmap, status, decisions, approved design, current delivery plan, Git status, branch, and recent commits.
2. Planner verifies source/target paths and produces or amends a task-level plan. It may not redesign clone UI.
3. Fresh implementer handles one task using TDD and records exact checks and changed files.
4. Fresh reviewer checks only that task diff for specification compliance, visual-source drift, regressions, and code quality.
5. Critical/Important findings return to the same implementer. Review repeats until none remain.
6. Coordinator runs focused checks, updates durable progress, then dispatches next task.
7. Final reviewer inspects delivery-base-to-HEAD diff. Coordinator runs full delivery gate.
8. Vercel Preview is presented to user. User visual acceptance is mandatory.

Use configured Git identity only. Commits are English conventional commits without AI/bot/co-author trailers. No push, PR, merge, branch deletion, or next delivery without explicit workflow authorization.

## Binding implementation rules

- Preserve clone composition, copy, interactions, class names, CSS, motion, media behavior, and responsive states.
- Adapt only Next routing/rendering, server/client boundaries, metadata, and production data/authorization interfaces.
- Client Components receive serializable DTOs. Prisma, auth, price, stock, SKU, coupon, delivery, payment, role, and review decisions stay server-side.
- Keep clone pure state helpers and port relevant tests.
- Copy only assets referenced by selected production components. Verify existence, size, dimensions/duration, and Git host limits.
- Do not copy Vite routing, mock commerce state, variant picker pages, generated previews, logs, `dist`, or entire asset archive.
- Do not rewrite clone CSS into Tailwind without a concrete incompatibility and explicit decision.
- No architecture change without focused brainstorming and `DECISIONS.md` update.

## Visual gate

Compare clone and Next at desktop and mobile widths. Verify header/drawer, every home section, footer, reduced motion, keyboard focus, responsive content, and media fallbacks for Phase 2A. Later deliveries add catalog states and PDP/360 states defined by the approved design.

Automated success never substitutes for user visual acceptance.
