# Checkout profile phone persistence design

## Goal

When an authenticated customer successfully places an order, save the normalized checkout contact phone as the current phone in their profile. The most recently committed order replaces any previously stored profile phone.

## Scope

- Reuse the existing nullable `User.phone` field; no Prisma schema or migration change is required.
- Reuse the normalized `PlaceOrderInput.contactPhone` value, which is already validated and converted to the `+7XXXXXXXXXX` format.
- Keep checkout contact defaults unchanged: subsequent checkout visits continue to read `User.phone` through the existing checkout page DTO.
- Keep profile rendering unchanged: the profile already reads `User.phone`.
- Do not change contact name, email, guest behavior, payment-provider behavior, or address persistence.

## Transaction behavior

Update `User.phone` through the same serializable database transaction that reserves stock, creates the order, and removes the purchased cart lines. This provides one atomic outcome:

- if the order transaction commits, the profile contains the checkout phone;
- if any part of the order transaction fails or retries, no phone update from the failed attempt is persisted;
- concurrent successful orders follow database commit order, so the last committed order supplies the current profile phone.

The phone update is tied to the durable order transaction, not to the later payment-provider result. An online order whose durable transaction committed has supplied a valid customer contact phone even if payment initialization subsequently remains pending or requires recovery.

## Error handling

A failure to update the user row fails the order transaction and uses the existing sanitized order-placement error handling. No best-effort fallback is added because it could leave a committed order and stale profile phone.

## Verification

- Add a transaction-level regression test proving a successful placement writes the normalized checkout phone to the authenticated user.
- Add or retain rollback-path evidence proving failed placement does not produce a committed profile-phone update.
- Run the focused place-order suites, scoped formatting and lint checks, TypeScript checking because a transaction-client boundary changes, and `git diff --check`.
