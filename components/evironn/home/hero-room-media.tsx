import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HERO_ROOMS } from './hero-rooms';
import type { PilotHeroRoomId, HeroRoomState } from './hero-room-state';

type HeroRoomMediaProps = {
  state: HeroRoomState;
  reducedMotion: boolean;
  requestedRooms: readonly PilotHeroRoomId[];
  posterVersions: Readonly<Partial<Record<PilotHeroRoomId, number>>>;
  onPosterElement: (room: PilotHeroRoomId, image: HTMLImageElement | null) => void;
  onTransitionComplete: (operationId: number) => void;
  onTransitionFailure: (operationId: number, resource?: 'poster') => void;
};

type HeroPosterImageProps = {
  room: PilotHeroRoomId;
  version: number;
  state: HeroRoomState;
  onPosterElement: (room: PilotHeroRoomId, image: HTMLImageElement | null) => void;
  onTransitionComplete: (operationId: number) => void;
  onTransitionFailure: (operationId: number, resource?: 'poster') => void;
};

function HeroPosterImage({
  room,
  version,
  state,
  onPosterElement,
  onTransitionComplete,
  onTransitionFailure,
}: HeroPosterImageProps) {
  const roomConfig = HERO_ROOMS[room];
  const animationInstanceRef = useRef<{
    operationId: number;
    element: HTMLImageElement;
    startedAt: number;
  } | null>(null);
  const isStable = state.activeRoom === room && ['idle', 'preparing', 'error'].includes(state.phase);
  const isOutgoing = state.phase === 'changing' && state.activeRoom === room && !state.direct;
  const isIncoming = state.phase === 'changing' && state.targetRoom === room;

  const setPoster = useCallback(
    (image: HTMLImageElement | null) => onPosterElement(room, image),
    [onPosterElement, room],
  );

  const imageProps = {
    ref: setPoster,
    className: [
      'furni-hero-room-media__image',
      roomConfig.mediaClassName,
      isStable ? 'is-stable' : '',
      isOutgoing ? 'is-outgoing' : '',
      isIncoming ? 'is-incoming' : '',
      isIncoming && state.direct ? 'is-direct-incoming' : '',
    ]
      .filter(Boolean)
      .join(' '),
    src: roomConfig.idleSrc,
    loading: 'eager' as const,
    onError: () => {
      if (state.targetRoom === room || (state.phase === 'preparing' && state.activeRoom === room)) {
        onTransitionFailure(state.operationId, 'poster');
      }
    },
    onAnimationStart: (event: React.AnimationEvent<HTMLImageElement>) => {
      if (isIncoming && event.currentTarget === event.target && event.animationName?.startsWith('hero-room-enter')) {
        animationInstanceRef.current = {
          operationId: state.operationId,
          element: event.currentTarget,
          startedAt: event.timeStamp,
        };
      }
    },
    onAnimationEnd: (event: React.AnimationEvent<HTMLImageElement>) => {
      if (
        isIncoming &&
        animationInstanceRef.current?.operationId === state.operationId &&
        animationInstanceRef.current.element === event.currentTarget &&
        event.timeStamp >= animationInstanceRef.current.startedAt &&
        event.currentTarget === event.target &&
        event.animationName?.startsWith('hero-room-enter')
      ) {
        onTransitionComplete(state.operationId);
      }
    },
  };

  useEffect(() => {
    if (!isIncoming || animationInstanceRef.current?.operationId !== state.operationId) {
      animationInstanceRef.current = null;
    }
  }, [isIncoming, state.operationId]);

  useEffect(() => {
    const image = document.querySelector<HTMLImageElement>(
      `.furni-hero-room-media__image[data-hero-room="${room}"][data-hero-poster-version="${version}"]`,
    );
    if (image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0) onPosterElement(room, image);
  }, [onPosterElement, room, version]);

  return room === 'living-room' ? (
    <Image
      key={`${room}-${version}`}
      {...imageProps}
      data-hero-room={room}
      data-hero-poster-version={version}
      alt=""
      width={1536}
      height={1024}
      sizes="100vw"
      quality={90}
      fetchPriority="high"
      priority
    />
  ) : (
    <img key={`${room}-${version}`} {...imageProps} data-hero-room={room} data-hero-poster-version={version} alt="" />
  );
}

export function HeroRoomMedia({
  state,
  reducedMotion,
  requestedRooms,
  posterVersions,
  onPosterElement,
  onTransitionComplete,
  onTransitionFailure,
}: HeroRoomMediaProps) {
  useEffect(() => {
    if (state.phase !== 'changing') return;

    const fallback = window.setTimeout(() => onTransitionFailure(state.operationId), 1400);
    if (reducedMotion) {
      const complete = window.setTimeout(() => onTransitionComplete(state.operationId), 0);
      return () => {
        window.clearTimeout(fallback);
        window.clearTimeout(complete);
      };
    }
    return () => window.clearTimeout(fallback);
  }, [onTransitionComplete, onTransitionFailure, reducedMotion, state.operationId, state.phase]);

  return (
    <div
      className={[
        'furni-hero-room-media',
        state.phase === 'changing' ? 'is-changing' : '',
        reducedMotion ? 'is-reduced-motion' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      {requestedRooms.map((room) => (
        <HeroPosterImage
          key={`${room}-${posterVersions[room] ?? 0}`}
          room={room}
          version={posterVersions[room] ?? 0}
          state={state}
          onPosterElement={onPosterElement}
          onTransitionComplete={onTransitionComplete}
          onTransitionFailure={onTransitionFailure}
        />
      ))}
    </div>
  );
}
