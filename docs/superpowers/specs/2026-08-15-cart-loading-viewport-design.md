# Cart loading viewport reservation

## Context

The cart route uses `app/(shop)/cart/loading.tsx` while the server page and client cart state are loading. The shared shop layout renders `StorefrontFooter` immediately after the route content, so the current skeleton's intrinsic height is short enough for the footer to appear in the first viewport.

## Goal

Keep the cart footer below the first viewport while the cart loading skeleton is displayed, without hiding or conditionally removing the shared footer.

## Chosen design

Apply a viewport-height minimum to the cart loading wrapper only. The wrapper remains in normal document flow, so the footer stays mounted and becomes reachable by scrolling after the reserved loading area. Use a small header offset for desktop and mobile viewport units that account for browser UI (`svh`/`dvh`) to avoid relying on a fixed pixel skeleton height.

The implementation is limited to the cart route loading fallback. The ready cart page, empty-cart state, shared shop layout, and footer styles remain unchanged.

## Behavior

- During cart route loading, the skeleton occupies at least the available viewport below the storefront header.
- The footer is not visible in the initial viewport at the tested desktop and mobile sizes.
- Once loading completes, the loading wrapper is removed and the existing cart content layout is unchanged.
- The footer remains rendered in normal flow; no loading-specific footer visibility or position logic is added.

## Acceptance criteria

- `app/(shop)/cart/loading.tsx` exposes a loading wrapper with a stable class or equivalent scoped styling hook.
- The loading wrapper has a responsive minimum height based on viewport units and preserves its existing spacing.
- Existing cart skeleton elements and accessibility behavior remain intact.
- Focused source/contract tests cover the loading wrapper and viewport-height contract.
- Prettier and the focused test command pass.

## Non-goals

- No global shell or footer redesign.
- No performance rewrite of cart loading or Preview startup.
- No changes to cart data fetching, server actions, or the ready cart state.
