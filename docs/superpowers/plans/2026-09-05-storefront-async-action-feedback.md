# Storefront Async Action Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Evironn `FadeArc` spinner, disabled behavior, and accessible busy state to every reachable customer-facing asynchronous action without changing server contracts or accepted storefront styling.

**Architecture:** Reuse `components/loading-ui/fade-arc.tsx` as the only spinner implementation. Extend the existing storefront button/form primitives, then wire explicit operation-local pending state into custom Evironn controls; keep admin code untouched and preserve every mutation's current validation, optimistic update, rollback, error, and navigation behavior.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zustand, Auth.js, Vitest, Testing Library, Tailwind CSS, scoped Evironn CSS.

## Global Constraints

- Scope is limited to the public/customer storefront; do not modify `/admin` or `/demo-admin`.
- Include text and icon-only controls that start a server action, API request, asynchronous store mutation, authentication request, or mutation-coupled refresh.
- Exclude navigation, filters, search navigation, accordions, dialogs, local media controls, and local-only toggles.
- Use `FadeArc` exclusively; do not add another spinner implementation or dependency.
- Text controls retain a readable label beside the spinner; icon-only controls replace only their icon and keep dimensions and accessible name.
- Pending begins synchronously, sets native `disabled` and `aria-busy="true"`, rejects duplicate activation, and clears on both success and failure unless navigation unmounts the control.
- Preserve existing server/API/database/auth/payment/provider contracts, error copy, optimistic behavior, rollback, focus, and success navigation.
- Preserve the user's untracked files and unrelated changes. Stage and commit only paths owned by the current task.
- Follow RED/GREEN TDD for every behavior task. Run focused tests during tasks; do not run the full gate, production build, broad E2E, deploy, push, PR, merge, database operation, or provider operation.

## Reachable storefront inventory

| Surface                  | Reachable owner                                                                  | Async controls covered                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Shared primitives        | `components/ui/button.tsx`, `components/evironn/forms/form-primitives.tsx`       | Existing `loading` buttons and Evironn submit buttons                                                         |
| Auth routes              | `components/evironn/auth/auth-variant-b*.tsx`                                    | Login, registration, verification, resend, Google sign-in                                                     |
| Global verification gate | `components/shared/auth/verification-gate.tsx`                                   | Verify and resend                                                                                             |
| Catalog                  | `components/evironn/catalog/catalog-card.tsx`                                    | Per-card wishlist heart                                                                                       |
| PDP                      | `components/evironn/product/ProductPage.tsx`                                     | Both add-to-cart placements                                                                                   |
| Cart                     | `components/evironn/cart/*`                                                      | Clear, quantity −/+/input, save to wishlist, remove, promo apply, related add-to-cart, related wishlist, undo |
| Checkout                 | `components/evironn/checkout/*`                                                  | Quantity −/+/input, remove, final order placement                                                             |
| Order                    | `components/evironn/order/*`, `components/shared/orders/cancel-order-button.tsx` | Payment resync and confirmed cancellation                                                                     |
| Review                   | `components/shared/product/review-form.tsx`                                      | Review submission through shared `Button`                                                                     |
| Profile                  | `components/evironn/profile/*`                                                   | Favorite add/remove, profile, password, address add/default/delete, logout                                    |

Legacy `AuthCard`, `LoginForm`, `RegisterForm`, `GoogleButton`, `AuthNav`, `CartLineItem`, `WishlistHeart`, and `ProductCard` are not reachable from current storefront routes, except `VerificationGateHost` and its `VerificationGate`. Do not edit unreachable legacy owners in this delivery.

---

### Task 1: Unify storefront loading primitives on FadeArc

**Files:**

- Create: `tests/storefront-button-loading.test.tsx`
- Modify: `components/ui/button.tsx`
- Modify: `components/evironn/forms/form-primitives.tsx`
- Modify: `styles/evironn/FormPrimitives.css`
- Modify: `styles/evironn/CheckoutPrimitives.css`

**Interfaces:**

- Consumes: `FadeArc({ className, ...svgProps })` from `components/loading-ui/fade-arc.tsx`.
- Produces: `ButtonProps.loading?: boolean` rendering spinner plus children and `SubmitButton({ status, disabled, label, sendingLabel })` rendering the same spinner.

- [ ] **Step 1: Write the shared primitive RED tests**

Create `tests/storefront-button-loading.test.tsx` with two tests:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/evironn/forms/form-primitives';

afterEach(cleanup);

describe('storefront async action primitives', () => {
  it('keeps Button text beside the design-system spinner while busy', () => {
    render(<Button loading>Сохранить</Button>);
    const button = screen.getByRole('button', { name: 'Сохранить' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveTextContent('Сохранить');
  });

  it('uses FadeArc with progress copy in the Evironn submit primitive', () => {
    render(<SubmitButton status="sending" disabled={false} label="Войти" sendingLabel="Входим…" />);
    const button = screen.getByRole('button', { name: 'Входим…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/storefront-button-loading.test.tsx`

Expected: FAIL because `Button` removes its label while loading and `SubmitButton` still renders the CSS border spinner.

- [ ] **Step 3: Implement the minimal primitive changes**

In `components/ui/button.tsx`, replace `Loader2` with `FadeArc`, add the real busy attribute, and preserve children:

```tsx
import { FadeArc } from '@/components/loading-ui/fade-arc';

<Comp
  ref={ref}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  className={cn(buttonVariants({ variant, size }), className)}
  {...props}
>
  {loading && <FadeArc className="h-5 w-5 shrink-0" aria-hidden="true" />}
  {children}
</Comp>;
```

In `components/evironn/forms/form-primitives.tsx`, import `FadeArc` and replace the `chk-submit__spin` span:

```tsx
{
  sending && <FadeArc className="h-4 w-4 shrink-0" aria-hidden="true" />;
}
{
  sending ? sendingLabel : label;
}
```

Delete only the now-unused `.chk-submit__spin`, `.chk-submit--dark .chk-submit__spin`, and `@keyframes chk-spin` rules from both Evironn primitive stylesheets. Keep all submit layout, color, disabled, and `is-sending` rules.

- [ ] **Step 4: Run GREEN and scoped style checks**

Run: `npx vitest run tests/storefront-button-loading.test.tsx`

Expected: 1 file passes, 2 tests pass.

Run: `npx prettier --check components/ui/button.tsx components/evironn/forms/form-primitives.tsx styles/evironn/FormPrimitives.css styles/evironn/CheckoutPrimitives.css tests/storefront-button-loading.test.tsx`

Expected: exit 0.

- [ ] **Step 5: Commit Task 1**

```powershell
git add -- components/ui/button.tsx components/evironn/forms/form-primitives.tsx styles/evironn/FormPrimitives.css styles/evironn/CheckoutPrimitives.css tests/storefront-button-loading.test.tsx
git commit -m "feat: unify storefront action spinners"
```

---

### Task 2: Cover authentication and verification actions

**Files:**

- Modify: `components/evironn/auth/auth-variant-b.tsx`
- Modify: `components/evironn/auth/auth-variant-b-controller.tsx`
- Modify: `components/shared/auth/verification-gate.tsx`
- Modify: `tests/evironn-auth-variant-b.test.tsx`
- Create: `tests/verification-gate-loading.test.tsx`

**Interfaces:**

- Consumes: Task 1 `SubmitButton` and `FadeArc`.
- Produces: `AuthVariantBProps.oauthBusy: boolean`; independent `busy`, `resendBusy`, and `oauthBusy` visual states; verification-gate `resendBusy` state.

- [ ] **Step 1: Add RED coverage for credentials, resend, Google, and gate resend**

Extend `tests/evironn-auth-variant-b.test.tsx` with deferred promises that assert login/registration submit shows an SVG plus progress text, resend shows `FadeArc` and is disabled, and Google shows `FadeArc`, retains `Google`, has `aria-busy="true"`, and rejects a second click.

Create `tests/verification-gate-loading.test.tsx` using a deferred `resendVerificationCode` mock. Render `VerificationGate`, click `Отправить код снова`, and assert:

```tsx
const resend = screen.getByRole('button', { name: 'Отправляем код…' });
expect(resend).toBeDisabled();
expect(resend).toHaveAttribute('aria-busy', 'true');
expect(resend.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
fireEvent.click(resend);
expect(resendVerificationCodeMock).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/evironn-auth-variant-b.test.tsx tests/verification-gate-loading.test.tsx`

Expected: FAIL on missing OAuth/gate busy state and non-FadeArc resend markup.

- [ ] **Step 3: Implement operation-local auth state**

Add `oauthBusy` to `AuthVariantBProps`. In the controller, use a guarded async handler:

```tsx
const [oauthBusy, setOauthBusy] = useState(false);
const onGoogle = async () => {
  if (oauthBusy || busy) return;
  setOauthBusy(true);
  setError(null);
  try {
    await signIn('google', { redirectTo: safeCallback });
  } catch {
    setError('Не удалось войти через Google');
  } finally {
    setOauthBusy(false);
  }
};
```

Pass `oauthBusy` and `onGoogle={() => void onGoogle()}`. In `AuthVariantB`, disable Google while `busy || oauthBusy`, set `aria-busy`, and render `FadeArc` in place of `FiMail` while keeping `Google`. For resend, render `FadeArc` in place of `FiRefreshCw` while keeping `Отправляем код…`.

In `VerificationGate`, make the existing verify submission use `try/catch/finally` so a rejected action clears `submitting` and shows the existing generic verification error. Add `resendBusy`, guard duplicate resend, wrap resend in `try/catch/finally`, disable while cooldown/submitting/resending, set `aria-busy`, and render:

```tsx
{
  resendBusy && <FadeArc className="h-4 w-4 shrink-0" aria-hidden="true" />;
}
{
  resendBusy ? 'Отправляем код…' : cooldown > 0 ? `Отправить снова через ${cooldown}с` : 'Отправить код снова';
}
```

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run tests/evironn-auth-variant-b.test.tsx tests/verification-gate-loading.test.tsx tests/storefront-button-loading.test.tsx`

Expected: all listed files pass.

- [ ] **Step 5: Commit Task 2**

```powershell
git add -- components/evironn/auth/auth-variant-b.tsx components/evironn/auth/auth-variant-b-controller.tsx components/shared/auth/verification-gate.tsx tests/evironn-auth-variant-b.test.tsx tests/verification-gate-loading.test.tsx
git commit -m "feat: show authentication action progress"
```

---

### Task 3: Cover catalog wishlist and PDP cart actions

**Files:**

- Modify: `components/evironn/catalog/catalog-card.tsx`
- Modify: `components/evironn/product/ProductPage.tsx`
- Modify only if sizing evidence requires it: `styles/evironn/ProductPage.next.css`
- Modify: `tests/evironn-catalog-card.test.tsx`
- Modify: `tests/evironn-product-cart.test.tsx`

**Interfaces:**

- Consumes: `FadeArc`.
- Produces: per-card `wishlistPending` spinner and shared PDP `isAddingToCart` spinner in both visible placements.

- [ ] **Step 1: Add catalog and PDP RED tests**

Use deferred mutation promises. In the catalog test, click one heart and assert that heart alone is disabled, has `aria-busy="true"`, shows an SVG spinner, and a second click does not call the mutation twice. Resolve and reject in separate assertions to prove restoration.

In the PDP test, click `Добавить в корзину` and assert every currently rendered add control sharing the same mutation is disabled and busy, while the activated text remains visible beside `FadeArc`; reject once and assert controls return enabled and the existing error remains visible.

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/evironn-catalog-card.test.tsx tests/evironn-product-cart.test.tsx`

Expected: FAIL because pending controls do not render `FadeArc` and the catalog heart lacks `aria-busy`.

- [ ] **Step 3: Implement custom-control feedback**

In `CatalogCard`, set `aria-busy={wishlistPending || undefined}` and replace only the heart icon while pending:

```tsx
{
  wishlistPending ? <FadeArc className="h-[18px] w-[18px]" aria-hidden="true" /> : <FiHeart aria-hidden="true" />;
}
```

In both PDP add buttons, preserve `Добавить в корзину`, render a 16–18px `FadeArc` before the label while `isAddingToCart`, and hide only the decorative arrow during pending. Keep the existing shared state, guard, `disabled`, `aria-busy`, stock condition, errors, and animation props.

- [ ] **Step 4: Run GREEN and touched CSS proof**

Run: `npx vitest run tests/evironn-catalog-card.test.tsx tests/evironn-catalog-wishlist.test.tsx tests/evironn-product-cart.test.tsx`

Expected: all listed files pass.

If CSS changed, run: `npx prettier --check styles/evironn/ProductPage.next.css`.

- [ ] **Step 5: Commit Task 3**

```powershell
git add -- components/evironn/catalog/catalog-card.tsx components/evironn/product/ProductPage.tsx tests/evironn-catalog-card.test.tsx tests/evironn-product-cart.test.tsx
if (Test-Path styles/evironn/ProductPage.next.css) { git add -- styles/evironn/ProductPage.next.css }
git commit -m "feat: show catalog and product action progress"
```

---

### Task 4: Add item-specific pending feedback throughout the cart

**Files:**

- Modify: `components/evironn/cart/use-cart-variant-a.ts`
- Modify: `components/evironn/cart/cart-variant-a.tsx`
- Modify: `components/evironn/cart/cart-primitives.tsx`
- Modify only when required for fixed dimensions: `styles/evironn/CartVariantA.css`
- Modify only when required for fixed dimensions: `styles/evironn/CartPrimitives.css`
- Modify: `tests/evironn-cart-variant-a.test.tsx`

**Interfaces:**

- Produces: `pendingActions: ReadonlySet<string>` from `useCartVariantA`.
- Key format: `clear`, `undo`, `line:<itemId>:decrement`, `line:<itemId>:increment`, `line:<itemId>:input`, `line:<itemId>:wishlist`, `line:<itemId>:remove`, `related:<skuId>:add`.
- Extends `QtyStepper` with `pending?: 'decrement' | 'increment' | 'input' | null`.

- [ ] **Step 1: Write RED tests for independent cart actions**

Add deferred-promise tests covering one quantity decrement, one line removal, clear, undo, save-to-wishlist, related add-to-cart, and promo apply. Assert the activated control alone shows `FadeArc`, is disabled/busy, retains text where applicable, and rejects duplicate clicks. Assert another row is not visually marked busy. Resolve/reject each deferred promise and assert restoration plus existing error/rollback behavior.

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/evironn-cart-variant-a.test.tsx`

Expected: FAIL because only promo/cart-loading currently expose spinners and line mutations have no identity.

- [ ] **Step 3: Add pending-key ownership to the hook**

Add a set state and a wrapper that always clears its exact key:

```tsx
const [pendingActions, setPendingActions] = useState<ReadonlySet<string>>(() => new Set());
const pendingActionsRef = useRef(new Set<string>());
const runPending = useCallback(async <T,>(key: string, operation: () => Promise<T>): Promise<T> => {
  if (pendingActionsRef.current.has(key)) throw new Error('ACTION_PENDING');
  pendingActionsRef.current.add(key);
  setPendingActions(new Set(pendingActionsRef.current));
  try {
    return await operation();
  } finally {
    pendingActionsRef.current.delete(key);
    setPendingActions(new Set(pendingActionsRef.current));
  }
}, []);
```

Wrap each owned action using the exact keys above and return `pendingActions`. Keep `promoPending` as its existing dedicated state. Do not surface `ACTION_PENDING` to users: event handlers already guard with `pendingActions.has(key)` before invoking an action.

- [ ] **Step 4: Render FadeArc in every cart mutation control**

Import `FadeArc`. Pass the matching pending direction into `QtyStepper`; update the stepper to disable its pending button, set `aria-busy`, and replace only `FiMinus`/`FiPlus` with the spinner. Disable and busy-mark text controls by their exact key, rendering spinner plus the original label. Update `PromoField` to use `FadeArc` plus `Проверка` and `aria-busy={pending || undefined}`. Replace the cart-loading `Loader2` with `FadeArc` as well.

- [ ] **Step 5: Run GREEN**

Run: `npx vitest run tests/evironn-cart-variant-a.test.tsx tests/evironn-catalog-card.test.tsx`

Expected: all listed files pass, including error and optimistic-wishlist cases.

- [ ] **Step 6: Commit Task 4**

```powershell
git add -- components/evironn/cart/use-cart-variant-a.ts components/evironn/cart/cart-variant-a.tsx components/evironn/cart/cart-primitives.tsx tests/evironn-cart-variant-a.test.tsx
git add -- styles/evironn/CartVariantA.css styles/evironn/CartPrimitives.css
git commit -m "feat: show cart mutation progress"
```

---

### Task 5: Cover checkout, order, cancellation, and review actions

**Files:**

- Modify: `components/evironn/checkout/use-checkout-variant-a.ts`
- Modify: `components/evironn/checkout/checkout-primitives.tsx`
- Modify: `components/evironn/order/use-order-variant-a.ts`
- Modify: `components/evironn/order/order-variant-a.tsx`
- Modify: `components/shared/orders/cancel-order-button.tsx`
- Modify: `tests/evironn-checkout-variant-a.test.tsx`
- Modify: `tests/evironn-order-variant-a.test.tsx`
- Modify: `tests/cancel-order-dialog.test.ts`

**Interfaces:**

- Produces: checkout `mutationKey: string | null` with keys `line:<id>:decrement`, `line:<id>:increment`, `line:<id>:input`, and `line:<id>:remove`.
- Consumes: Task 1 shared `Button` loading behavior and Task 4 `QtyStepper.pending`.

- [ ] **Step 1: Write checkout/order RED tests**

In checkout, defer cart mutation and order placement. Assert only the activated quantity/remove control gets `FadeArc`; final `Оформляем…` shows `FadeArc`, stays disabled/busy, and duplicate placement remains prevented. Preserve existing coupled-control locks.

Replace the order source-only pending assertion with a rendered controller test: defer `resyncOrderPayment`, click `Проверить статус платежа`, assert spinner plus label, disabled/busy, and one call after a second click. Extend cancellation dialog coverage to assert its shared loading button retains `Отменить заказ` beside an SVG.

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/evironn-checkout-variant-a.test.tsx tests/evironn-order-variant-a.test.tsx tests/cancel-order-dialog.test.ts`

Expected: FAIL on missing `FadeArc`, mutation identity, or accessible busy state.

- [ ] **Step 3: Implement checkout mutation identity and final-submit spinner**

Add `mutationKey`, pass the source into checkout step actions, and set/clear the key inside the existing `mutateCart` `try/finally`. Pass it to `QtyStepper` and remove controls. In checkout `SubmitButton`, render:

```tsx
{
  submitPending && <FadeArc className="h-4 w-4 shrink-0" aria-hidden="true" />;
}
{
  submitPending ? 'Оформляем…' : quote ? `Оформить заказ · ${formatPrice(quote.totals.total)}` : unavailableTotal;
}
```

Keep its current `disabled`, `aria-busy`, quote gating, transaction lock, and recovery behavior.

- [ ] **Step 4: Implement order feedback**

Guard `resync` when busy and clear busy through `try/finally`. In `OrderVariantA`, replace `RefreshCw` with `FadeArc` while busy, retain `Проверить статус платежа`, and set `aria-busy`. `CancelOrderButton` and `ReviewForm` inherit spinner-plus-label from Task 1; add no local spinner implementation.

- [ ] **Step 5: Run GREEN**

Run: `npx vitest run tests/evironn-checkout-variant-a.test.tsx tests/evironn-order-variant-a.test.tsx tests/cancel-order-dialog.test.ts tests/storefront-button-loading.test.tsx`

Expected: all listed files pass.

- [ ] **Step 6: Commit Task 5**

```powershell
git add -- components/evironn/checkout/use-checkout-variant-a.ts components/evironn/checkout/checkout-primitives.tsx components/evironn/order/use-order-variant-a.ts components/evironn/order/order-variant-a.tsx components/shared/orders/cancel-order-button.tsx tests/evironn-checkout-variant-a.test.tsx tests/evironn-order-variant-a.test.tsx tests/cancel-order-dialog.test.ts
git commit -m "feat: show checkout and order action progress"
```

---

### Task 6: Add operation-specific profile and logout feedback, then run the focused checkpoint

**Files:**

- Modify: `components/evironn/profile/use-profile-variant-a.ts`
- Modify: `components/evironn/profile/profile-variant-a.tsx`
- Modify only if fixed sizing requires it: `styles/evironn/ProfilePage.css`
- Modify: `tests/evironn-profile-variant-a.test.tsx`
- Review only: all storefront files changed in Tasks 1–5

**Interfaces:**

- Produces: `pendingActions: ReadonlySet<string>` with keys `profile:save`, `password:save`, `address:add`, `address:<id>:default`, `address:<id>:delete`, `favorite:<productId>:remove`, `favorite:<skuId>:cart`, and `logout`.
- Consumes: Task 1 `SubmitButton` and `FadeArc`; Task 3 `CatalogCard` local pending behavior.

- [ ] **Step 1: Write profile RED tests**

Use deferred mocks for profile save, password save, add/default/delete address, favorite cart add/removal, and `signOut`. For every action assert exact-key disabled/busy behavior and `FadeArc`; prove another row is not marked busy. For logout assert the button keeps `Выйти`, blocks a duplicate click, and clears after a rejected sign-out without removing existing profile content.

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/evironn-profile-variant-a.test.tsx`

Expected: FAIL because profile currently exposes one coarse boolean and logout/favorite/address controls lack operation-local feedback.

- [ ] **Step 3: Implement profile pending keys**

Replace the coarse state with a guarded key set plus synchronous ref using the exact `pendingActionsRef`/`runPending` pattern from Task 4. Change `run` to accept an exact key, and apply the keys listed in Interfaces. Wrap `logout` in its own guarded async `try/finally`. Continue exposing `pending: pendingActions.size > 0` only if existing coupled form locks need it, and expose `pendingActions` for exact rendering.

In `ProfileVariantA`, add `FadeArc` to the active text/icon controls using `pendingActions.has(key)`. For favorite removal, keep the affected card mounted for the request lifetime so its heart can show the spinner: optimistically update its heart/count state, remove the card only after a successful inactive result, and restore the original heart/count on failure. Preserve the existing token ownership and refreshed-DTO reconciliation so stale responses still cannot overwrite newer data.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run tests/evironn-profile-variant-a.test.tsx tests/evironn-catalog-card.test.tsx tests/storefront-button-loading.test.tsx`

Expected: all listed files pass.

- [ ] **Step 5: Run the bounded completion checkpoint**

Run:

```powershell
npx vitest run tests/storefront-button-loading.test.tsx tests/verification-gate-loading.test.tsx tests/evironn-auth-variant-b.test.tsx tests/evironn-catalog-card.test.tsx tests/evironn-catalog-wishlist.test.tsx tests/evironn-product-cart.test.tsx tests/evironn-cart-variant-a.test.tsx tests/evironn-checkout-variant-a.test.tsx tests/evironn-order-variant-a.test.tsx tests/cancel-order-dialog.test.ts tests/evironn-profile-variant-a.test.tsx
```

Expected: all listed files and tests pass with zero failures.

Run Prettier on the exact final changed-file list, `npx eslint <all changed ts/tsx files>`, `npm run typecheck`, and `git diff --check`.

Expected: Prettier exit 0; ESLint 0 errors; typecheck exit 0 because cart/checkout/profile shared component interfaces changed; `git diff --check` exit 0.

Review the final diff and run this reachability audit:

```powershell
rg -n "await |signIn\(|signOut\(|startTransition\(|addCartItem|removeCartItem|updateItemQuantity|toggleWishlist|submitReview|cancelOrder|resyncOrderPayment" components/evironn components/shared/auth/verification-gate.tsx components/shared/orders/cancel-order-button.tsx components/shared/product/review-form.tsx --glob '*.tsx' --glob '*.ts'
```

Expected: every reachable storefront mutation in the inventory either owns an explicit pending state with `FadeArc` or consumes Task 1's loading primitive. Any newly discovered reachable control must receive a failing focused test before implementation; unreachable legacy matches remain unchanged and are recorded as excluded.

- [ ] **Step 6: Commit Task 6**

```powershell
git add -- components/evironn/profile/use-profile-variant-a.ts components/evironn/profile/profile-variant-a.tsx tests/evironn-profile-variant-a.test.tsx
git add -- styles/evironn/ProfilePage.css
git commit -m "feat: show profile action progress"
```

Stop after the local focused checkpoint. Do not push, open a PR, merge, deploy, run the full repository gate/build/broad E2E, or modify admin code without separate user authorization.
