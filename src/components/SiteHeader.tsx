import { useEffect, useRef, useState } from 'react';
import logoUrl from '../assets/evironn-logo.svg';
import './SiteHeader.css';

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glassMapRef = useRef<SVGFEImageElement>(null);
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    const condenseOn = 64;
    const condenseOff = 24;
    let ticking = false;
    let condensed = false;

    const update = () => {
      ticking = false;
      const sp = window.scrollY;
      if (!condensed && sp > condenseOn) {
        condensed = true;
        setIsCondensed(true);
      } else if (condensed && sp < condenseOff) {
        condensed = false;
        setIsCondensed(false);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    condensed = window.scrollY > condenseOn;
    setIsCondensed(condensed);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Liquid glass map — builds SVG displacement map for backdrop-filter
  useEffect(() => {
    const buildGlassMap = (width: number, height: number) => {
      const radius = Math.round(Math.min(width, height) / 2);
      const inset = Math.min(width, height) * 0.035;
      const svg =
        '<svg viewBox="0 0 ' +
        width +
        ' ' +
        height +
        '" xmlns="' +
        ['http', '://www.w3.org/2000/svg'].join('') +
        '">' +
        '<defs><linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
        '<linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs>' +
        '<rect x="0" y="0" width="' +
        width +
        '" height="' +
        height +
        '" fill="black"/>' +
        '<rect x="0" y="0" width="' +
        width +
        '" height="' +
        height +
        '" rx="' +
        radius +
        '" fill="url(#red)"/>' +
        '<rect x="0" y="0" width="' +
        width +
        '" height="' +
        height +
        '" rx="' +
        radius +
        '" fill="url(#blue)" style="mix-blend-mode:difference"/>' +
        '<rect x="' +
        inset +
        '" y="' +
        inset +
        '" width="' +
        (width - inset * 2) +
        '" height="' +
        (height - inset * 2) +
        '" rx="' +
        radius +
        '" fill="hsl(0 0% 50% / .93)" style="filter:blur(11px)"/>' +
        '</svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(svg);
    };

    const syncGlassMap = () => {
      const inner = innerRef.current;
      const glassMap = glassMapRef.current;
      if (!inner || !glassMap) return;
      const bounds = inner.getBoundingClientRect();
      const mapUri = buildGlassMap(
        Math.max(1, Math.round(bounds.width)),
        Math.max(1, Math.round(bounds.height)),
      );
      glassMap.setAttribute('href', mapUri);
      glassMap.setAttributeNS(
        ['http', '://www.w3.org/1999/xlink'].join(''),
        'href',
        mapUri,
      );
    };

    syncGlassMap();
    const inner = innerRef.current;
    let ro: ResizeObserver | undefined;
    if (inner && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncGlassMap);
      ro.observe(inner);
    }
    window.addEventListener('resize', syncGlassMap, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', syncGlassMap);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      id="evironn-header"
      lang="ru"
      className={isCondensed ? 'is-condensed' : ''}
    >
      <div className="od-header-inner" ref={innerRef}>
        <a className="od-logo-link" href="/" aria-label="Evironn">
          <img
            className="od-logo"
            src={logoUrl}
            width="248"
            height="72"
            alt="Evironn"
          />
        </a>
        <button
          className="od-menu-toggle"
          type="button"
          aria-label="Открыть меню"
        >
          <span className="od-menu-icon" aria-hidden="true"></span>
        </button>
        <nav className="od-primary-nav" aria-label="Основная навигация">
          <a href="#">Вся мебель</a>
          <a href="#">Гостиная</a>
          <a href="#">Столовая</a>
          <a href="#">Спальня</a>
          <a href="#">Терраса</a>
        </nav>
        <div className="od-actions">
          <a className="od-utility-action" href="#">
            Поиск
          </a>
          <a className="od-utility-action" href="#">
            Аккаунт
          </a>
          <a className="od-bag" href="#">
            Корзина (0)
          </a>
        </div>
      </div>
      <svg
        className="od-nav-glass-defs"
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
      >
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
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              xChannelSelector="R"
              yChannelSelector="B"
              scale="-50"
              result="dispRed"
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="red"
            />
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
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
    </header>
  );
}
