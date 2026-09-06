# OTP Automatic Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the manual confirmation control from email verification while preserving automatic validation after six OTP digits.

**Architecture:** `VerificationGate` already owns the OTP value and observes a six-character code to call `verifyEmailCode`. Remove only the redundant button and cover the user-visible contract in the existing jsdom component suite. The existing `OtpInput` remains unchanged.

**Tech Stack:** React, TypeScript, Vitest, Testing Library.

## Global Constraints

- Keep the existing six rounded OTP cells and paste behavior unchanged.
- Keep the existing automatic `verifyEmailCode({ code })` invocation, errors, redirect, resend cooldown, and loading lock unchanged.
- Do not change server actions or verification-service behavior.

---

### Task 1: Remove the redundant confirmation action

**Files:** `tests/verification-gate-loading.test.tsx`, `components/shared/auth/verification-gate.tsx`

**Interfaces:** Filling the sixth OTP cell invokes `verifyEmailCode({ code })` once, and the dialog has no `Подтвердить` button.

- [ ] Add a failing jsdom test that enters `123456`, expects one verification request, and expects no button named `Подтвердить`.
- [ ] Run `npm test -- tests/verification-gate-loading.test.tsx` and observe it fail only because the button exists.
- [ ] Remove the `Button` import and JSX from `VerificationGate`; preserve the existing six-digit effect.
- [ ] Re-run the focused test, Prettier, ESLint, and `git diff --check` for the two changed code/test files.
