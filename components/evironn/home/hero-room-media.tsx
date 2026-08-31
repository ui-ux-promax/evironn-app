import { useEffect } from 'react';
import Image from 'next/image';
import { HERO_ROOMS } from './hero-rooms';
import type { AvailableHeroRoomId, HeroRoomState } from './hero-room-state';

type HeroRoomMediaProps = {
  state: HeroRoomState;
  reducedMotion: boolean;
  onRoomReady: (room: AvailableHeroRoomId) => void;
  onTransitionComplete: () => void;
  onTransitionFailure: () => void;
};

export function HeroRoomMedia({
  state,
  reducedMotion,
  onRoomReady,
  onTransitionComplete,
  onTransitionFailure,
}: HeroRoomMediaProps) {
  useEffect(() => {
    if (state.phase !== 'changing') return;

    const fallback = window.setTimeout(onTransitionFailure, 1400);
    return () => window.clearTimeout(fallback);
  }, [state.activeRoom, state.phase, state.targetRoom, onTransitionFailure]);

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
      {Object.values(HERO_ROOMS).map((room) => {
        const isStable = state.phase === 'idle' && state.activeRoom === room.id;
        const isOutgoing = state.phase === 'changing' && state.activeRoom === room.id && !state.direct;
        const isIncoming = state.phase === 'changing' && state.targetRoom === room.id;
        const isCriticalPoster = room.id === 'living-room';
        const imageProps = {
          ref: (node: HTMLImageElement | null) => {
            // Under SSR the idle images can finish loading before hydration attaches the
            // React onLoad handler, so its load event is never observed and the room pill
            // stays disabled forever. Signal readiness for any image already complete at mount.
            if (node?.complete && node.naturalWidth > 0) onRoomReady(room.id);
          },
          className: [
            'furni-hero-room-media__image',
            room.mediaClassName,
            isStable ? 'is-stable' : '',
            isOutgoing ? 'is-outgoing' : '',
            isIncoming ? 'is-incoming' : '',
            isIncoming && state.direct ? 'is-direct-incoming' : '',
          ]
            .filter(Boolean)
            .join(' '),
          src: room.idleSrc,
          loading: isCriticalPoster ? ('eager' as const) : ('lazy' as const),
          onLoad: () => onRoomReady(room.id),
          onError: () => {
            if (isIncoming) onTransitionFailure();
          },
          onAnimationEnd: (event: React.AnimationEvent<HTMLImageElement>) => {
            if (
              isIncoming &&
              event.currentTarget === event.target &&
              event.animationName.startsWith('hero-room-enter')
            ) {
              onTransitionComplete();
            }
          },
        };

        return isCriticalPoster ? (
          <Image
            key={room.id}
            {...imageProps}
            alt=""
            width={1536}
            height={1024}
            sizes="100vw"
            quality={90}
            fetchPriority="high"
            priority={isCriticalPoster}
          />
        ) : (
          <img key={room.id} {...imageProps} alt="" fetchPriority="auto" />
        );
      })}
    </div>
  );
}
