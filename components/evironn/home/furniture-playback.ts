export type MobilePlaybackState = {
  activeIndex: number | null;
  pendingIndex: number | null;
  phase: 'idle' | 'forward' | 'reverse';
};

export const CARD_PLAYBACK_RATE = 3;

export type MediaFallbackMode = 'idle' | 'frozen';

export function getMediaLayerState(isVideoFrameReady: boolean, fallbackMode: MediaFallbackMode = 'idle') {
  if (isVideoFrameReady) {
    return { showIdleFrame: false, showFrozenFrame: false, showVideo: true };
  }

  return {
    showIdleFrame: fallbackMode === 'idle',
    showFrozenFrame: fallbackMode === 'frozen',
    showVideo: false,
  };
}

export function getReverseStartTime(forwardTime: number, forwardDuration: number, reverseDuration: number) {
  if (
    !Number.isFinite(forwardDuration) ||
    forwardDuration <= 0 ||
    !Number.isFinite(reverseDuration) ||
    reverseDuration <= 0
  )
    return 0;

  const progress = Math.min(1, Math.max(0, forwardTime / forwardDuration));
  return reverseDuration * (1 - progress);
}

export function requestMobileActivation(state: MobilePlaybackState, requestedIndex: number): MobilePlaybackState {
  if (state.activeIndex === null) return { activeIndex: requestedIndex, pendingIndex: null, phase: 'forward' };
  if (state.activeIndex === requestedIndex && state.phase !== 'reverse') return state;
  if (state.activeIndex === requestedIndex && state.phase === 'reverse')
    return { ...state, pendingIndex: requestedIndex };

  return { activeIndex: state.activeIndex, pendingIndex: requestedIndex, phase: 'reverse' };
}
