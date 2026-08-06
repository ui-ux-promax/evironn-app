export const HERO_ROOM_IDS = [
  'living-room',
  'kitchen',
  'bedroom',
  'terrace',
] as const;

export type HeroRoomId = (typeof HERO_ROOM_IDS)[number];

export const AVAILABLE_HERO_ROOM_IDS = [
  'living-room',
  'kitchen',
  'bedroom',
  'terrace',
] as const;
export type AvailableHeroRoomId = (typeof AVAILABLE_HERO_ROOM_IDS)[number];

export type HeroRoomState = {
  activeRoom: AvailableHeroRoomId;
  targetRoom: AvailableHeroRoomId | null;
  phase: 'idle' | 'changing';
  direct: boolean;
};

export const INITIAL_HERO_ROOM_STATE: HeroRoomState = {
  activeRoom: 'living-room',
  targetRoom: null,
  phase: 'idle',
  direct: false,
};

export function isAvailableHeroRoom(
  room: HeroRoomId,
): room is AvailableHeroRoomId {
  return (AVAILABLE_HERO_ROOM_IDS as readonly HeroRoomId[]).includes(room);
}

export function isHeroRoomTransitioning(state: HeroRoomState) {
  return state.phase === 'changing';
}

export function requestHeroRoom(
  state: HeroRoomState,
  target: HeroRoomId,
  targetReady: boolean,
  direct = false,
): HeroRoomState {
  if (
    state.phase !== 'idle' ||
    !targetReady ||
    !isAvailableHeroRoom(target) ||
    target === state.activeRoom
  ) {
    return state;
  }

  return {
    activeRoom: state.activeRoom,
    targetRoom: target,
    phase: 'changing',
    direct,
  };
}

export function completeHeroRoomTransition(
  state: HeroRoomState,
): HeroRoomState {
  if (state.phase !== 'changing' || !state.targetRoom) return state;

  return {
    activeRoom: state.targetRoom,
    targetRoom: null,
    phase: 'idle',
    direct: false,
  };
}

export function recoverHeroRoomTransition(state: HeroRoomState): HeroRoomState {
  if (state.phase !== 'changing') return state;

  return {
    activeRoom: state.activeRoom,
    targetRoom: null,
    phase: 'idle',
    direct: false,
  };
}
