const footerGroups = [
  {
    label: 'Explore',
    links: [
      { href: '/catalog', label: 'Catalog' },
      { href: '/blog', label: 'Journal' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' },
      { href: '/legal/delivery', label: 'Delivery' },
    ],
  },
] as const;

export function PrototypeFooter() {
  return (
    <footer className="evp-footer">
      <div className="evp-footer__inner">
        <div>
          <p className="evp-footer__wordmark">Evironn</p>
          <p className="evp-footer__note">
            Furniture shaped by material, light, and time.
          </p>
        </div>
        <nav className="evp-footer__nav" aria-label="Footer navigation">
          {footerGroups.map((group) => (
            <div key={group.label}>
              <p className="evp-footer__label">{group.label}</p>
              {group.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
