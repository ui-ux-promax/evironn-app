# Profile password button spacing

## Context

The profile password form renders the `Изменить пароль` submit button immediately after the repeat-password field. The button currently has no dedicated top spacing, so it visually touches the last input.

## Goal

Create a clear 16px vertical gap between the final password field and the submit button.

## Design

Apply `margin-top: 16px` to the existing password-form submit button selector in `styles/evironn/ProfilePage.css`. Keep the current button width, height, alignment, typography, validation behavior, and form submission logic unchanged. Scope the adjustment to the password form button so profile save controls and other buttons are unaffected.

## Acceptance criteria

- The password submit button has a 16px top margin from the final password field.
- No other profile form controls change size, position, or behavior.
- A focused source-contract test protects the selector and spacing declaration.
- Prettier and the focused profile tests pass.

## Non-goals

- No changes to password validation or server actions.
- No profile layout redesign.
- No changes to the shared footer or page-level spacing.
