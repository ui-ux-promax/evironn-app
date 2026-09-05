import Link from 'next/link';

import {
  cartLabel,
  HEADER_ACCOUNT_LINK,
  HEADER_CART_HREF,
  HEADER_PRIMARY_LINKS,
  HEADER_SEARCH_LINK,
} from './header-nav-data';

/**
 * Approved desktop chrome, shared by every variant so the exploration only
 * changes the mobile experience.
 */
export function HeaderDesktopChrome({ cartCount }: { cartCount: number }) {
  return (
    <>
      <nav className="ev-hdr__nav" aria-label="Основная навигация">
        {HEADER_PRIMARY_LINKS.map((link) => (
          <Link key={link.label} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ev-hdr__actions">
        <Link className="ev-hdr__utility" href={HEADER_SEARCH_LINK.href}>
          {HEADER_SEARCH_LINK.label}
        </Link>
        <Link className="ev-hdr__utility" href={HEADER_ACCOUNT_LINK.href}>
          {HEADER_ACCOUNT_LINK.label}
        </Link>
        <Link className="ev-hdr__bag" href={HEADER_CART_HREF}>
          {cartLabel(cartCount)}
        </Link>
      </div>
    </>
  );
}

export function HeaderLogo() {
  return (
    <Link className="ev-hdr__logo" href="/" aria-label="Evironn">
      <img src="/assets/evironn-logo.svg" width="248" height="72" alt="Evironn" />
    </Link>
  );
}
