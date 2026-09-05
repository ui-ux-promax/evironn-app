'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

import { useCartStore } from '@/store';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const CONDENSE_ON = 64;
const CONDENSE_OFF = 24;

/**
 * Header chrome: scroll condensation, cart-count hydration, and the accessible
 * mobile sheet (scroll lock, background `inert`, focus trap, Escape, focus
 * restore).
 *
 * The bar itself is deliberately left interactive while the sheet is open so the
 * toggle can double as the close control; only siblings of the header become
 * inert. Tab still cycles inside the sheet, and Escape closes it.
 */
export function useHeaderChrome(serverCartCount: number) {
  const innerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);
  const inertRef = useRef(new Map<HTMLElement, boolean>());

  const [isCondensed, setIsCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const totals = useCartStore((state) => state.totals);
  const loading = useCartStore((state) => state.loading);
  const error = useCartStore((state) => state.error);
  const fetchCartItems = useCartStore((state) => state.fetchCartItems);
  const cartCount = loading || error ? serverCartCount : totals.itemCount;

  useEffect(() => {
    void fetchCartItems();
  }, [fetchCartItems]);

  useLayoutEffect(() => {
    let ticking = false;
    let condensed = false;

    const update = () => {
      ticking = false;
      const position = window.scrollY;
      if (!condensed && position > CONDENSE_ON) {
        condensed = true;
        setIsCondensed(true);
      } else if (condensed && position < CONDENSE_OFF) {
        condensed = false;
        setIsCondensed(false);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    condensed = window.scrollY > CONDENSE_ON;
    setIsCondensed(condensed);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      if (hasOpenedRef.current) toggleRef.current?.focus();
      return;
    }
    hasOpenedRef.current = true;
    drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const header = document.getElementById('evironn-header');
    const restoreInert = inertRef.current;
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child === header || (header && child.contains(header))) continue;
      restoreInert.set(child, child.hasAttribute('inert'));
      child.setAttribute('inert', '');
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      for (const [element, wasInert] of restoreInert) {
        if (wasInert) element.setAttribute('inert', '');
        else element.removeAttribute('inert');
      }
      restoreInert.clear();
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((current) => !current), []);

  const handleMenuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
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
    [closeMenu],
  );

  return {
    innerRef,
    toggleRef,
    drawerRef,
    scrimRef,
    isCondensed,
    menuOpen,
    cartCount,
    closeMenu,
    toggleMenu,
    handleMenuKeyDown,
  };
}
