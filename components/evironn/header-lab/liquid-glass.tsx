'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Displacement map for the liquid-glass backdrop filter: a red horizontal ramp
 * and a blue vertical ramp differenced into a rounded-rect lens, with a blurred
 * inner plate so only the rim refracts. Ported from the approved storefront
 * header so the capsule reads exactly like the production bar.
 */
export function buildGlassMap(width: number, height: number): string {
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

/** Keeps the displacement map sized to the element the filter is applied to. */
export function useLiquidGlassMap(targetRef: RefObject<HTMLElement | null>) {
  const mapRef = useRef<SVGFEImageElement>(null);

  useLayoutEffect(() => {
    const sync = () => {
      const target = targetRef.current;
      const map = mapRef.current;
      if (!target || !map) return;
      const bounds = target.getBoundingClientRect();
      const uri = buildGlassMap(Math.max(1, Math.round(bounds.width)), Math.max(1, Math.round(bounds.height)));
      map.setAttribute('href', uri);
      map.setAttributeNS('http://www.w3.org/1999/xlink', 'href', uri);
    };

    sync();
    const target = targetRef.current;
    let observer: ResizeObserver | undefined;
    if (target && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(sync);
      observer.observe(target);
    }
    window.addEventListener('resize', sync, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [targetRef]);

  return mapRef;
}

/**
 * Filter definitions for the liquid-glass backdrop. Three displacement passes at
 * slightly different scales give the chromatic fringe at the rim.
 */
export function LiquidGlassDefs({ id, mapRef }: { id: string; mapRef: RefObject<SVGFEImageElement> }) {
  return (
    <svg className="ev-hdr__glass-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" ref={mapRef} />
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
          <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
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
  );
}
