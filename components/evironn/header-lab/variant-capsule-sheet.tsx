'use client';

import { useRef } from 'react';
import Link from 'next/link';

import { HeaderDesktopChrome, HeaderLogo } from './header-desktop-chrome';
import { ArrowIcon, BagIcon, SearchIcon, UserIcon } from './header-icons';
import { LiquidGlassDefs, useLiquidGlassMap } from './liquid-glass';
import {
  cartLabel,
  HEADER_ACCOUNT_LINK,
  HEADER_CART_HREF,
  HEADER_CATALOG_LINK,
  HEADER_ROOM_LINKS,
  HEADER_SEARCH_LINK,
} from './header-nav-data';
import { useHeaderChrome } from './use-header-chrome';
import { useSheetDrag } from './use-sheet-drag';

const GLASS_FILTER_ID = 'ev-hdr-capsule-liquid-glass';

/**
 * Variant 6 — «Капсула + нижний лист».
 * The floating glass capsule of variant 1 with the thumb-reachable bottom sheet
 * of variant 3: the bar stays visible and its burger doubles as the close
 * control while the sheet is up. The capsule uses the same liquid-glass
 * refraction as the approved storefront bar, and the sheet can be flicked away
 * with a downward swipe.
 */
export function HeaderVariantCapsuleSheet({ cartCount: serverCartCount }: { cartCount: number }) {
  const { rootRef, toggleRef, drawerRef, condensed, open, cartCount, close, toggle, onDrawerKeyDown } =
    useHeaderChrome(serverCartCount);
  const barRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const glassMapRef = useLiquidGlassMap(barRef);
  useSheetDrag({ sheetRef: drawerRef, scrimRef, open, onDismiss: close });

  return (
    <header
      ref={rootRef}
      id="ev-hdr-v6"
      className="ev-hdr ev-hdr--capsule-sheet"
      lang="ru"
      data-condensed={condensed ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
    >
      <div className="ev-hdr__band" aria-hidden="true" />
      <div className="ev-hdr__bar" ref={barRef}>
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
            aria-controls="ev-hdr-v6-drawer"
            onClick={toggle}
          >
            <span className="ev-hdr__burger-glyph" aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <button
          className="ev-hdr__scrim"
          ref={scrimRef}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={close}
        />
      )}

      {open && (
        <div
          ref={drawerRef}
          id="ev-hdr-v6-drawer"
          className="ev-hdr__drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Мобильное меню"
          onKeyDown={onDrawerKeyDown}
        >
          <span className="ev-hdr__grip" aria-hidden="true" />
          <nav aria-label="Мобильная навигация">
            <Link className="ev-hdr__sheet-cta" href={HEADER_CATALOG_LINK.href} onClick={close}>
              <span>{HEADER_CATALOG_LINK.label}</span>
              <ArrowIcon />
            </Link>

            <span className="ev-hdr__eyebrow ev-hdr__sheet-eyebrow">Комнаты</span>
            <div className="ev-hdr__room-grid">
              {HEADER_ROOM_LINKS.map((room, index) => (
                <Link
                  key={room.label}
                  className="ev-hdr__room-card"
                  href={room.href}
                  onClick={close}
                  style={{ animationDelay: `${90 + index * 45}ms` }}
                >
                  <img src={room.poster} width="440" height="550" alt="" loading="lazy" />
                  <span className="ev-hdr__room-chip">{room.label}</span>
                </Link>
              ))}
            </div>

            <div className="ev-hdr__tile-row">
              <Link className="ev-hdr__tile" href={HEADER_SEARCH_LINK.href} onClick={close}>
                <SearchIcon />
                <span>{HEADER_SEARCH_LINK.label}</span>
              </Link>
              <Link className="ev-hdr__tile" href={HEADER_ACCOUNT_LINK.href} onClick={close}>
                <UserIcon />
                <span>{HEADER_ACCOUNT_LINK.label}</span>
              </Link>
              <Link className="ev-hdr__tile" href={HEADER_CART_HREF} onClick={close}>
                <BagIcon />
                <span>{cartLabel(cartCount)}</span>
              </Link>
            </div>
          </nav>
        </div>
      )}

      <LiquidGlassDefs id={GLASS_FILTER_ID} mapRef={glassMapRef} />
    </header>
  );
}
