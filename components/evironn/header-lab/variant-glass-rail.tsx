'use client';

import Link from 'next/link';

import { HeaderDesktopChrome, HeaderLogo } from './header-desktop-chrome';
import { ArrowIcon, BagIcon, SearchIcon, UserIcon } from './header-icons';
import {
  cartLabel,
  HEADER_ACCOUNT_LINK,
  HEADER_CART_HREF,
  HEADER_CATALOG_LINK,
  HEADER_ROOM_LINKS,
  HEADER_SEARCH_LINK,
} from './header-nav-data';
import { useHeaderChrome } from './use-header-chrome';

/**
 * Variant 5 — «Стеклянный рельс».
 * Utilities collapse into one segmented glass rail; the drawer scales out of
 * that rail as an anchored card with room chips.
 */
export function HeaderVariantGlassRail({ cartCount: serverCartCount }: { cartCount: number }) {
  const { rootRef, toggleRef, drawerRef, condensed, open, cartCount, close, toggle, onDrawerKeyDown } =
    useHeaderChrome(serverCartCount);

  return (
    <header
      ref={rootRef}
      id="ev-hdr-v5"
      className="ev-hdr ev-hdr--rail"
      lang="ru"
      data-condensed={condensed ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
    >
      <div className="ev-hdr__band" aria-hidden="true" />
      <div className="ev-hdr__bar">
        <HeaderLogo />
        <HeaderDesktopChrome cartCount={cartCount} />
        <div className="ev-hdr__mobile">
          <div className="ev-hdr__rail">
            <Link className="ev-hdr__round" href={HEADER_SEARCH_LINK.href} aria-label={HEADER_SEARCH_LINK.label}>
              <SearchIcon />
            </Link>
            <Link className="ev-hdr__round ev-hdr__cart" href={HEADER_CART_HREF} aria-label={cartLabel(cartCount)}>
              <BagIcon />
              {cartCount > 0 && (
                <span className="ev-hdr__count" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              ref={toggleRef}
              className="ev-hdr__round ev-hdr__burger"
              type="button"
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={open}
              aria-controls="ev-hdr-v5-drawer"
              onClick={toggle}
            >
              <span className="ev-hdr__burger-glyph" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {open && <button className="ev-hdr__scrim" type="button" tabIndex={-1} aria-hidden="true" onClick={close} />}

      {open && (
        <div
          ref={drawerRef}
          id="ev-hdr-v5-drawer"
          className="ev-hdr__drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Мобильное меню"
          onKeyDown={onDrawerKeyDown}
        >
          <nav aria-label="Мобильная навигация">
            <Link className="ev-hdr__rail-lead" href={HEADER_CATALOG_LINK.href} onClick={close}>
              <span className="ev-hdr__rail-lead-text">
                <span className="ev-hdr__eyebrow">Каталог</span>
                <span>{HEADER_CATALOG_LINK.label}</span>
              </span>
              <ArrowIcon />
            </Link>

            <div className="ev-hdr__chip-grid">
              {HEADER_ROOM_LINKS.map((room, index) => (
                <Link
                  key={room.label}
                  className="ev-hdr__chip"
                  href={room.href}
                  onClick={close}
                  style={{ animationDelay: `${80 + index * 40}ms` }}
                >
                  <span className="ev-hdr__chip-thumb" aria-hidden="true">
                    <img src={room.poster} width="120" height="120" alt="" loading="lazy" />
                  </span>
                  <span>{room.label}</span>
                </Link>
              ))}
            </div>

            <Link className="ev-hdr__field" href={HEADER_SEARCH_LINK.href} onClick={close}>
              <SearchIcon />
              <span>{HEADER_SEARCH_LINK.label}</span>
            </Link>

            <div className="ev-hdr__foot-row">
              <Link className="ev-hdr__ghost" href={HEADER_ACCOUNT_LINK.href} onClick={close}>
                <UserIcon />
                <span>{HEADER_ACCOUNT_LINK.label}</span>
              </Link>
              <Link className="ev-hdr__solid" href={HEADER_CART_HREF} onClick={close}>
                <BagIcon />
                <span>{cartLabel(cartCount)}</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
