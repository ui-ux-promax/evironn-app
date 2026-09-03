export const HERO_ROOM_IDS = ['living-room', 'kitchen', 'bedroom', 'terrace'] as const;

export type HeroRoomId = (typeof HERO_ROOM_IDS)[number];

export const PILOT_HERO_ROOM_IDS = ['living-room', 'kitchen'] as const;
export type PilotHeroRoomId = (typeof PILOT_HERO_ROOM_IDS)[number];

export const AVAILABLE_HERO_ROOM_IDS = PILOT_HERO_ROOM_IDS;
export type AvailableHeroRoomId = HeroRoomId;

export type HeroRoomState = {
  activeRoom: PilotHeroRoomId;
  targetRoom: PilotHeroRoomId | null;
  phase: 'idle' | 'preparing' | 'changing' | 'error';
  direct: boolean;
  operationId: number;
  error: { room: PilotHeroRoomId; message: string } | null;
};

export const INITIAL_HERO_ROOM_STATE: HeroRoomState = {
  activeRoom: 'living-room',
  targetRoom: 'living-room',
  phase: 'preparing',
  direct: false,
  operationId: 0,
  error: null,
};

export function isAvailableHeroRoom(room: HeroRoomId): room is PilotHeroRoomId {
  return (PILOT_HERO_ROOM_IDS as readonly HeroRoomId[]).includes(room);
}

export function isHeroRoomTransitioning(state: HeroRoomState) {
  return state.phase === 'changing';
}

export function requestHeroRoom(
  state: HeroRoomState,
  target: HeroRoomId,
  targetReady: boolean,
  direct = false,
  operationId = state.operationId + 1,
): HeroRoomState {
  if (
    (state.phase !== 'idle' && state.phase !== 'error') ||
    operationId <= state.operationId ||
    !isAvailableHeroRoom(target) ||
    (target === state.activeRoom && targetReady)
  ) {
    return state;
  }

  return {
    activeRoom: state.activeRoom,
    targetRoom: target,
    phase: targetReady ? 'changing' : 'preparing',
    direct,
    operationId,
    error: null,
  };
}

export function completeHeroRoomPreparation(state: HeroRoomState, operationId: number): HeroRoomState {
  if (state.phase !== 'preparing' || state.operationId !== operationId || !state.targetRoom) return state;

  return {
    ...state,
    targetRoom: state.targetRoom === state.activeRoom ? null : state.targetRoom,
    phase: state.targetRoom === state.activeRoom ? 'idle' : 'changing',
    error: null,
  };
}

export function restartHeroRoomPreparation(state: HeroRoomState, operationId: number): HeroRoomState {
  if (operationId <= state.operationId) return state;

  return {
    ...state,
    targetRoom: state.targetRoom ?? state.activeRoom,
    phase: 'preparing',
    operationId,
    error: null,
  };
}

export function dismissHeroRoomError(state: HeroRoomState, target: HeroRoomId, targetReady: boolean): HeroRoomState {
  if (state.phase !== 'error' || target !== state.activeRoom || !targetReady) return state;

  return {
    ...state,
    targetRoom: null,
    phase: 'idle',
    direct: false,
    operationId: state.operationId + 1,
    error: null,
  };
}

export function failHeroRoomPreparation(state: HeroRoomState, operationId: number, message: string): HeroRoomState {
  if (state.phase !== 'preparing' || state.operationId !== operationId || !state.targetRoom) return state;

  return {
    ...state,
    targetRoom: null,
    phase: 'error',
    direct: false,
    error: { room: state.targetRoom, message },
  };
}

export function completeHeroRoomTransition(state: HeroRoomState): HeroRoomState {
  if (state.phase !== 'changing' || !state.targetRoom) return state;

  return {
    ...state,
    activeRoom: state.targetRoom,
    targetRoom: null,
    phase: 'idle',
    direct: false,
    error: null,
  };
}

export function recoverHeroRoomTransition(state: HeroRoomState): HeroRoomState {
  if (state.phase !== 'changing') return state;

  return {
    ...state,
    activeRoom: state.activeRoom,
    targetRoom: null,
    phase: 'idle',
    direct: false,
    error: null,
  };
}
