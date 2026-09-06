# OTP cells and automatic verification

## Goal

Make the email-verification control match the storefront visual system and start verification as soon as all six digits have been entered.

## Approved interaction

- `OtpInput` displays six individually focused, rounded cells and remains the single source of typed/pasted digits for its parent.
- Entering or pasting the sixth digit starts the existing `verifyEmailCode` request automatically.
- The dedicated `Подтвердить` button is removed. The six cells become disabled while the request is in flight.
- A failed verification retains the existing error message and resets the code so the user can try again. A successful verification retains the existing redirect.

## Boundaries

- Reuse the existing server action, redirect, resend behavior, cooldown, and error mapping.
- Do not change the six-cell appearance, verification service, expiry, rate limits, or email delivery.
- Add a focused component assertion that no manual confirmation control is rendered and that a completed code invokes verification once.
