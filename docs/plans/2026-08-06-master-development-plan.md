# Evironn Master Development Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Each phase has its own decision-complete specification, feature branch, review gate, and pull request.

**Goal:** Build a public Evironn furniture portfolio-storefront with the approved visual language, `fashion-shop` commerce scenarios, and a clean Next.js full-stack implementation.

**Architecture:** First deliver all storefront and admin prototypes as HTML/Vite pages using the canonical design system. Then migrate the approved prototype into Next.js and selectively port commerce/backend logic from `D:\Projects\fashion-shop`. The donor supplies architecture and business behavior only; its brand UI, demo admin, assets, documents, and Git history are excluded.

**Tech Stack:** HTML/CSS, Vite, React, TypeScript, Vitest, Playwright, Next.js, Prisma, and YooKassa sandbox.

## Global Constraints

- `D:\Projects\evironn-app` is the clean destination repository.
- `C:\Users\010726Admin\Downloads\prototypes-furni` remains a read-only archive.
- `D:\Projects\fashion-shop` is a backend/commerce donor only.
- `design-system.html` is the primary visual authority for new pages.
- Approved `/` and `/product` output is preserved; it is not redesigned for later uniformity.
- Only approved storefront/admin routes ship; `/demo-admin` is excluded.
- No new colors, radii, shadows, typography, or motion patterns without a phase specification.
- No public captures, prompts, generator artifacts, logs, screenshots, source maps, local absolute paths, or reference-site URLs.
- Public GitHub repository has no open-source license.
- English Conventional Commits, English branches, and English PR descriptions.
- Git author/committer comes from the user's Git config; no AI/tool attribution or co-author trailers.
- Real payments, multilingual support, loyalty, CRM, returns, restock workflows, automatic 360 generation, and screenshot regression tests are out of scope unless separately approved.

## Sources of Truth

1. `design-system.html` — tokens, components, interaction and accessibility patterns.
2. Approved home/product pages — actual brand application and visual baseline.
3. `D:\Projects\fashion-shop` — routes, business logic, data flow, and commerce scenarios only.

The design-system source is not copied into the public repository. Only cleaned tokens, component contracts, and approved assets are transferred.

## Routes

### Storefront

- `/`
- `/catalog`
- `/product/[slug]`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/profile`
- `/orders/[number]`
- `/blog`
- `/faq`
- `/legal/delivery`
- `/legal/privacy`
- `/legal/refund`
- `/legal/terms`
- `/unsubscribe`

No separate `/wishlist` route is created.

### Admin

- `/admin`
- product/category lists, create, and edit
- order list/detail
- customer list/detail
- coupon list/create/edit

`/demo-admin` is never implemented.

## Phase A — HTML Prototypes

Every phase is one feature branch and one PR. Each page has one production-intent variant; alternatives are limited to a specific unresolved interaction. Before implementation, create a decision-complete specification and bite-sized implementation plan.

### P0 — Clean-room extraction — complete

Approved home/product baseline, repository contracts, curated assets, browser gate, and public-tree audit.

References:

- [P0 specification](../specs/2026-08-06-p0-clean-room-extraction.md)
- [P0 implementation plan](2026-08-06-p0-clean-room-extraction.md)
- [Asset inventory](../asset-inventory.md)

### P1 — Design-system foundation

- Extract canonical semantic tokens from `design-system.html`.
- Create `prototypes/` Vite multi-page workspace.
- Implement shared header/footer, UI primitives, mock-data contract, and route index.
- Add automated checks rejecting ad-hoc color, radius, shadow, type, and motion values.
- Preserve approved home/product visual output.

### P2 — Catalog

- Categories, search, filters, sorting, pagination, and cards.
- Loading, empty, no-results, and error states.

### P3 — Cart

- Quantity changes, removal, wishlist action, promo code, totals, empty state, and errors.

### P4 — Checkout

- Contacts, address, delivery, sandbox payment, validation, and failure states.

### P5 — Auth

- Login, registration, email verification, OAuth, redirect, and error states.

### P6 — Profile

- User data, addresses, wishlist, orders, and logout.

### P7 — Order detail

- Items, immutable-looking snapshots, statuses, payment, cancellation, and failure states.

### P8 — Content/legal

- Blog listing, FAQ, delivery/privacy/refund/terms pages, and unsubscribe.

### P9 — Admin shell/dashboard

### P10 — Admin catalog lists

### P11 — Admin category editor

### P12 — Admin product core

### P13 — Admin variants/media/360°

### P14 — Admin orders

### P15 — Admin customers

### P16 — Admin coupons

### P17 — Prototype release

- Cross-route walkthrough.
- Design-system conformance audit.
- Responsive, accessibility, and cleanup review.
- Final visual approval by the user.

## Phase B — Next.js and Backend

`fashion-shop` code is ported selectively. Donor versions remain pinned during migration; dependency upgrades happen only after parity.

### F0 — Next.js platform baseline

### F1 — Furniture domain model

### F2 — Shared shell and homepage

### F3 — Product detail and 360°

### F4 — Catalog and search

### F5 — Cart and wishlist

### F6 — Auth and verification

### F7 — Checkout

### F8 — Orders and YooKassa sandbox

### F9 — Profile

### F10 — Reviews, newsletter, and content

### F11 — Admin shell/dashboard

### F12 — Admin categories/catalog

### F13 — Admin product core

### F14 — Admin variants/media/360°

### F15 — Admin orders

### F16 — Admin customers

### F17 — Admin coupons

### F18 — Security, accessibility, and performance hardening

### F19 — Portfolio release

## Domain Contracts

- `ProductOptionGroup` describes an option axis: upholstery, frame, size, or configuration.
- `ProductOptionValue` stores value, order, swatch, and media binding.
- `ProductVariant` is an SKU with price, stock, and option values.
- `ProductMedia` stores shared or option-dependent gallery media.
- `Product360Asset` stores WebM, poster, and metadata.
- An administrator assigns one showcase 360° product per category.
- Every active category has a valid showcase product at release.
- Cart API accepts only `variantId + quantity`.
- Server re-determines prices and stock on every cart/order operation.
- `OrderItem` stores an immutable snapshot of SKU, options, image, and price.
- Guest cart and wishlist merge after authentication.
- Checkout requires authorization.

## Quality Gates

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "build": "vite build / next build",
  "gate": "npm run format:check && npm run lint && npm run typecheck && npm run test",
  "gate:full": "npm run gate && npm run build && npm run test:e2e"
}
```

Additional requirements:

- `gate` is required before every commit.
- `gate:full` is required before phase closure and in GitHub Actions.
- A red required check blocks merge.
- Coverage is risk-based; no arbitrary global percentage threshold.
- Playwright checks 390×844, 820×1180, and 1440×900.
- Keyboard flow, focus-visible, reduced motion, console errors, and horizontal overflow are tested.
- Chromium runs every phase; Firefox/WebKit smoke runs at P17 and F19.
- Screenshot baselines are not stored.

## Git Workflow

- One English feature branch and PR per phase.
- Conventional Commit messages in English.
- PR sections: `Summary`, `User-visible changes`, `Validation`, `Risks/Follow-ups`.
- No AI/tool attribution or automatic co-author trailers.
- Public tree excludes captures, prompts, generators, handoff files, and service directories.
- The next phase starts only after the previous phase has a green gate, review, merge, and user approval.

## Definition of Done

### HTML milestone — after P17

- All routes and key states work on mock data.
- Every page conforms to `design-system.html`.
- Approved home/product pages remain visually preserved.
- Responsive, accessibility, and browser checks are green.
- User approves the result.

### Full-stack milestone — after F19

- Routes work on Prisma data.
- Guest cart/wishlist merge after login.
- Checkout is protected by authorization.
- YooKassa sandbox completes the payment flow.
- Orders retain immutable configuration snapshots.
- Admin controls the declared commerce scope.
- Deployment passes smoke, security, accessibility, and performance gates.

## Execution Rule

Before each phase:

1. Write the phase specification in `docs/specs`.
2. Write the phase implementation plan in `docs/plans`.
3. Create an isolated feature branch/worktree.
4. Write failing tests before implementation.
5. Implement in small commits.
6. Run focused tests, then `gate` and `gate:full`.
7. Run an independent spec/code review.
8. Fix Critical and Important findings and re-review.
9. Ask the user for visual approval where required.

Current next phase: **P1 — Design-system foundation**.
