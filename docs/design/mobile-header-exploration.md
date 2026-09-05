# Storefront header — mobile exploration and the shipped bar

Six candidates were explored on a preview route; candidate 6 («Капсула + нижний
лист») was chosen and now lives in `components/evironn/storefront-header.tsx` and
`styles/evironn/header.css`.

## Shipped layout tiers

| Viewport   | Bar                                                                                                                 | Navigation                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ≤ 600px    | Floating liquid-glass capsule (`calc(100% - 20px)`, 56px, 52px once condensed): logo, cart icon with count, burger. | Bottom sheet with photographic room cards.         |
| 601–1040px | Full-width bar, 73px. Fluid type and gaps; utilities and cart collapse to icons.                                    | Inline: five primary links, no burger.             |
| ≥ 1041px   | Full-width bar, 85px, condensing to the glass pill on scroll — the approved wide design.                            | Inline: five links, labelled utilities, cart pill. |

The 600px switch is the requested breakpoint. Below it the capsule shows; above
it the inline navigation does. The five Russian labels plus the logo only fit down
to 601px once «Поиск» and «Аккаунт» become icons and type/gaps scale with the
viewport, so the compact tier does exactly that. Measured content vs available
width leaves 44px of slack at 601px and grows from there; no tier overflows and no
width produces a horizontal scrollbar.

In the wide tier the nav is centred between unequal side columns, so the
right-hand gap runs out first. `clamp()` on the nav gap, the actions gap and the
cart padding keeps daylight between «Терраса» and the utilities: the nav→actions
gap went from 24px to 42px at 1041px and from 24px to 58px at 1080px, while
1440px and above render exactly as before (156px).

## Liquid glass

`components/evironn/header/nav-glass.tsx` builds the displacement map — a red
horizontal ramp differenced with a blue vertical ramp into a rounded-rect lens,
plus a blurred inner plate so only the rim refracts — and hosts the three-pass
chromatic displacement filter `#od-nav-liquid-glass`. A `ResizeObserver` keeps the
map sized to the bar, so the lens survives rotation and the condense transition.

The plate is the production recipe: `#ffffff6b`, inset white rim glow, and
`backdrop-filter: url(#od-nav-liquid-glass) blur(7px) saturate(1.4)` with the
plain `blur(12px) saturate(1.4)` kept first as the fallback for engines that
reject `url()` inside `backdrop-filter`. The capsule carries it at every scroll
position; the wide bar picks it up when it condenses.

## Swipe to dismiss

`components/evironn/header/use-sheet-drag.ts` attaches non-passive `touch*`
listeners to the sheet:

- The sheet follows the finger (`translateY`) and the scrim fades with the pull.
- Release dismisses past **88px** of travel or above **0.4 px/ms** of downward
  flick speed, measured from the last two move samples; otherwise it snaps back
  over 340ms.
- A drag only takes over when the sheet is scrolled to the top, or when the
  gesture starts inside the top **32px** grip strip. A tall, scrolled sheet keeps
  native scrolling; the grip always drags.
- Sideways or upward intent hands the gesture back to the browser, and travel is
  clamped at 0 so the sheet cannot lift off the bottom edge.
- Cancelling `touchmove` suppresses the click that would otherwise follow a drag
  released over a link, so dragging never navigates while tapping still does.
- Dismissal plays the sheet out and unmounts on `transitionend`, with a 400ms
  fallback timer. Under `prefers-reduced-motion` it unmounts immediately.

## Accessibility notes

- One cart link serves every tier, so the accessible name «Корзина (n)» stays
  unique: a labelled pill on wide screens, an icon plus a count chip below 1041px.
  The label is visually hidden rather than removed, which keeps the name intact.
- The sheet is a modal dialog with a focus trap over its own eight links, Escape
  to close, and focus restored to the toggle.
- The bar is deliberately **not** made `inert` while the sheet is open, so the
  toggle can double as the close control. Only siblings of the header become
  inert. Two assertions were updated for this: the `inert` expectation in
  `tests/evironn-storefront-shell.test.tsx` and in `e2e/evironn-home.spec.ts`.
- Every drawer rule stays scoped `#evironn-header .od-mobile-menu`, including the
  drawer's `:focus-visible` rule, which is kept in its own block so it is never
  grouped with bar selectors.

## Fixed relative to the previous header

- The mobile bar hid the cart and the account entry point with no replacement;
  the cart is now in the bar and every utility is in the sheet.
- The drawer was painted at `z-index: 0` under the bar, with a hard-coded
  `top: 71px` that did not match the 73px bar between 572–1040px.
- The burger was a plain bordered square; it is now a round control whose glyph
  crosses into an X while the sheet is open.

## Preview route (still present)

`/header-lab?v=1` … `?v=6` renders each candidate over the real hero and two real
home sections. It is noindex and lives in `app/(lab)/`,
`components/evironn/header-lab/` and `styles/evironn/header-lab/`, which duplicate
the shipped hooks. Delete those three directories once the shipped bar is signed
off; nothing in production imports from them.
