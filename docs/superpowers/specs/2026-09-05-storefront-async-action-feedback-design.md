# Storefront async action feedback design

## Goal

Give every user-triggered storefront mutation immediate, consistent feedback while its asynchronous work is in flight. The active control shows the existing Evironn `FadeArc` spinner next to its label, or in place of its icon for icon-only controls, and prevents duplicate activation until the operation settles.

## Scope

Included surfaces are the public/customer-facing storefront only:

- catalog and product wishlist actions;
- product add-to-cart actions, including both PDP placements;
- cart quantity, removal, promo-code, and related mutation controls;
- checkout quote-changing mutations and final order placement;
- login, registration, email verification, resend, Google sign-in where the client can observe pending state, and logout;
- profile details, password, addresses, favorite removal, and add-favorite-to-cart actions;
- review submission;
- order synchronization and cancellation actions.

The implementation inventory must include every storefront control that starts a server action, API request, asynchronous store mutation, authentication request, or route refresh coupled to a mutation. Admin and demo-admin controls are excluded.

Also excluded are ordinary navigation, catalog filters, search navigation, accordions, dialogs, local media controls, local-only toggles, and other interactions that do not wait for asynchronous server or persistence work.

## Interaction contract

Each included action follows the same contract:

1. Pending state begins synchronously when the accepted interaction starts.
2. The active control becomes disabled and exposes `aria-busy="true"`.
3. A `FadeArc` spinner is visible for the full pending interval.
4. Text controls retain a readable label beside the spinner. Existing useful progress copy such as `Входим…` or `Сохраняем…` remains in use; otherwise the normal action label remains visible.
5. Icon-only controls replace the action icon with a size-matched spinner without changing the control's dimensions or accessible name.
6. Duplicate activation is ignored while pending.
7. Pending state clears after success or failure unless successful navigation unmounts the control first.
8. Existing validation, optimistic updates, rollback, error messages, focus behavior, and success navigation remain unchanged.

Only the active operation receives a spinner. Other controls may be disabled without a spinner when they must be locked to protect an in-flight transaction, for example checkout inputs while order placement is running. Where a list supports independent row actions, pending identity should remain item-specific rather than blocking every row.

## Design-system integration

`components/loading-ui/fade-arc.tsx` is the single visual spinner source. No second spinner animation or icon library loader is introduced.

The storefront `components/ui/button.tsx` loading contract is adjusted to render `FadeArc` and preserve its children beside the spinner. It also exposes the busy state accessibly. Existing storefront consumers of `loading` inherit this behavior.

Custom Evironn controls keep their accepted class names, DOM structure where required by scoped CSS, dimensions, and visual variants. They receive the same `FadeArc` through a small presentational loading pattern rather than being broadly migrated to the generic `Button`. This avoids unrelated layout and styling changes.

Admin `Button` and admin controls are not modified.

## State ownership

Pending state remains at the narrowest owner that already controls the asynchronous operation:

- existing `isSubmitting`, `busy`, `pending`, transition, or store state is reused when it accurately covers the full request lifetime;
- row-specific actions use an operation identifier when different rows may act independently;
- controls without observable pending state gain the smallest local state or form-status adapter needed to cover the action;
- shared global loading state is not introduced.

The visual layer does not infer network activity. Components receive or own an explicit boolean pending state, making duplicate-prevention and tests deterministic.

## Accessibility and motion

- Pending text controls use native `disabled` where supported and set `aria-busy` from the real pending state.
- Icon-only controls retain their existing `aria-label` while the visual icon is replaced.
- Spinners are decorative with `aria-hidden="true"`; status and error announcements continue through existing live regions.
- `FadeArc` retains its design-system reduced-motion behavior, which stops rotation when reduced motion is requested.
- Loading content must not change button width unexpectedly. Existing fixed-size icon controls remain fixed; important text CTA dimensions should remain stable through their current CSS or a local minimum-size treatment only where evidence requires it.

## Error handling

No server contract or error copy changes are part of this work. `try/finally`, transition completion, form state, or the existing mutation store must clear pending state on failure. Optimistic wishlist/cart behavior keeps its current rollback rules. A failed action restores the normal icon or label and leaves the existing error feedback visible.

## Verification strategy

Implementation follows test-driven development.

Focused component tests first prove:

- the shared storefront `Button` renders `FadeArc`, label content, disabled state, and `aria-busy` while loading;
- representative text CTA controls show spinner and label for the complete pending interval;
- representative icon-only and row-specific controls replace only the active icon and do not block unrelated rows;
- duplicate activation is prevented;
- pending UI clears after both resolved and rejected operations;
- existing error and optimistic rollback behavior remains intact.

The implementation then runs the smallest existing storefront suites covering each changed owner, scoped formatting/lint for touched files, and `git diff --check`. Typecheck is required only if a shared TypeScript contract changes. No admin tests, full repository gate, build, broad E2E, deployment, provider operation, database operation, push, PR, or merge belongs to this bounded implementation unless separately authorized.

## Non-goals

- Redesigning buttons or changing accepted storefront styling.
- Converting every custom button to one abstraction.
- Adding route-transition spinners to navigation-only controls.
- Adding skeletons, global progress bars, toast redesigns, or new loading copy.
- Changing admin or demo-admin behavior.
- Changing mutation, API, database, authentication, payment, or provider contracts.
