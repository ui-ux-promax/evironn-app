'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { catalogRoomPath, PUBLIC_ROUTES } from '@/components/evironn/public-routes';
import { useCartStore } from '@/store';

type StorefrontHeaderProps = { cartCount: number };

const primaryLinks = [
  ['Вся мебель', PUBLIC_ROUTES.catalog],
  ['Гостиная', catalogRoomPath('living')],
  ['Столовая', catalogRoomPath('dining')],
  ['Спальня', catalogRoomPath('bedroom')],
  ['Терраса', catalogRoomPath('terrace')],
] as const;

function buildGlassMap(width: number, height: number): string {
  const radius = Math.round(Math.min(width, height) / 2);
  const inset = Math.min(width, height) * 0.035;
  const svg =
    '<svg viewBox="0 0 ' +
    width +
    ' ' +
    height +
    '" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
    '<linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs>' +
    '<rect x="0" y="0" width="' +
    width +
    '" height="' +
    height +
    '" fill="black"/><rect x="0" y="0" width="' +
    width +
    '" height="' +
    height +
    '" rx="' +
    radius +
    '" fill="url(#red)"/><rect x="0" y="0" width="' +
    width +
    '" height="' +
    height +
    '" rx="' +
    radius +
    '" fill="url(#blue)" style="mix-blend-mode:difference"/><rect x="' +
    inset +
    '" y="' +
    inset +
    '" width="' +
    (width - inset * 2) +
    '" height="' +
    (height - inset * 2) +
    '" rx="' +
    radius +
    '" fill="hsl(0 0% 50% / .93)" style="filter:blur(11px)"/></svg>';

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function StorefrontHeader({ cartCount }: StorefrontHeaderProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const glassMapRef = useRef<SVGFEImageElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const hasOpenedMenuRef = useRef(false);
  const previousInertRef = useRef(new Map<HTMLElement, boolean>());
  const [isCondensed, setIsCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const loading = useCartStore((state) => state.loading);
  const fetchCartItems = useCartStore((state) => state.fetchCartItems);
  const visibleCartCount = loading ? cartCount : items.length;

  useEffect(() => {
    void fetchCartItems();
  }, [fetchCartItems]);

  useLayoutEffect(() => {
    const condenseOn = 64;
    const condenseOff = 24;
    let ticking = false;
    let condensed = false;

    const update = () => {
      ticking = false;
      const scrollPosition = window.scrollY;
      if (!condensed && scrollPosition > condenseOn) {
        condensed = true;
        setIsCondensed(true);
      } else if (condensed && scrollPosition < condenseOff) {
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
    condensed = window.scrollY > condenseOn;
    setIsCondensed(condensed);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    const syncGlassMap = () => {
      const inner = innerRef.current;
      const glassMap = glassMapRef.current;
      if (!inner || !glassMap) return;
      const bounds = inner.getBoundingClientRect();
      const mapUri = buildGlassMap(Math.max(1, Math.round(bounds.width)), Math.max(1, Math.round(bounds.height)));
      glassMap.setAttribute('href', mapUri);
      glassMap.setAttributeNS('http://www.w3.org/1999/xlink', 'href', mapUri);
    };

    syncGlassMap();
    const inner = innerRef.current;
    let resizeObserver: ResizeObserver | undefined;
    if (inner && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncGlassMap);
      resizeObserver.observe(inner);
    }
    window.addEventListener('resize', syncGlassMap, { passive: true });
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncGlassMap);
    };
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) {
      if (hasOpenedMenuRef.current) menuTriggerRef.current?.focus();
      return;
    }
    hasOpenedMenuRef.current = true;
    const firstControl = menuRef.current?.querySelector<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
    firstControl?.focus();
    const inner = innerRef.current;
    if (inner) {
      previousInertRef.current.set(inner, inner.hasAttribute('inert'));
      inner.setAttribute('inert', '');
    }
    const header = document.getElementById('evironn-header');
    const host = header?.parentElement;
    const backgroundElements = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element !== host && element !== header,
    );
    for (const element of backgroundElements) {
      previousInertRef.current.set(element, element.hasAttribute('inert'));
      element.setAttribute('inert', '');
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      for (const [element, wasInert] of previousInertRef.current) {
        if (wasInert) element.setAttribute('inert', '');
        else element.removeAttribute('inert');
      }
      previousInertRef.current.clear();
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
      return;
    }
    setMenuOpen(true);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])'),
    );
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
  };

  return (
    <header id="evironn-header" lang="ru" className={isCondensed ? 'is-condensed' : ''}>
      <div className="od-header-inner" ref={innerRef}>
        <Link className="od-logo-link" href={PUBLIC_ROUTES.home} aria-label="Evironn">
          <img className="od-logo" src="/assets/evironn-logo.svg" width="248" height="72" alt="Evironn" />
        </Link>
        <button
          ref={menuTriggerRef}
          className="od-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          aria-controls="evironn-mobile-menu"
          onClick={toggleMenu}
        >
          <span className="od-menu-icon" aria-hidden="true" />
        </button>
        <nav className="od-primary-nav" aria-label="Основная навигация">
          {primaryLinks.map(([label, href]) => (
            <Link key={label} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="od-actions">
          <Link className="od-utility-action" href={PUBLIC_ROUTES.catalog}>
            Поиск
          </Link>
          <Link className="od-utility-action" href={PUBLIC_ROUTES.profile}>
            Аккаунт
          </Link>
          <Link className="od-bag" href={PUBLIC_ROUTES.cart}>{`Корзина (${visibleCartCount})`}</Link>
        </div>
      </div>
      {menuOpen && (
        <div
          className="od-mobile-menu"
          id="evironn-mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          onKeyDown={handleMenuKeyDown}
          aria-label="Мобильное меню"
        >
          <nav aria-label="Мобильная навигация">
            {primaryLinks.map(([label, href]) => (
              <Link key={label} href={href} onClick={closeMenu}>
                {label}
              </Link>
            ))}
            <Link href={PUBLIC_ROUTES.catalog} onClick={closeMenu}>
              Поиск
            </Link>
            <Link href={PUBLIC_ROUTES.profile} onClick={closeMenu}>
              Аккаунт
            </Link>
            <Link href={PUBLIC_ROUTES.cart} aria-label={`Мобильная корзина (${visibleCartCount})`} onClick={closeMenu}>
              {`Корзина (${visibleCartCount})`}
            </Link>
          </nav>
        </div>
      )}
      <svg className="od-nav-glass-defs" aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id="od-nav-liquid-glass" colorInterpolationFilters="sRGB">
            <feImage
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
              ref={glassMapRef}
              data-nav-glass-map="true"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale="-50"
              result="dispRed"
            />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale="-47"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale="-44"
              result="dispBlue"
            />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
    </header>
  );
}
