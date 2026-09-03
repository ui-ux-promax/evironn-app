'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { catalogRoomPath } from '@/components/evironn/public-routes';
import { HeroProductCard } from './hero-product-card';
import { HeroProductMedia, selectHeroVideoSource, type HeroPlaybackUnavailable } from './hero-product-media';
import { HeroRoomMedia } from './hero-room-media';
import { createHeroRoomMediaCache, type HeroPreparationMode } from './hero-room-preload';
import { HERO_PRODUCTS } from './hero-products';
import { HERO_ROOM_OPTIONS, HERO_ROOMS } from './hero-rooms';
import {
  completeHeroForward,
  completeHeroReturn,
  cancelHeroProduct,
  getHeroProduct,
  isHeroTransitioning,
  recoverHeroMediaFailure,
  selectHeroProduct,
  shouldRevealHeroProduct,
  startHeroReturn,
  type HeroPhase,
  type HeroProductId,
} from './hero-product-state';
import {
  completeHeroRoomPreparation,
  completeHeroRoomTransition,
  dismissHeroRoomError,
  failHeroRoomPreparation,
  INITIAL_HERO_ROOM_STATE,
  isAvailableHeroRoom,
  isHeroRoomTransitioning,
  recoverHeroRoomTransition,
  requestHeroRoom,
  restartHeroRoomPreparation,
  type HeroRoomId,
  type PilotHeroRoomId,
} from './hero-room-state';

const HERO_ROOM_CATALOG_SLUGS: Record<PilotHeroRoomId, string> = {
  'living-room': 'living',
  kitchen: 'dining',
};

const ROOM_ERROR_MESSAGE = 'Не удалось загрузить комнату. Повторить загрузку?';

export function Hero() {
  const segRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const roomButtonRefs = useRef<Partial<Record<HeroRoomId, HTMLButtonElement>>>({});
  const cache = useState(() => createHeroRoomMediaCache(selectHeroVideoSource))[0];
  const operationRef = useRef(INITIAL_HERO_ROOM_STATE.operationId);
  const playbackGenerationRef = useRef(0);
  const preparationRef = useRef<{
    key: string;
    room: PilotHeroRoomId;
    mode: HeroPreparationMode;
    controller: AbortController;
    operationId: number;
  } | null>(null);
  const posterElementsRef = useRef<Partial<Record<PilotHeroRoomId, HTMLImageElement>>>({});
  const focusBeforePrepareRef = useRef<HTMLElement | null>(null);
  const [roomState, setRoomState] = useState(INITIAL_HERO_ROOM_STATE);
  const [requestedRooms, setRequestedRooms] = useState<readonly PilotHeroRoomId[]>(['living-room']);
  const [posterVersions, setPosterVersions] = useState<Partial<Record<PilotHeroRoomId, number>>>({});
  const [kitchenEnabled, setKitchenEnabled] = useState(false);
  const [stackRoom, setStackRoom] = useState<PilotHeroRoomId>(INITIAL_HERO_ROOM_STATE.activeRoom);
  const [stackFade, setStackFade] = useState<'idle' | 'out' | 'in'>('idle');
  const [phase, setPhase] = useState<HeroPhase>('idle');
  const [cardVisible, setCardVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const roomStateRef = useRef(roomState);
  const reducedMotionRef = useRef(reducedMotion);
  roomStateRef.current = roomState;
  reducedMotionRef.current = reducedMotion;

  const selectedRoom = roomState.targetRoom ?? roomState.activeRoom;
  const activeRoom = HERO_ROOMS[roomState.activeRoom];
  const visualRoom = HERO_ROOMS[stackRoom];
  const roomChanging = isHeroRoomTransitioning(roomState);
  const productChanging = isHeroTransitioning(phase);
  const preparing = roomState.phase === 'preparing';
  const locked = preparing || roomChanging || productChanging || roomState.phase === 'error';
  const hotspotsVisible = roomState.phase === 'idle' && phase === 'idle';

  useEffect(() => () => cache.dispose(), [cache]);

  useEffect(() => {
    const control = segRef.current;
    if (!control) return;
    const indicator = control.querySelector('.seg-indicator') as HTMLElement;
    if (!indicator) return;
    const move = (item: HTMLElement) => {
      indicator.style.left = item.offsetLeft + 'px';
      indicator.style.width = item.offsetWidth + 'px';
    };
    const activeItem = control.querySelector('.seg-item.active') as HTMLElement;
    if (activeItem) requestAnimationFrame(() => move(activeItem));
    const onResize = () => {
      const item = control.querySelector('.seg-item.active') as HTMLElement;
      if (item) move(item);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [selectedRoom]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const nextOperationId = useCallback(() => {
    operationRef.current += 1;
    return operationRef.current;
  }, []);

  const abortPreparation = useCallback(() => {
    preparationRef.current?.controller.abort();
    preparationRef.current = null;
  }, []);

  const prepareRoom = useCallback(
    (room: PilotHeroRoomId, operationId: number, mode: HeroPreparationMode, direct: boolean) => {
      const key = `${room}:${mode}:${operationId}`;
      if (preparationRef.current?.key === key) return;
      abortPreparation();
      const controller = new AbortController();
      preparationRef.current = { key, room, mode, controller, operationId };
      void cache
        .prepare(room, mode, operationId, controller.signal)
        .then(() => {
          if (preparationRef.current?.key !== key || controller.signal.aborted || operationRef.current !== operationId)
            return;
          preparationRef.current = null;
          if (room === 'living-room') setKitchenEnabled(true);
          setRoomState((current) => {
            if (current.phase !== 'preparing' || current.operationId !== operationId || current.targetRoom !== room)
              return current;
            return completeHeroRoomPreparation(current, operationId);
          });
        })
        .catch((error: unknown) => {
          if (preparationRef.current?.key !== key || controller.signal.aborted) return;
          preparationRef.current = null;
          if (room === 'living-room') setKitchenEnabled(true);
          setRoomState((current) => {
            if (current.phase !== 'preparing' || current.operationId !== operationId || current.targetRoom !== room)
              return current;
            return failHeroRoomPreparation(
              current,
              operationId,
              error instanceof Error ? ROOM_ERROR_MESSAGE : ROOM_ERROR_MESSAGE,
            );
          });
        });
      const currentState = roomStateRef.current;
      if (currentState.phase !== 'preparing' || currentState.operationId !== operationId) {
        setRoomState((current) => requestHeroRoom(current, room, false, direct, operationId));
      }
    },
    [abortPreparation, cache],
  );

  const onPosterElement = useCallback(
    (room: PilotHeroRoomId, image: HTMLImageElement | null) => {
      if (!image || posterElementsRef.current[room] === image) return;
      posterElementsRef.current[room] = image;
      cache.setPoster(room, image);
      const current = preparationRef.current;
      const currentState = roomStateRef.current;
      const currentReducedMotion = reducedMotionRef.current;
      if (
        image &&
        currentState.phase === 'preparing' &&
        currentState.targetRoom === room &&
        (!current || current.room !== room)
      ) {
        prepareRoom(room, currentState.operationId, currentReducedMotion ? 'static' : 'animated', currentState.direct);
      }
    },
    [cache, prepareRoom],
  );

  useEffect(() => {
    if (roomState.phase !== 'preparing' || !roomState.targetRoom) return;
    const mode = reducedMotion ? 'static' : 'animated';
    const current = preparationRef.current;
    if (current && current.mode === mode && current.operationId === roomState.operationId) return;
    prepareRoom(roomState.targetRoom, roomState.operationId, mode, roomState.direct);
  }, [prepareRoom, reducedMotion, roomState.direct, roomState.operationId, roomState.phase, roomState.targetRoom]);

  useEffect(() => {
    if (!preparing) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && heroRef.current?.contains(active)) focusBeforePrepareRef.current = active;
    const status = heroRef.current?.querySelector<HTMLElement>('[role="status"]');
    if (active && active.closest('.furni-hero-controls') && status) status.focus();
  }, [preparing]);

  useEffect(() => {
    if (preparing) return;
    const previous = focusBeforePrepareRef.current;
    if (previous && heroRef.current?.contains(document.activeElement) && document.activeElement === heroRef.current) {
      previous.focus();
    }
    focusBeforePrepareRef.current = null;
  }, [preparing]);

  useEffect(() => {
    if (!roomChanging || !roomState.targetRoom) {
      if (!roomChanging) {
        setStackRoom(roomState.activeRoom);
        setStackFade('idle');
      }
      return;
    }
    const target = roomState.targetRoom;
    if (reducedMotion) {
      setStackRoom(target);
      setStackFade('in');
      return;
    }
    setStackFade('out');
    const moveStack = window.setTimeout(() => {
      setStackRoom(target);
      setStackFade('in');
    }, 360);
    return () => window.clearTimeout(moveStack);
  }, [reducedMotion, roomChanging, roomState.activeRoom, roomState.targetRoom]);

  const handleRoomClick = useCallback(
    (room: HeroRoomId) => {
      if (!isAvailableHeroRoom(room) || roomChanging || productChanging) return;
      const mode = reducedMotion ? 'static' : 'animated';
      const ready = Boolean(cache.get(room, mode));
      if (room === roomState.activeRoom) {
        if (roomState.phase === 'error' && ready) {
          abortPreparation();
          const dismissed = dismissHeroRoomError(roomState, room, ready);
          operationRef.current = dismissed.operationId;
          setRoomState(dismissed);
        }
        return;
      }

      if (room === 'kitchen') setKitchenEnabled(true);
      setRequestedRooms((current) => (current.includes(room) ? current : [...current, room]));
      const operationId = nextOperationId();
      const direct = phase !== 'idle';
      abortPreparation();
      const next = requestHeroRoom(roomState, room, ready, direct, operationId);
      if (next === roomState) return;
      setRoomState(next);
      if (ready) {
        if (direct) {
          setPhase((current) => cancelHeroProduct(current));
          setCardVisible(false);
        }
      } else {
        prepareRoom(room, operationId, mode, direct);
      }
    },
    [
      abortPreparation,
      cache,
      phase,
      prepareRoom,
      productChanging,
      reducedMotion,
      roomChanging,
      roomState,
      nextOperationId,
    ],
  );

  const finishRoomTransition = useCallback((operationId: number) => {
    setRoomState((current) => {
      if (current.phase !== 'changing' || current.operationId !== operationId) return current;
      const completed = completeHeroRoomTransition(current);
      queueMicrotask(() => roomButtonRefs.current[completed.activeRoom]?.focus());
      return completed;
    });
  }, []);

  const handleRoomFailure = useCallback((operationId: number) => {
    setRoomState((current) => {
      if (current.operationId !== operationId || current.phase !== 'changing') return current;
      return recoverHeroRoomTransition(current);
    });
  }, []);

  const handleHeroPlaybackUnavailable = useCallback(
    (failure: HeroPlaybackUnavailable) => {
      if (
        failure.room !== roomState.activeRoom ||
        failure.roomOperationId !== roomState.operationId ||
        failure.playbackGeneration !== playbackGenerationRef.current
      )
        return;
      const expectedPhase =
        failure.stage === 'before-activation' ? recoverHeroMediaFailure(failure.failedPhase) : failure.failedPhase;
      if (phase !== expectedPhase) return;

      abortPreparation();
      cache.invalidateVideoMedia(failure.room, failure.entry.productId, failure.entry.direction);
      const operationId = nextOperationId();
      playbackGenerationRef.current += 1;
      const recovered = recoverHeroMediaFailure(failure.failedPhase);
      setPhase(recovered);
      setCardVisible(recovered !== 'idle');
      setRoomState((current) => ({
        ...current,
        targetRoom: null,
        phase: 'error',
        direct: false,
        operationId,
        error: { room: current.activeRoom, message: ROOM_ERROR_MESSAGE },
      }));
    },
    [abortPreparation, cache, nextOperationId, phase, roomState.activeRoom, roomState.operationId],
  );

  const retryRoom = useCallback(() => {
    if (roomState.phase !== 'error' || !roomState.error || roomState.error.room !== roomState.activeRoom) return;
    const room = roomState.activeRoom;
    const mode = reducedMotion ? 'static' : 'animated';
    const shouldRefreshPoster = !cache.get(room, 'static');
    const operationId = nextOperationId();
    abortPreparation();
    if (shouldRefreshPoster) {
      setPosterVersions((current) => ({ ...current, [room]: (current[room] ?? 0) + 1 }));
    }
    const next = restartHeroRoomPreparation(roomState, operationId);
    setRoomState(next);
    prepareRoom(room, operationId, mode, false);
  }, [abortPreparation, cache, nextOperationId, prepareRoom, reducedMotion, roomState]);

  const activateHeroProduct = useCallback(
    (product: HeroProductId, direction: 'forward' | 'reverse') => {
      if (locked || !activeRoom.productIds.includes(product)) return;
      const prospective = direction === 'forward' ? selectHeroProduct(phase, product) : startHeroReturn(phase);
      if (prospective === phase || reducedMotion) {
        if (reducedMotion && prospective !== phase) {
          playbackGenerationRef.current += 1;
          setPhase(prospective);
        }
        return;
      }
      const playbackGeneration = ++playbackGenerationRef.current;
      const bundle = cache.get(roomState.activeRoom, 'animated');
      const entry = { productId: product, direction } as const;
      if (!bundle || !bundle.videos.has(`${product}:${direction}`) || !cache.get(roomState.activeRoom, 'animated')) {
        handleHeroPlaybackUnavailable({
          room: roomState.activeRoom,
          entry,
          failedPhase: prospective,
          stage: 'before-activation',
          roomOperationId: roomState.operationId,
          playbackGeneration,
        });
        return;
      }
      setCardVisible(false);
      setPhase(prospective);
    },
    [
      activeRoom.productIds,
      cache,
      handleHeroPlaybackUnavailable,
      locked,
      phase,
      reducedMotion,
      roomState.activeRoom,
      roomState.operationId,
    ],
  );

  const selectedId = getHeroProduct(phase);
  const selectedProduct = selectedId ? HERO_PRODUCTS[selectedId] : null;
  const handleProgress = useCallback((currentTime: number, duration: number) => {
    if (shouldRevealHeroProduct(currentTime, duration)) setCardVisible(true);
  }, []);
  const finishForward = useCallback(() => {
    setCardVisible(true);
    setPhase((current) => completeHeroForward(current));
  }, []);
  const finishReverse = useCallback(() => {
    setCardVisible(false);
    setPhase((current) => completeHeroReturn(current));
  }, []);
  const returnToRoom = useCallback(() => {
    const product = getHeroProduct(phase);
    if (product) activateHeroProduct(product, 'reverse');
  }, [activateHeroProduct, phase]);

  return (
    <section
      ref={heroRef}
      id="evironn-hero"
      aria-labelledby="furni-hero-title"
      aria-busy={preparing}
      className="furni-hero-demo"
      data-hero-font="golos-text"
    >
      <HeroRoomMedia
        state={roomState}
        reducedMotion={reducedMotion}
        requestedRooms={requestedRooms}
        posterVersions={posterVersions}
        onPosterElement={onPosterElement}
        onTransitionComplete={finishRoomTransition}
        onTransitionFailure={handleRoomFailure}
      />
      <HeroProductMedia
        cache={cache}
        room={roomState.activeRoom}
        roomOperationId={roomState.operationId}
        playbackGeneration={playbackGenerationRef.current}
        phase={phase}
        reducedMotion={reducedMotion}
        onProgress={handleProgress}
        onForwardComplete={finishForward}
        onReverseComplete={finishReverse}
        onPlaybackUnavailable={handleHeroPlaybackUnavailable}
      />
      <div
        className="furni-hero-controls"
        inert={preparing ? ('true' as unknown as boolean) : undefined}
        data-hero-controls-locked={preparing ? 'true' : 'false'}
      >
        <div
          className={[
            'furni-hero-stack',
            `furni-hero-stack--${visualRoom.id}`,
            stackFade === 'out' ? 'is-room-fading-out' : '',
            stackFade === 'in' ? 'is-room-fading-in' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <article className="furni-hero-panel">
            <h1 className="furni-hero-title" id="furni-hero-title">
              Мебель с душой, созданная поколениями
            </h1>
            <p className="furni-hero-copy">
              Откройте вневременные предметы, созданные нашей семьёй и наполненные теплом традиций и красотой
              натурального дерева.
            </p>
            <div className="furni-hero-actions">
              <Link className="btn btn-dark" href={catalogRoomPath(HERO_ROOM_CATALOG_SLUGS[stackRoom])}>
                СМОТРЕТЬ КОЛЛЕКЦИЮ
              </Link>
              <button className="btn btn-outline" type="button">
                ПОСМОТРЕТЬ ИСТОРИЮ
              </button>
            </div>
          </article>
          <div className="furni-hero-segments">
            <div className="seg-control" ref={segRef} role="group" aria-label="Категория комнаты">
              <div className="seg-indicator" aria-hidden="true" />
              {HERO_ROOM_OPTIONS.map((room) => {
                const selected = room.id === selectedRoom;
                const roomLocked =
                  !room.available ||
                  (room.id === 'kitchen' && !kitchenEnabled) ||
                  preparing ||
                  roomChanging ||
                  productChanging;
                return (
                  <button
                    key={room.id}
                    ref={(node) => {
                      if (node) roomButtonRefs.current[room.id] = node;
                      else delete roomButtonRefs.current[room.id];
                    }}
                    className={`seg-item${selected ? ' active' : ''}`}
                    type="button"
                    aria-pressed={selected}
                    disabled={roomLocked}
                    onClick={() => handleRoomClick(room.id)}
                  >
                    {room.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {activeRoom.productIds.map((productId) => {
          const product = HERO_PRODUCTS[productId];
          return (
            <button
              key={product.id}
              className={['furni-hero-hotspot', product.hotspotClassName, hotspotsVisible ? '' : 'is-hidden']
                .filter(Boolean)
                .join(' ')}
              type="button"
              aria-label={`Смотреть ${product.name}`}
              disabled={locked}
              onClick={() => activateHeroProduct(product.id, 'forward')}
            />
          );
        })}
        <HeroProductCard
          product={selectedProduct}
          visible={cardVisible}
          locked={locked}
          reducedMotion={reducedMotion}
          onBack={returnToRoom}
        />
      </div>
      {preparing ? (
        <div className="furni-hero-preparation-overlay" aria-hidden="false">
          <div
            className="furni-hero-preparation-overlay__panel"
            role="status"
            aria-label="Загрузка комнаты…"
            tabIndex={-1}
          >
            <span className="furni-hero-preparation-overlay__spinner" aria-hidden="true" />
            Загрузка комнаты…
          </div>
        </div>
      ) : null}
      {roomState.phase === 'error' ? (
        <div className="furni-hero-recovery" role="alert">
          <p>{roomState.error?.message ?? ROOM_ERROR_MESSAGE}</p>
          <button type="button" onClick={retryRoom}>
            Повторить
          </button>
        </div>
      ) : null}
    </section>
  );
}
