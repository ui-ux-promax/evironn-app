# Checkout Phone Mask Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Russian phone input mask to checkout while preserving the normalized `7XXXXXXXXXX` server contract.

**Architecture:** Keep formatting and normalization in a small pure helper under `lib/phone.ts`. The checkout primitive renders the formatted value and sends formatted edits to the existing controller; the controller normalizes the value immediately before client-side validation and `placeOrder`. The API and DTO remain unchanged.

**Tech Stack:** Next.js/React, TypeScript, Vitest, Testing Library, Zod.

## Global Constraints

- Display format is `+7 (___) ___-__-__`.
- Accept pasted values beginning with `8`, `7`, or `+7`, plus arbitrary separators.
- Quote and order requests receive `7XXXXXXXXXX` before server validation.
- Preserve existing invalid-phone copy and behavior.
- Do not change API, database, or profile-phone behavior.

---

### Task 1: Add pure phone formatting helpers

**Files:**
- Create: `lib/phone.ts`
- Test: `tests/phone.test.ts`

**Interfaces:**
- Produce `normalizeRuPhone(value: string): string`, returning digits in `7XXXXXXXXXX` form when input contains a Russian number.
- Produce `formatRuPhone(value: string): string`, returning an editing value in `+7 (___) ___-__-__` form.

- [ ] **Step 1: Write failing tests**

Cover empty input, local ten-digit input, `8` input, already-prefixed `+7` input, separators, and deletion of the final digit.

- [ ] **Step 2: Run the focused test and verify it fails**

Run `npx vitest run tests/phone.test.ts`.
Expected: FAIL because `lib/phone.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure helpers**

Strip non-digits, convert a leading `8` to `7`, preserve a leading `7`, cap at 11 digits, and build the display groups without changing unrelated input.

- [ ] **Step 4: Run the focused test and verify it passes**

Run `npx vitest run tests/phone.test.ts`.
Expected: all phone helper tests PASS.

- [ ] **Step 5: Commit**

Run `git add lib/phone.ts tests/phone.test.ts; git commit -m "feat: add russian phone formatter"`.

### Task 2: Integrate the mask into checkout

**Files:**
- Modify: `components/evironn/checkout/checkout-primitives.tsx`
- Modify: `components/evironn/checkout/use-checkout-variant-a.ts`
- Test: `tests/evironn-checkout-variant-a.test.tsx`

**Interfaces:**
- Consume `formatRuPhone` and `normalizeRuPhone` from `lib/phone.ts`.
- Preserve the existing `actions.setContactPhone(value: string)` controller interface and existing server DTOs.

- [ ] **Step 1: Add failing checkout integration assertions**

Assert that the phone field displays `+7 (923) 144-55-66` after a `+7`/separator input and that the mocked `placeOrder` payload contains `79231445566`.

- [ ] **Step 2: Run the focused checkout test and verify it fails**

Run `npx vitest run tests/evironn-checkout-variant-a.test.tsx`.
Expected: FAIL because checkout currently displays raw input and submits it unchanged.

- [ ] **Step 3: Wire formatting and submit normalization**

Render `formatRuPhone(form.contactPhone)`, pass `formatRuPhone(value)` to `actions.setContactPhone`, and set `contactPhone: normalizeRuPhone(contactPhone)` in the `PlaceOrderInput` payload.

- [ ] **Step 4: Run the focused checkout tests and verify they pass**

Run `npx vitest run tests/evironn-checkout-variant-a.test.tsx tests/checkout-dto.test.ts`.
Expected: all focused checkout and DTO tests PASS.

- [ ] **Step 5: Commit**

Run `git add components/evironn/checkout/checkout-primitives.tsx components/evironn/checkout/use-checkout-variant-a.ts tests/evironn-checkout-variant-a.test.tsx; git commit -m "feat: mask checkout phone input"`.

### Task 3: Verify the delivery

**Files:**
- Modify: `tests/evironn-checkout-source-contract.test.ts` only if the existing source contract needs an explicit formatter boundary assertion.

- [ ] **Step 1: Run focused regression tests**

Run `npx vitest run tests/phone.test.ts tests/evironn-checkout-variant-a.test.tsx tests/checkout-dto.test.ts`.
Expected: all tests PASS.

- [ ] **Step 2: Run type and formatting checks**

Run `npm run typecheck` and `npx prettier --check lib/phone.ts tests/phone.test.ts components/evironn/checkout/checkout-primitives.tsx components/evironn/checkout/use-checkout-variant-a.ts tests/evironn-checkout-variant-a.test.tsx`.
Expected: typecheck and formatting PASS.

- [ ] **Step 3: Inspect the final diff and status**

Run `git diff --check`, `git diff --stat`, and `git status --short --branch`.
Expected: no whitespace errors; only intended files changed; protected untracked plan files remain untouched.
