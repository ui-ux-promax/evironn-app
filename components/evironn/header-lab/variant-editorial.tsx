'use client';

import Link from 'next/link';

import { HeaderDesktopChrome, HeaderLogo } from './header-desktop-chrome';
import { ArrowIcon, EvironnMarkIcon } from './header-icons';
import {
  cartLabel,
  HEADER_ACCOUNT_LINK,
  HEADER_CART_HREF,
  HEADER_CATALOG_LINK,
  HEADER_ROOM_LINKS,
  HEADER_SEARCH_LINK,
  HEADER_TAGLINE,
} from './header-nav-data';
import { useHeaderChrome } from './use-header-chrome';

/**
 * Variant 2 — «Editorial».
 * No icons and no capsule: a bare typographic bar with a word toggle, opening a
 * full-height warm sheet with numbered rooms and room photography.
 */
export function HeaderVariantEditorial({ cartCount: serverCartCount }: { cartCount: number }) {
  const { rootRef, toggleRef, drawerRef, condensed, open, cartCount, close, toggle, onDrawerKeyDown } =
    useHeaderChrome(serverCartCount);

  return (
    <header
      ref={rootRef}
      id="ev-hdr-v2"
      className="ev-hdr ev-hdr--editorial"
      lang="ru"
      data-condensed={condensed ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
    >
      <div className="ev-hdr__band" aria-hidden="true" />
      <div className="ev-hdr__bar">
        <HeaderLogo />
        <HeaderDesktopChrome cartCount={cartCount} />
        <div className="ev-hdr__mobile">
          <Link className="ev-hdr__word-link" href={HEADER_CART_HREF}>
            {cartLabel(cartCount)}
          </Link>
          <button
            ref={toggleRef}
            className="ev-hdr__word-toggle"
            type="button"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
            aria-controls="ev-hdr-v2-drawer"
            onClick={toggle}
          >
            <span>{open ? 'Закрыть' : 'Меню'}</span>
            <span className="ev-hdr__word-toggle-rule" aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={drawerRef}
          id="ev-hdr-v2-drawer"
          className="ev-hdr__drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Мобильное меню"
          onKeyDown={onDrawerKeyDown}
        >
          <div className="ev-hdr__sheet-inner">
            <nav aria-label="Мобильная навигация">
              <Link className="ev-hdr__lead-row" href={HEADER_CATALOG_LINK.href} onClick={close}>
                <span>{HEADER_CATALOG_LINK.label}</span>
                <ArrowIcon className="ev-hdr__lead-arrow" />
              </Link>

              <span className="ev-hdr__eyebrow ev-hdr__sheet-eyebrow">Комнаты</span>
              <ul className="ev-hdr__room-list">
                {HEADER_ROOM_LINKS.map((room, index) => (
                  <li key={room.label} style={{ animationDelay: `${120 + index * 60}ms` }}>
                    <Link href={room.href} onClick={close}>
                      <span className="ev-hdr__room-index" aria-hidden="true">
                        {room.index}
                      </span>
                      <span className="ev-hdr__room-name">{room.label}</span>
                      <span className="ev-hdr__room-thumb" aria-hidden="true">
                        <img src={room.poster} width="220" height="280" alt="" loading="lazy" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="ev-hdr__sheet-foot">
                <div className="ev-hdr__micro-row">
                  <Link href={HEADER_SEARCH_LINK.href} onClick={close}>
                    {HEADER_SEARCH_LINK.label}
                  </Link>
                  <Link href={HEADER_ACCOUNT_LINK.href} onClick={close}>
                    {HEADER_ACCOUNT_LINK.label}
                  </Link>
                  <Link href={HEADER_CART_HREF} onClick={close}>
                    {cartLabel(cartCount)}
                  </Link>
                </div>
                <p className="ev-hdr__sheet-tagline">
                  <EvironnMarkIcon className="ev-hdr__sheet-mark" />
                  {HEADER_TAGLINE}
                </p>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
