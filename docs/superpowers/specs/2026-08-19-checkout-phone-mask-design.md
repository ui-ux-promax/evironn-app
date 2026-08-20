# Checkout phone mask

## Goal

Make the checkout phone field easier to fill while preserving the existing server contract.

## Design

- Display Russian phone numbers as `+7 (___) ___-__-__` while editing.
- Accept pasted values beginning with `8`, `7`, or `+7`, plus arbitrary separators.
- Keep the controlled field value presentation-friendly; normalize it to `7XXXXXXXXXX` immediately before quote/order requests.
- Ignore non-digit characters and cap input at 11 phone digits.
- Keep the existing validation and error copy unchanged.

## Scope

- Add a small reusable formatter/normalizer for the checkout phone field.
- Wire it into the existing checkout primitive and submit path.
- Add focused tests for typing, paste normalization, backspace-safe formatting, and the existing server payload shape.
- No API, database, or unrelated profile-phone behavior changes.

## Acceptance

- Typing `9231445566` displays `+7 (923) 144-55-66`.
- Typing or pasting `8 (923) 144-55-66` produces the same display.
- Quote and order requests receive `79231445566`.
- Existing invalid-phone behavior remains intact.
