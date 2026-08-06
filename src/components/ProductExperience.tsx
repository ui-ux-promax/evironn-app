import { motion, useReducedMotion } from 'framer-motion';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  FiArrowUpRight,
  FiCheck,
  FiChevronDown,
  FiDroplet,
  FiLayers,
  FiShield,
  FiX,
} from 'react-icons/fi';
import {
  addProductToCart,
  dragHintForInput,
  PRODUCT_SCENE_BACKGROUND,
  PRODUCT_SCENE_CHAIRS,
  toggleAccordion,
  UPHOLSTERY_OPTIONS,
  WOOD_OPTIONS,
  type AccordionKey,
} from './productPageState';
import { coalesceVideoSeek, videoTimeFromDrag } from './productVideo360';
import { createFurnitureCaptionVariants } from './furnitureCaptionMotion';
import { FeaturedProducts } from './FeaturedProducts';
import './ProductExperience.css';

const ACCORDION_ITEMS: Array<{
  id: AccordionKey;
  label: string;
  content: string;
}> = [
  {
    id: 'description',
    label: 'Описание',
    content:
      'Кресло Graphite сочетает мягкую посадку, выразительную графитовую обивку и надёжный каркас из тёмного ореха.',
  },
  {
    id: 'ideal-for',
    label: 'Идеально для',
    content:
      'Чтения у окна, тихих разговоров и небольших жилых пространств, которым нужен один выразительный предмет.',
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

export function ProductExperience() {
  const reducedMotion = Boolean(useReducedMotion());
  const [selectedUpholstery, setSelectedUpholstery] =
    useState<(typeof UPHOLSTERY_OPTIONS)[number]['id']>('ivory');
  const [selectedWood, setSelectedWood] =
    useState<(typeof WOOD_OPTIONS)[number]['id']>('walnut');
  const [is360Active, setIs360Active] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<AccordionKey | null>(
    'description',
  );
  const [cartCount, setCartCount] = useState(0);
  const [roomNotice, setRoomNotice] = useState('');
  const productVideoRef = useRef<HTMLVideoElement>(null);
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
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [is360Active]);

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

  const handleVideoPointerDown = (
    event: ReactPointerEvent<HTMLVideoElement>,
  ) => {
    const video = event.currentTarget;
    const previousDrag = videoDragRef.current;
    if (previousDrag.frameRequest !== null)
      cancelAnimationFrame(previousDrag.frameRequest);
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

  const handleVideoPointerMove = (
    event: ReactPointerEvent<HTMLVideoElement>,
  ) => {
    const drag = videoDragRef.current;
    const video = event.currentTarget;
    if (!drag.active || !video.duration) return;

    const width = video.getBoundingClientRect().width;
    const nextTime = videoTimeFromDrag(
      drag.startTime,
      event.clientX - drag.startX,
      width,
      video.duration,
    );
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
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const selectedUpholsteryLabel = UPHOLSTERY_OPTIONS.find(
    (option) => option.id === selectedUpholstery,
  )?.label;
  const selectedWoodLabel = WOOD_OPTIONS.find(
    (option) => option.id === selectedWood,
  )?.label;
  const productSceneChair =
    PRODUCT_SCENE_CHAIRS[selectedUpholstery][selectedWood];
  const modalCaptionVariant = (order: number) =>
    createFurnitureCaptionVariants(order, 0.08, reducedMotion);

  return (
    <>
      <main
        className={`product-page${is360Active ? ' is-360-active' : ''}`}
        lang="ru"
      >
        <section
          className="product-page__scene"
          style={
            {
              '--product-scene-background': `url('${PRODUCT_SCENE_BACKGROUND}')`,
            } as React.CSSProperties
          }
          aria-label="Графитовое кресло с каркасом из тёмного ореха в интерьере"
        >
          <img
            className="product-page__scene-chair"
            src={productSceneChair}
            alt=""
            aria-hidden="true"
          />
          <button
            className="product-page__360-launch"
            type="button"
            onClick={() => setIs360Active(true)}
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
            <div
              className="product-page__360-modal-backdrop"
              onClick={close360}
            >
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
                      89 990 ₽
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
                    Мягкое кресло с графитовой обивкой и каркасом из тёмного
                    ореха для спокойных жилых пространств.
                  </motion.p>
                  <motion.button
                    className={`product-page__360-add-button${cartCount > 0 ? ' is-added' : ''}`}
                    type="button"
                    onClick={() =>
                      setCartCount((count) => addProductToCart(count))
                    }
                    initial={reducedMotion ? false : 'hidden'}
                    animate="visible"
                    variants={modalCaptionVariant(5)}
                  >
                    <span>
                      {cartCount > 0
                        ? `В корзине (${cartCount})`
                        : 'Добавить в корзину'}
                    </span>
                    <FiArrowUpRight aria-hidden="true" />
                  </motion.button>
                </div>
                <div className="product-page__360-viewer">
                  <button
                    className="product-page__360-close"
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
                      initial={
                        reducedMotion ? false : { opacity: 0, scale: 0.84 }
                      }
                      animate={{ opacity: 0.28, scale: 1 }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.9,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      aria-hidden="true"
                    />
                    {is360Active ? (
                      <motion.video
                        key="graphite-walnut-360"
                        className="product-page__product-media"
                        ref={productVideoRef}
                        initial={reducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: reducedMotion ? 0 : 0.35 }}
                        src="/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm"
                        poster="/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png"
                        preload="auto"
                        muted
                        autoPlay
                        loop
                        playsInline
                        onLoadedMetadata={(event) => {
                          setIsVideoReady(true);
                          setRoomNotice('');
                          event.currentTarget.currentTime = 0;
                        }}
                        onError={() => {
                          setIsVideoReady(false);
                          setIsVideoPlaying(false);
                          setRoomNotice('Не удалось загрузить режим 360°');
                        }}
                        onTimeUpdate={(event) => {
                          const video = event.currentTarget;
                          if (video.duration)
                            setVideoProgress(
                              video.currentTime / video.duration,
                            );
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
                    {is360Active ? (
                      <div className="product-page__video-controls">
                        <button
                          type="button"
                          onClick={toggleVideoPlayback}
                          disabled={!isVideoReady}
                        >
                          {isVideoPlaying ? 'Пауза' : 'Продолжить'}
                        </button>
                        <span>
                          {isVideoReady ? dragHint : 'Загрузка видео…'}
                        </span>
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
          initial={
            reducedMotion ? false : { opacity: 0, x: 26, filter: 'blur(10px)' }
          }
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{
            duration: reducedMotion ? 0 : 0.65,
            delay: reducedMotion ? 0 : 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="product-page__panel-inner">
            <div className="product-page__price-row">
              <div>
                <span className="product-page__price">89 990 ₽</span>
                <span className="product-page__old-price">109 990 ₽</span>
              </div>
              <span className="product-page__delivery">3-4 недели</span>
            </div>

            <h1>Кресло Graphite</h1>
            <p className="product-page__description">
              Мягкое кресло с графитовой обивкой и каркасом из тёмного ореха для
              спокойных жилых пространств.
            </p>

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
                      style={
                        {
                          '--swatch-color': option.color,
                        } as React.CSSProperties
                      }
                      aria-label={`Обивка: ${option.label}`}
                      aria-pressed={selectedUpholstery === option.id}
                      disabled={option.disabled}
                      onClick={() => setSelectedUpholstery(option.id)}
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
                      style={
                        {
                          '--swatch-color': option.color,
                        } as React.CSSProperties
                      }
                      aria-label={`Дерево: ${option.label}`}
                      aria-pressed={selectedWood === option.id}
                      disabled={option.disabled}
                      onClick={() => setSelectedWood(option.id)}
                    >
                      <span aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <button
              className={`product-page__add-button${cartCount > 0 ? ' is-added' : ''}`}
              type="button"
              onClick={() => setCartCount((count) => addProductToCart(count))}
            >
              {cartCount > 0
                ? `В корзине (${cartCount})`
                : 'Добавить в корзину'}
            </button>

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
                  <div
                    className={`product-page__accordion${isOpen ? ' is-open' : ''}`}
                    key={item.id}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenAccordion((open) =>
                          toggleAccordion(open, item.id),
                        )
                      }
                    >
                      <span>{item.label}</span>
                      <FiChevronDown aria-hidden="true" />
                    </button>
                    {isOpen ? <p>{item.content}</p> : null}
                  </div>
                );
              })}
            </div>

            <a className="product-page__catalog-link" href="/">
              Вернуться к коллекции <FiArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </motion.aside>
      </main>
      <FeaturedProducts heading="Также смотрят" />
    </>
  );
}
