'use client';

import Link from 'next/link';

import { ArrowIcon, BagIcon, SearchIcon, UserIcon } from '@/components/evironn/header/header-icons';
import {
  ACCOUNT_LINK,
  CART_HREF,
  CATALOG_LINK,
  cartLabel,
  PRIMARY_LINKS,
  ROOM_LINKS,
  SEARCH_LINK,
} from '@/components/evironn/header/header-nav';
import { NavGlassDefs, useNavGlassMap } from '@/components/evironn/header/nav-glass';
import { useHeaderChrome } from '@/components/evironn/header/use-header-chrome';
import { useSheetDrag } from '@/components/evironn/header/use-sheet-drag';
import { PUBLIC_ROUTES } from '@/components/evironn/public-routes';

type StorefrontHeaderProps = { cartCount: number };

/**
 * Storefront bar.
 *
 * Up to 600px it is a floating liquid-glass capsule holding the logo, the cart and
 * the menu toggle, and navigation opens as a bottom sheet with photographic room
 * cards that can be swiped away. From 601px the full navigation is inline: a
 * compact tier down to 601px (icon utilities, fluid type) and the wide tier above
 * 1040px.
 *
 * A single cart link serves all tiers, so the accessible name «Корзина (n)» stays
 * unique: it is a labelled pill on wide screens and an icon with a count chip on
 * narrower ones.
 */
export function StorefrontHeader({ cartCount: serverCartCount }: StorefrontHeaderProps) {
  const {
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
  } = useHeaderChrome(serverCartCount);
  const glassMapRef = useNavGlassMap(innerRef);
  useSheetDrag({ sheetRef: drawerRef, scrimRef, open: menuOpen, onDismiss: closeMenu });

  return (
    <header
      id="evironn-header"
      lang="ru"
      className={isCondensed ? 'is-condensed' : ''}
      data-menu-open={menuOpen ? 'true' : 'false'}
    >
      <div className="od-header-band" aria-hidden="true" />
      <div className="od-header-inner" ref={innerRef}>
        <Link className="od-logo-link" href={PUBLIC_ROUTES.home} aria-label="Evironn">
          <img className="od-logo" src="/assets/evironn-logo.svg" width="248" height="72" alt="Evironn" />
        </Link>

        <nav className="od-primary-nav" aria-label="Основная навигация">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="od-actions">
          <Link className="od-utility-action" href={SEARCH_LINK.href}>
            <SearchIcon className="od-utility-glyph" />
            <span className="od-utility-label">{SEARCH_LINK.label}</span>
          </Link>
          <Link className="od-utility-action" href={ACCOUNT_LINK.href}>
            <UserIcon className="od-utility-glyph" />
            <span className="od-utility-label">{ACCOUNT_LINK.label}</span>
          </Link>
          <Link className="od-bag" href={CART_HREF}>
            <BagIcon className="od-bag-glyph" />
            <span className="od-bag-label">{cartLabel(cartCount)}</span>
            {cartCount > 0 && (
              <span className="od-bag-count" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            ref={toggleRef}
            className="od-menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            aria-controls="evironn-mobile-menu"
            onClick={toggleMenu}
          >
            <span className="od-menu-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <button
          className="od-scrim"
          ref={scrimRef}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={closeMenu}
        />
      )}

      {menuOpen && (
        <div
          className="od-mobile-menu"
          id="evironn-mobile-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Мобильное меню"
          onKeyDown={handleMenuKeyDown}
        >
          <span className="od-grip" aria-hidden="true" />
          <nav aria-label="Мобильная навигация">
            <Link className="od-sheet-cta" href={CATALOG_LINK.href} onClick={closeMenu}>
              <span>{CATALOG_LINK.label}</span>
              <ArrowIcon />
            </Link>

            <span className="od-sheet-eyebrow">Комнаты</span>
            <div className="od-room-grid">
              {ROOM_LINKS.map((room, index) => (
                <Link
                  key={room.label}
                  className="od-room-card"
                  href={room.href}
                  onClick={closeMenu}
                  style={{ animationDelay: `${90 + index * 45}ms` }}
                >
                  <img src={room.poster} width="440" height="550" alt="" loading="lazy" />
                  <span className="od-room-chip">{room.label}</span>
                </Link>
              ))}
            </div>

            <div className="od-tile-row">
              <Link className="od-tile" href={SEARCH_LINK.href} onClick={closeMenu}>
                <SearchIcon />
                <span>{SEARCH_LINK.label}</span>
              </Link>
              <Link className="od-tile" href={ACCOUNT_LINK.href} onClick={closeMenu}>
                <UserIcon />
                <span>{ACCOUNT_LINK.label}</span>
              </Link>
              <Link className="od-tile" href={CART_HREF} onClick={closeMenu}>
                <BagIcon />
                <span>{cartLabel(cartCount)}</span>
              </Link>
            </div>
          </nav>
        </div>
      )}

      <NavGlassDefs mapRef={glassMapRef} />
    </header>
  );
}
