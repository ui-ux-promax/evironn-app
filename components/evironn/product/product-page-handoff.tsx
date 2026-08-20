'use client';

import { useEffect, useState } from 'react';
import type { ShowcaseProductPageDto } from '@/lib/showcase-product';
import ProductPage from './ProductPage';
import { ProductPageLoadingFallback } from './product-page-loading-fallback';

const FIRST_VIEWPORT_READY_TIMEOUT_MS = 5_000;

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

function waitForNextPaint(callback: () => void) {
  window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
}

export function ProductPageHandoff({ model }: { model: ShowcaseProductPageDto }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      waitForNextPaint(() => {
        if (!cancelled) setIsReady(true);
      });
    };
    const timeoutId = window.setTimeout(reveal, FIRST_VIEWPORT_READY_TIMEOUT_MS);
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    void Promise.all([fontsReady, preloadImage(model.sceneBackgroundUrl), preloadImage(model.selected.chairUrl)]).then(
      reveal,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [model.sceneBackgroundUrl, model.selected.chairUrl]);

  return (
    <>
      {isReady ? null : <ProductPageLoadingFallback />}
      <div hidden={!isReady} aria-hidden={!isReady}>
        <ProductPage model={model} />
      </div>
    </>
  );
}
