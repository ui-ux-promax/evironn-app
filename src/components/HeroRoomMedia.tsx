import { useEffect } from 'react';
import { HERO_ROOMS } from './heroRooms';
import type { AvailableHeroRoomId, HeroRoomState } from './heroRoomState';

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
        const isOutgoing =
          state.phase === 'changing' &&
          state.activeRoom === room.id &&
          !state.direct;
        const isIncoming =
          state.phase === 'changing' && state.targetRoom === room.id;

        return (
          <img
            key={room.id}
            className={[
              'furni-hero-room-media__image',
              room.mediaClassName,
              isStable ? 'is-stable' : '',
              isOutgoing ? 'is-outgoing' : '',
              isIncoming ? 'is-incoming' : '',
              isIncoming && state.direct ? 'is-direct-incoming' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            src={room.idleSrc}
            alt=""
            onLoad={() => onRoomReady(room.id)}
            onError={() => {
              if (isIncoming) onTransitionFailure();
            }}
            onAnimationEnd={(event) => {
              if (
                isIncoming &&
                event.currentTarget === event.target &&
                event.animationName.startsWith('hero-room-enter')
              ) {
                onTransitionComplete();
              }
            }}
          />
        );
      })}
    </div>
  );
}
