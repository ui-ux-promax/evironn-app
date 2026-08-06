import { useCallback, useEffect, useRef, useState } from 'react';
import { HeroProductCard } from './HeroProductCard';
import { HeroProductMedia } from './HeroProductMedia';
import { HeroRoomMedia } from './HeroRoomMedia';
import { HERO_PRODUCTS } from './heroProducts';
import { HERO_ROOM_OPTIONS, HERO_ROOMS } from './heroRooms';
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
} from './heroProductState';
import {
  completeHeroRoomTransition,
  INITIAL_HERO_ROOM_STATE,
  isAvailableHeroRoom,
  isHeroRoomTransitioning,
  recoverHeroRoomTransition,
  requestHeroRoom,
  type AvailableHeroRoomId,
  type HeroRoomId,
} from './heroRoomState';
import './Hero.css';

export function Hero() {
  const segRef = useRef<HTMLDivElement>(null);
  const roomButtonRefs = useRef<Partial<Record<HeroRoomId, HTMLButtonElement>>>(
    {},
  );
  const [roomState, setRoomState] = useState(INITIAL_HERO_ROOM_STATE);
  const [stackRoom, setStackRoom] = useState<AvailableHeroRoomId>(
    INITIAL_HERO_ROOM_STATE.activeRoom,
  );
  const [stackFade, setStackFade] = useState<'idle' | 'out' | 'in'>('idle');
  const [readyRooms, setReadyRooms] = useState<Set<AvailableHeroRoomId>>(
    () => new Set(['living-room']),
  );
  const [phase, setPhase] = useState<HeroPhase>('idle');
  const [cardVisible, setCardVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const selectedRoom = roomState.targetRoom ?? roomState.activeRoom;
  const activeRoom = HERO_ROOMS[roomState.activeRoom];
  const visualRoom = HERO_ROOMS[stackRoom];
  const roomChanging = isHeroRoomTransitioning(roomState);
  const productChanging = isHeroTransitioning(phase);
  const locked = roomChanging || productChanging;
  const hotspotsVisible = roomState.phase === 'idle' && phase === 'idle';

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

  useEffect(() => {
    if (!roomChanging || !roomState.targetRoom) {
      if (!roomChanging) {
        setStackRoom(roomState.activeRoom);
        setStackFade('idle');
      }
      return;
    }

    const target = roomState.targetRoom;
    setStackFade('out');
    const moveStack = window.setTimeout(() => {
      setStackRoom(target);
      setStackFade('in');
    }, 360);

    return () => window.clearTimeout(moveStack);
  }, [roomChanging, roomState.activeRoom, roomState.targetRoom]);

  const markRoomReady = useCallback((room: AvailableHeroRoomId) => {
    setReadyRooms((current) => {
      if (current.has(room)) return current;
      const next = new Set(current);
      next.add(room);
      return next;
    });
  }, []);

  const beginRoomChange = useCallback(
    (target: AvailableHeroRoomId, direct = false) => {
      setCardVisible(false);
      setRoomState((current) =>
        requestHeroRoom(current, target, readyRooms.has(target), direct),
      );
    },
    [readyRooms],
  );

  const handleRoomClick = (room: HeroRoomId) => {
    if (
      !isAvailableHeroRoom(room) ||
      roomChanging ||
      room === selectedRoom ||
      !readyRooms.has(room)
    ) {
      return;
    }

    if (phase !== 'idle') {
      setCardVisible(false);
      setPhase((current) => cancelHeroProduct(current));
      beginRoomChange(room, true);
      return;
    }

    beginRoomChange(room);
  };

  const finishRoomTransition = useCallback(() => {
    setRoomState((current) => {
      const completed = completeHeroRoomTransition(current);
      queueMicrotask(() => {
        roomButtonRefs.current[completed.activeRoom]?.focus();
      });
      return completed;
    });
  }, []);

  const handleRoomFailure = useCallback(() => {
    setRoomState((current) => recoverHeroRoomTransition(current));
  }, []);

  const selectedId = getHeroProduct(phase);
  const selectedProduct = selectedId ? HERO_PRODUCTS[selectedId] : null;

  const selectProduct = (product: HeroProductId) => {
    setCardVisible(false);
    setPhase((current) => selectHeroProduct(current, product));
  };

  const finishForward = useCallback(() => {
    setCardVisible(true);
    setPhase((current) => completeHeroForward(current));
  }, []);

  const finishReverse = useCallback(() => {
    setCardVisible(false);
    setPhase((current) => completeHeroReturn(current));
  }, []);

  const handleMediaFailure = useCallback((failedPhase: HeroPhase) => {
    const recovered = recoverHeroMediaFailure(failedPhase);
    setCardVisible(recovered !== 'idle');
    setPhase(recovered);
  }, []);

  const handleProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (shouldRevealHeroProduct(currentTime, duration)) setCardVisible(true);
    },
    [],
  );

  const returnToRoom = () => {
    setCardVisible(false);
    setPhase((current) => startHeroReturn(current));
  };

  return (
    <section
      id="evironn-hero"
      aria-labelledby="furni-hero-title"
      className="furni-hero-demo"
    >
      <HeroRoomMedia
        state={roomState}
        reducedMotion={reducedMotion}
        onRoomReady={markRoomReady}
        onTransitionComplete={finishRoomTransition}
        onTransitionFailure={handleRoomFailure}
      />
      <HeroProductMedia
        phase={phase}
        reducedMotion={reducedMotion}
        onProgress={handleProgress}
        onForwardComplete={finishForward}
        onReverseComplete={finishReverse}
        onFailure={handleMediaFailure}
      />
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
            Откройте вневременные предметы, созданные нашей семьёй и наполненные
            теплом традиций и красотой натурального дерева.
          </p>
          <div className="furni-hero-actions">
            <button className="btn btn-dark" type="button">
              СМОТРЕТЬ КОЛЛЕКЦИЮ
            </button>
            <button className="btn btn-outline" type="button">
              ПОСМОТРЕТЬ ИСТОРИЮ
            </button>
          </div>
        </article>
        <div className="furni-hero-segments">
          <div
            className="seg-control"
            ref={segRef}
            role="group"
            aria-label="Категория комнаты"
          >
            <div className="seg-indicator" aria-hidden="true" />
            {HERO_ROOM_OPTIONS.map((room) => {
              const selected = room.id === selectedRoom;
              const waitingForMedia =
                room.available &&
                isAvailableHeroRoom(room.id) &&
                room.id !== roomState.activeRoom &&
                !readyRooms.has(room.id);
              const roomLocked =
                !room.available || waitingForMedia || roomChanging;

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
            className={[
              'furni-hero-hotspot',
              product.hotspotClassName,
              hotspotsVisible ? '' : 'is-hidden',
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            aria-label={`Смотреть ${product.name}`}
            disabled={locked}
            onClick={() => selectProduct(product.id)}
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
    </section>
  );
}
