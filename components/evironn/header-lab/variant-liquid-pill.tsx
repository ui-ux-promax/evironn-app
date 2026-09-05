'use client';

import Link from 'next/link';

import { HeaderDesktopChrome, HeaderLogo } from './header-desktop-chrome';
import { BagIcon, ChevronIcon, SearchIcon, UserIcon } from './header-icons';
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
 * Variant 1 — «Стеклянная капсула».
 * The bar is a floating glass capsule at every scroll position and the drawer
 * is a matching capsule-width card that drops just below it.
 */
export function HeaderVariantLiquidPill({ cartCount: serverCartCount }: { cartCount: number }) {
  const { rootRef, toggleRef, drawerRef, condensed, open, cartCount, close, toggle, onDrawerKeyDown } =
    useHeaderChrome(serverCartCount);

  return (
    <header
      ref={rootRef}
      id="ev-hdr-v1"
      className="ev-hdr ev-hdr--pill"
      lang="ru"
      data-condensed={condensed ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
    >
      <div className="ev-hdr__band" aria-hidden="true" />
      <div className="ev-hdr__bar">
        <HeaderLogo />
        <HeaderDesktopChrome cartCount={cartCount} />
        <div className="ev-hdr__mobile">
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
            aria-controls="ev-hdr-v1-drawer"
            onClick={toggle}
          >
            <span className="ev-hdr__burger-glyph" aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && <button className="ev-hdr__scrim" type="button" tabIndex={-1} aria-hidden="true" onClick={close} />}

      {open && (
        <div
          ref={drawerRef}
          id="ev-hdr-v1-drawer"
          className="ev-hdr__drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Мобильное меню"
          onKeyDown={onDrawerKeyDown}
        >
          <nav aria-label="Мобильная навигация">
            <span className="ev-hdr__eyebrow ev-hdr__drawer-eyebrow">Каталог</span>
            <Link className="ev-hdr__row ev-hdr__row--lead" href={HEADER_CATALOG_LINK.href} onClick={close}>
              <span>{HEADER_CATALOG_LINK.label}</span>
              <ChevronIcon className="ev-hdr__row-chevron" />
            </Link>
            {HEADER_ROOM_LINKS.map((room, index) => (
              <Link
                key={room.label}
                className="ev-hdr__row"
                href={room.href}
                onClick={close}
                style={{ animationDelay: `${70 + index * 34}ms` }}
              >
                <span className="ev-hdr__row-text">
                  <span className="ev-hdr__row-label">{room.label}</span>
                  <span className="ev-hdr__row-caption">{room.caption}</span>
                </span>
                <ChevronIcon className="ev-hdr__row-chevron" />
              </Link>
            ))}

            <span className="ev-hdr__eyebrow ev-hdr__drawer-eyebrow ev-hdr__drawer-eyebrow--service">Сервис</span>
            <div className="ev-hdr__pill-row">
              <Link className="ev-hdr__ghost-pill" href={HEADER_SEARCH_LINK.href} onClick={close}>
                <SearchIcon />
                <span>{HEADER_SEARCH_LINK.label}</span>
              </Link>
              <Link className="ev-hdr__ghost-pill" href={HEADER_ACCOUNT_LINK.href} onClick={close}>
                <UserIcon />
                <span>{HEADER_ACCOUNT_LINK.label}</span>
              </Link>
            </div>
            <Link className="ev-hdr__solid-pill" href={HEADER_CART_HREF} onClick={close}>
              <BagIcon />
              <span>{cartLabel(cartCount)}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
