'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

import { useCartStore } from '@/store';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0,
  );
}

/**
 * Shared chrome behaviour for every header variant: scroll condensation, cart
 * count hydration, and an accessible drawer (scroll lock, background `inert`,
 * focus trap, Escape, focus restore).
 *
 * The toggle stays focusable while the drawer is open so it can double as the
 * close control — only the rest of the document is made inert.
 */
export function useHeaderChrome(serverCartCount: number) {
  const rootRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);
  const inertRef = useRef(new Map<HTMLElement, boolean>());

  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);

  const totals = useCartStore((state) => state.totals);
  const loading = useCartStore((state) => state.loading);
  const error = useCartStore((state) => state.error);
  const fetchCartItems = useCartStore((state) => state.fetchCartItems);
  const cartCount = loading || error ? serverCartCount : totals.itemCount;

  useEffect(() => {
    void fetchCartItems();
  }, [fetchCartItems]);

  useLayoutEffect(() => {
    const condenseOn = 64;
    const condenseOff = 24;
    let ticking = false;
    let isCondensed = false;

    const update = () => {
      ticking = false;
      const position = window.scrollY;
      if (!isCondensed && position > condenseOn) {
        isCondensed = true;
        setCondensed(true);
      } else if (isCondensed && position < condenseOff) {
        isCondensed = false;
        setCondensed(false);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    isCondensed = window.scrollY > condenseOn;
    setCondensed(isCondensed);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      if (hasOpenedRef.current) toggleRef.current?.focus();
      return;
    }
    hasOpenedRef.current = true;
    visibleFocusables(drawerRef.current)[0]?.focus();

    const header = rootRef.current;
    const restoreInert = inertRef.current;
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child === header || child.contains(header as Node)) continue;
      restoreInert.set(child, child.hasAttribute('inert'));
      child.setAttribute('inert', '');
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Lets the page react to an open drawer (the lab switcher hides itself).
    document.documentElement.setAttribute('data-ev-hdr-open', 'true');

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.removeAttribute('data-ev-hdr-open');
      for (const [element, wasInert] of restoreInert) {
        if (wasInert) element.setAttribute('inert', '');
        else element.removeAttribute('inert');
      }
      restoreInert.clear();
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((current) => !current), []);

  const onDrawerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = visibleFocusables(rootRef.current);
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  return { rootRef, toggleRef, drawerRef, condensed, open, cartCount, close, toggle, onDrawerKeyDown };
}
