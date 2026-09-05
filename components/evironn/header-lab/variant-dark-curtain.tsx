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
 * Variant 4 — «Тёмная кулиса».
 * Ink-filled round controls read on any hero frame; the drawer is a full-screen
 * dark curtain reusing the footer palette and wordmark.
 */
export function HeaderVariantDarkCurtain({ cartCount: serverCartCount }: { cartCount: number }) {
  const { rootRef, toggleRef, drawerRef, condensed, open, cartCount, close, toggle, onDrawerKeyDown } =
    useHeaderChrome(serverCartCount);

  return (
    <header
      ref={rootRef}
      id="ev-hdr-v4"
      className="ev-hdr ev-hdr--curtain"
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
            aria-controls="ev-hdr-v4-drawer"
            onClick={toggle}
          >
            <span className="ev-hdr__burger-glyph" aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={drawerRef}
          id="ev-hdr-v4-drawer"
          className="ev-hdr__drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Мобильное меню"
          onKeyDown={onDrawerKeyDown}
        >
          <div className="ev-hdr__curtain-inner">
            <nav aria-label="Мобильная навигация">
              <Link className="ev-hdr__curtain-lead" href={HEADER_CATALOG_LINK.href} onClick={close}>
                <span>{HEADER_CATALOG_LINK.label}</span>
                <ArrowIcon />
              </Link>

              <span className="ev-hdr__eyebrow ev-hdr__curtain-eyebrow">Комнаты</span>
              <ul className="ev-hdr__curtain-list">
                {HEADER_ROOM_LINKS.map((room, index) => (
                  <li key={room.label} style={{ animationDelay: `${170 + index * 60}ms` }}>
                    <Link href={room.href} onClick={close}>
                      <span className="ev-hdr__curtain-index" aria-hidden="true">
                        {room.index}
                      </span>
                      <span className="ev-hdr__curtain-name">{room.label}</span>
                      <span className="ev-hdr__curtain-caption">{room.caption}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="ev-hdr__curtain-utility">
                <Link href={HEADER_SEARCH_LINK.href} onClick={close}>
                  <SearchIcon />
                  <span>{HEADER_SEARCH_LINK.label}</span>
                </Link>
                <Link href={HEADER_ACCOUNT_LINK.href} onClick={close}>
                  <UserIcon />
                  <span>{HEADER_ACCOUNT_LINK.label}</span>
                </Link>
                <Link href={HEADER_CART_HREF} onClick={close}>
                  <BagIcon />
                  <span>{cartLabel(cartCount)}</span>
                </Link>
              </div>
            </nav>

            <svg className="ev-hdr__curtain-wordmark" viewBox="0 0 1000 190" aria-hidden="true" focusable="false">
              <text
                x="50%"
                y="166"
                fontFamily="Fraunces, Georgia, serif"
                fontSize="176"
                fontWeight="600"
                letterSpacing="-8"
                textAnchor="middle"
                textLength="950"
                lengthAdjust="spacingAndGlyphs"
              >
                EVIRONN
              </text>
            </svg>
          </div>
        </div>
      )}
    </header>
  );
}
