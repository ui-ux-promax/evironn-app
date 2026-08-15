'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { FiArrowUpRight, FiCheck, FiChevronDown, FiDroplet, FiLayers, FiShield, FiX } from 'react-icons/fi';
import { PUBLIC_ROUTES } from '@/components/evironn/public-routes';
import type { ShowcaseProductPageDto, ShowcaseUpholsteryId, ShowcaseWoodId } from '@/lib/showcase-product';
import {
  dragHintForInput,
  toggleAccordion,
  UPHOLSTERY_OPTIONS,
  WOOD_OPTIONS,
  type AccordionKey,
} from './productPageState';
import { coalesceVideoSeek, videoTimeFromDrag } from './productVideo360';
import { createFurnitureCaptionVariants } from '@/components/evironn/home/furniture-caption-motion';
import { InteractiveFurnitureCards } from '@/components/evironn/home/interactive-furniture-cards';
import { useCartStore } from '@/store';

const ACCORDION_ITEMS: Array<{ id: AccordionKey; label: string; content: string }> = [
  {
    id: 'description',
    label: 'Описание',
    content:
      'Кресло Graphite сочетает мягкую посадку, выразительную графитовую обивку и надёжный каркас из тёмного ореха.',
  },
  {
    id: 'ideal-for',
    label: 'Идеально для',
    content: 'Чтения у окна, тихих разговоров и небольших жилых пространств, которым нужен один выразительный предмет.',
  },
  {
    id: 'care',
    label: 'Уход',
    content:
      'Удаляйте пыль мягкой щёткой, а локальные загрязнения промакивайте влажной тканью без агрессивных средств.',
  },
  {
    id: 'style',
    label: 'Стиль',
    content:
      'Графитовая обивка и тёмный орех легко сочетаются с минимализмом, скандинавскими и современными интерьерами.',
  },
];

const BENEFITS = [
  { icon: FiDroplet, label: 'Легко чистится' },
  { icon: FiShield, label: 'Водоотталкивающая ткань' },
  { icon: FiLayers, label: 'Износостойкая ткань' },
];

const PRODUCT_FEATURES = [
  'Мягкая фактурная ткань для комфорта',
  'Цельный каркас из тёмного ореха',
  'Надёжное основание из массива дерева',
  'Упругая пена для поддержки',
];

export function ProductPage({ model }: { model: ShowcaseProductPageDto }) {
  const framerReducedMotion = Boolean(useReducedMotion());
  const [mediaReducedMotion, setMediaReducedMotion] = useState(false);
  const reducedMotion = framerReducedMotion || mediaReducedMotion;
  const [selectedUpholstery, setSelectedUpholstery] = useState<ShowcaseUpholsteryId>(model.selected.upholstery);
  const [selectedWood, setSelectedWood] = useState<ShowcaseWoodId>(model.selected.wood);
  const [is360Active, setIs360Active] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<AccordionKey | null>('description');
  const [roomNotice, setRoomNotice] = useState('');
  const [isVideoFailed, setIsVideoFailed] = useState(false);
  const productVideoRef = useRef<HTMLVideoElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoDragRef = useRef({
    active: false,
    startX: 0,
    startTime: 0,
    pendingTime: null as number | null,
    frameRequest: null as number | null,
  });
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const addCartItem = useCartStore((state) => state.addCartItem);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartAddError, setCartAddError] = useState<string | null>(null);

  const currentCombination = model.combinations.find(
    (combination) => combination.upholstery === selectedUpholstery && combination.wood === selectedWood,
  )!;

  const handleAddToCart = async () => {
    if (isAddingToCart || currentCombination.sku.stock <= 0) return;
    setIsAddingToCart(true);
    setCartAddError(null);
    try {
      await addCartItem({ skuId: currentCombination.sku.id, quantity: 1 });
    } catch {
      setCartAddError('Не удалось добавить товар в корзину');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const selectCombination = (upholstery: ShowcaseUpholsteryId, wood: ShowcaseWoodId) => {
    const next = model.combinations.find(
      (combination) => combination.upholstery === upholstery && combination.wood === wood,
    );
    if (!next) return;
    setSelectedUpholstery(upholstery);
    setSelectedWood(wood);
    window.history.replaceState(null, '', next.canonicalPath);
  };

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMediaReducedMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  const [dragHint, setDragHint] = useState('Потяни кресло мышью');

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: coarse)');
    const updateDragHint = () => {
      setDragHint(
        dragHintForInput({
          isCoarse: pointerQuery.matches,
          maxTouchPoints: navigator.maxTouchPoints,
        }),
      );
    };

    updateDragHint();
    pointerQuery.addEventListener?.('change', updateDragHint);
    return () => pointerQuery.removeEventListener?.('change', updateDragHint);
  }, []);

  const close360 = () => {
    setIs360Active(false);
  };

  useEffect(() => {
    if (!is360Active) return;
    const video = productVideoRef.current;
    if (!video || reducedMotion || isVideoFailed) return;
    video.currentTime = 0;
    try {
      const playback = video.play();
      if (playback) void playback.catch(() => undefined);
    } catch {
      // Browser may reject playback before user interaction.
    }
  }, [is360Active, isVideoFailed, reducedMotion]);

  useEffect(() => {
    if (!is360Active) return;

    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [is360Active]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !is360Active) return;
      close360();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [is360Active]);

  useEffect(() => {
    if (!is360Active) return;
    closeButtonRef.current?.focus();

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => {
      window.removeEventListener('keydown', handleTab);
      launchButtonRef.current?.focus();
    };
  }, [is360Active]);

  const handleVideoPointerDown = (event: ReactPointerEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const previousDrag = videoDragRef.current;
    if (previousDrag.frameRequest !== null) cancelAnimationFrame(previousDrag.frameRequest);
    video.setPointerCapture(event.pointerId);
    videoDragRef.current = {
      active: true,
      startX: event.clientX,
      startTime: video.currentTime,
      pendingTime: null,
      frameRequest: null,
    };
    video.pause();
    setIsVideoPlaying(false);
  };

  const flushVideoSeek = (video: HTMLVideoElement) => {
    const drag = videoDragRef.current;
    if (drag.frameRequest !== null) return;

    drag.frameRequest = requestAnimationFrame(() => {
      drag.frameRequest = null;
      if (drag.pendingTime === null || video.seeking) return;

      const nextTime = drag.pendingTime;
      drag.pendingTime = null;
      video.currentTime = nextTime;
      setVideoProgress(nextTime / video.duration);
    });
  };

  const handleVideoPointerMove = (event: ReactPointerEvent<HTMLVideoElement>) => {
    const drag = videoDragRef.current;
    const video = event.currentTarget;
    if (!drag.active || !video.duration) return;

    const width = video.getBoundingClientRect().width;
    const nextTime = videoTimeFromDrag(drag.startTime, event.clientX - drag.startX, width, video.duration);
    const seek = coalesceVideoSeek(video.seeking, drag.pendingTime, nextTime);
    drag.pendingTime = seek.time;
    if (seek.shouldSeek) flushVideoSeek(video);
  };

  const handleVideoSeeked = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (videoDragRef.current.pendingTime !== null) flushVideoSeek(video);
  };

  const handleVideoPointerUp = (event: ReactPointerEvent<HTMLVideoElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    videoDragRef.current.active = false;
    flushVideoSeek(event.currentTarget);
  };

  const toggleVideoPlayback = () => {
    const video = productVideoRef.current;
    if (!video || !isVideoReady) return;
    if (video.paused) {
      try {
        const playback = video.play();
        if (playback) void playback.catch(() => undefined);
      } catch {
        // Browser may reject playback before user interaction.
      }
    } else {
      video.pause();
    }
  };

  const selectedUpholsteryLabel = UPHOLSTERY_OPTIONS.find((option) => option.id === selectedUpholstery)?.label;
  const selectedWoodLabel = WOOD_OPTIONS.find((option) => option.id === selectedWood)?.label;
  const modalCaptionVariant = (order: number) => createFurnitureCaptionVariants(order, 0.08, reducedMotion);

  return (
    <>
      <main className={`product-page${is360Active ? ' is-360-active' : ''}`} lang="ru">
        <section
          className="product-page__scene"
          style={{ '--product-scene-background': `url('${model.sceneBackgroundUrl}')` } as React.CSSProperties}
          aria-label="Графитовое кресло с каркасом из тёмного ореха в интерьере"
        >
          <img className="product-page__scene-chair" src={currentCombination.chairUrl} alt="" aria-hidden="true" />
          <button
            className="product-page__360-launch"
            ref={launchButtonRef}
            type="button"
            onClick={() => {
              setIsVideoFailed(false);
              setRoomNotice('');
              setIs360Active(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={is360Active}
          >
            <span className="product-page__360-launch-icon" aria-hidden="true">
              ↻
            </span>
            <span>Смотреть кресло в 360°</span>
            <FiArrowUpRight aria-hidden="true" />
          </button>

          {is360Active ? (
            <div className="product-page__360-modal-backdrop" onClick={close360}>
              <section
                className="product-page__360-modal variant-editorial-split"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-page-360-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="product-page__360-info">
                  <div className="product-page__360-info-topline">
                    <motion.span
                      className="product-page__360-eyebrow"
                      initial={reducedMotion ? false : 'hidden'}
                      animate="visible"
                      variants={modalCaptionVariant(0)}
                    >
                      Evironn · lounge chair
                    </motion.span>
                    <motion.span
                      className="product-page__360-price"
                      initial={reducedMotion ? false : 'hidden'}
                      animate="visible"
                      variants={modalCaptionVariant(1)}
                    >
                      {currentCombination.sku.priceLabel}
                    </motion.span>
                  </div>
                  <h2 id="product-page-360-title">
                    <motion.span
                      className="product-page__360-title-token"
                      initial={reducedMotion ? false : 'hidden'}
                      animate="visible"
                      variants={modalCaptionVariant(2)}
                    >
                      Кресло
                    </motion.span>{' '}
                    <motion.span
                      className="product-page__360-title-token"
                      initial={reducedMotion ? false : 'hidden'}
                      animate="visible"
                      variants={modalCaptionVariant(3)}
                    >
                      Graphite
                    </motion.span>
                  </h2>
                  <motion.p
                    initial={reducedMotion ? false : 'hidden'}
                    animate="visible"
                    variants={modalCaptionVariant(4)}
                  >
                    {model.product.description}
                  </motion.p>
                  <motion.button
                    className="product-page__360-add-button"
                    type="button"
                    onClick={() => void handleAddToCart()}
                    disabled={isAddingToCart || currentCombination.sku.stock <= 0}
                    aria-busy={isAddingToCart}
                    initial={reducedMotion ? false : 'hidden'}
                    animate="visible"
                    variants={modalCaptionVariant(5)}
                  >
                    <span>Добавить в корзину</span>
                    <FiArrowUpRight aria-hidden="true" />
                  </motion.button>
                </div>
                <div className="product-page__360-viewer">
                  <button
                    className="product-page__360-close"
                    ref={closeButtonRef}
                    type="button"
                    onClick={close360}
                    aria-label="Закрыть режим 360"
                  >
                    <FiX aria-hidden="true" />
                  </button>

                  <div
                    className={`product-page__product-stage${is360Active ? ' is-visible' : ' is-hidden'}`}
                    aria-live="polite"
                  >
                    <motion.div
                      className="product-page__product-shadow"
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.84 }}
                      animate={{ opacity: 0.28, scale: 1 }}
                      transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
                      aria-hidden="true"
                    />
                    {is360Active && isVideoFailed ? (
                      <img
                        className="product-page__product-media product-page__product-media--fallback"
                        data-testid="product-page-360-fallback"
                        src={model.turntable.fallbackUrl}
                        alt={model.turntable.alt}
                        data-media-state={isVideoFailed ? 'visible' : 'hidden'}
                      />
                    ) : null}
                    {is360Active && !isVideoFailed ? (
                      <motion.video
                        key="graphite-walnut-360"
                        className="product-page__product-media"
                        ref={productVideoRef}
                        initial={reducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: reducedMotion ? 0 : 0.35 }}
                        src={model.turntable.videoUrl}
                        poster={model.turntable.posterUrl}
                        preload="auto"
                        muted
                        autoPlay={!reducedMotion}
                        loop={!reducedMotion}
                        playsInline
                        onLoadedMetadata={(event) => {
                          setIsVideoReady(true);
                          setRoomNotice('');
                          event.currentTarget.currentTime = 0;
                        }}
                        onError={() => {
                          setIsVideoReady(false);
                          setIsVideoPlaying(false);
                          setIsVideoFailed(true);
                          setRoomNotice('360° недоступен, показано статичное изображение');
                        }}
                        onTimeUpdate={(event) => {
                          const video = event.currentTarget;
                          if (video.duration) setVideoProgress(video.currentTime / video.duration);
                        }}
                        onSeeked={handleVideoSeeked}
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                        onPointerDown={handleVideoPointerDown}
                        onPointerMove={handleVideoPointerMove}
                        onPointerUp={handleVideoPointerUp}
                        onPointerCancel={handleVideoPointerUp}
                        aria-label="Графитовое кресло с каркасом из тёмного ореха в режиме 360 градусов"
                      />
                    ) : null}
                    {is360Active && !isVideoFailed ? (
                      <div className="product-page__video-controls">
                        <button type="button" onClick={toggleVideoPlayback} disabled={!isVideoReady}>
                          {isVideoPlaying ? 'Пауза' : 'Продолжить'}
                        </button>
                        <span>{isVideoReady ? dragHint : 'Загрузка видео…'}</span>
                        <span>{Math.round(videoProgress * 100)}%</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {roomNotice ? (
            <p className="product-page__room-notice" role="status">
              {roomNotice}
            </p>
          ) : null}
        </section>

        <motion.aside
          className="product-page__panel"
          aria-hidden={is360Active}
          aria-label="Карточка товара"
          initial={reducedMotion ? false : { opacity: 0, x: 26, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="product-page__panel-inner">
            <div className="product-page__price-row">
              <div>
                <span className="product-page__price">{currentCombination.sku.priceLabel}</span>
                {currentCombination.sku.oldPriceLabel ? (
                  <span className="product-page__old-price">{currentCombination.sku.oldPriceLabel}</span>
                ) : null}
              </div>
              <span className="product-page__delivery">
                {currentCombination.sku.stock > 0 ? `В наличии: ${currentCombination.sku.stock}` : 'Нет в наличии'}
              </span>
            </div>

            <h1>{model.product.name}</h1>
            <p className="product-page__description">{model.product.description}</p>

            <div className="product-page__selectors">
              <fieldset>
                <legend>
                  Обивка <strong>{selectedUpholsteryLabel}</strong>
                </legend>
                <div className="product-page__swatches">
                  {UPHOLSTERY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={`product-page__swatch${selectedUpholstery === option.id ? ' is-selected' : ''}`}
                      type="button"
                      style={{ '--swatch-color': option.color } as React.CSSProperties}
                      aria-label={`Обивка: ${option.label}`}
                      aria-pressed={selectedUpholstery === option.id}
                      disabled={option.disabled}
                      onClick={() => selectCombination(option.id, selectedWood)}
                    >
                      <span aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>
                  Дерево <strong>{selectedWoodLabel}</strong>
                </legend>
                <div className="product-page__swatches">
                  {WOOD_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={`product-page__swatch${selectedWood === option.id ? ' is-selected' : ''}`}
                      type="button"
                      style={{ '--swatch-color': option.color } as React.CSSProperties}
                      aria-label={`Дерево: ${option.label}`}
                      aria-pressed={selectedWood === option.id}
                      disabled={option.disabled}
                      onClick={() => selectCombination(selectedUpholstery, option.id)}
                    >
                      <span aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <button
              className="product-page__add-button"
              type="button"
              onClick={() => void handleAddToCart()}
              disabled={isAddingToCart || currentCombination.sku.stock <= 0}
              aria-busy={isAddingToCart}
            >
              Добавить в корзину
            </button>
            {cartAddError ? (
              <p className="product-page__cart-error" role="alert">
                {cartAddError}
              </p>
            ) : null}

            <div className="product-page__benefits" aria-label="Преимущества">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <div key={label} className="product-page__benefit">
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <ul className="product-page__feature-list">
              {PRODUCT_FEATURES.map((feature) => (
                <li key={feature}>
                  <FiCheck aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="product-page__accordions">
              {ACCORDION_ITEMS.map((item) => {
                const isOpen = openAccordion === item.id;
                return (
                  <div className={`product-page__accordion${isOpen ? ' is-open' : ''}`} key={item.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenAccordion((open) => toggleAccordion(open, item.id))}
                    >
                      <span>{item.label}</span>
                      <FiChevronDown aria-hidden="true" />
                    </button>
                    {isOpen ? <p>{item.content}</p> : null}
                  </div>
                );
              })}
            </div>

            <Link className="product-page__catalog-link" href={PUBLIC_ROUTES.catalog}>
              Вернуться к коллекции <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </motion.aside>
      </main>
      <InteractiveFurnitureCards heading="Также смотрят" />
    </>
  );
}

export default ProductPage;
