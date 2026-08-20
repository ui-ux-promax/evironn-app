export function clampVideoTime(time: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  if (!Number.isFinite(time)) return 0;
  return Math.min(Math.max(time, 0), duration);
}

export function wrapVideoTime(time: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  if (!Number.isFinite(time)) return 0;
  return ((time % duration) + duration) % duration;
}

export function videoTimeFromDrag(startTime: number, deltaX: number, viewportWidth: number, duration: number) {
  const width = Math.max(viewportWidth, 1);
  return wrapVideoTime(startTime - (deltaX / width) * duration, duration);
}

export function coalesceVideoSeek(isSeeking: boolean, _pendingTime: number | null, nextTime: number) {
  return {
    shouldSeek: !isSeeking,
    time: nextTime,
  };
}

export function pingPongPosition(time: number, clipDuration: number) {
  const duration = Math.max(clipDuration, 0);
  if (!duration) return { clip: 'forward' as const, time: 0 };

  const cycle = duration * 2;
  const normalized = ((time % cycle) + cycle) % cycle;

  if (normalized < duration) {
    return { clip: 'forward' as const, time: normalized };
  }

  return { clip: 'reverse' as const, time: normalized - duration };
}
