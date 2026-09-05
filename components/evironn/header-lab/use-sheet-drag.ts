'use client';

import { useEffect, type RefObject } from 'react';

/** Pull distance before the gesture is treated as a drag rather than a tap. */
const DRAG_START = 6;
/** Pull distance that dismisses the sheet on release. */
const DISMISS_DISTANCE = 88;
/** Downward flick speed (px/ms) that dismisses the sheet regardless of distance. */
const DISMISS_VELOCITY = 0.4;
/** Height of the strip at the top of the sheet that always starts a drag. */
const GRIP_ZONE = 32;

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SNAP_BACK = `transform 0.34s ${EASE}`;
const DISMISS_OUT = `transform 0.26s ${EASE}, opacity 0.26s ${EASE}`;

type SheetDragOptions = {
  sheetRef: RefObject<HTMLDivElement>;
  scrimRef: RefObject<HTMLButtonElement>;
  open: boolean;
  onDismiss: () => void;
};

/**
 * Swipe-to-dismiss for the bottom sheet.
 *
 * The sheet follows the finger, the scrim fades with the pull, and release either
 * snaps back or plays the sheet out before unmounting. A drag only takes over
 * when the sheet is scrolled to the top or the gesture starts on the grip strip,
 * so a tall sheet keeps its native scrolling. Cancelling `touchmove` also
 * suppresses the click that would otherwise follow a drag over a link.
 */
export function useSheetDrag({ sheetRef, scrimRef, open, onDismiss }: SheetDragOptions) {
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!open || !sheet) return;

    const reducedMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let tracking = false;
    let dragging = false;
    let closing = false;
    let startY = 0;
    let startX = 0;
    let lastY = 0;
    let lastAt = 0;
    let prevY = 0;
    let prevAt = 0;
    let offset = 0;
    let fallbackTimer = 0;

    const paint = (value: number) => {
      sheet.style.transform = value === 0 ? '' : `translateY(${value}px)`;
      const scrim = scrimRef.current;
      if (scrim) {
        const travel = Math.max(1, sheet.offsetHeight);
        scrim.style.opacity = String(Math.max(0, 1 - value / travel));
      }
    };

    const freezeEntryMotion = () => {
      sheet.style.animation = 'none';
      sheet.style.transition = 'none';
      const scrim = scrimRef.current;
      if (scrim) {
        scrim.style.animation = 'none';
        scrim.style.transition = 'none';
      }
    };

    const snapBack = () => {
      if (reducedMotion) {
        paint(0);
        return;
      }
      sheet.style.transition = SNAP_BACK;
      const scrim = scrimRef.current;
      if (scrim) scrim.style.transition = 'opacity 0.34s ease';
      paint(0);
    };

    const dismiss = () => {
      if (closing) return;
      closing = true;
      if (reducedMotion) {
        onDismiss();
        return;
      }
      const finish = () => {
        sheet.removeEventListener('transitionend', onEnd);
        window.clearTimeout(fallbackTimer);
        onDismiss();
      };
      const onEnd = (event: TransitionEvent) => {
        if (event.target === sheet && event.propertyName === 'transform') finish();
      };
      sheet.addEventListener('transitionend', onEnd);
      // Guard: `transitionend` never fires if the sheet is hidden mid-animation.
      fallbackTimer = window.setTimeout(finish, 400);
      sheet.style.transition = DISMISS_OUT;
      sheet.style.transform = `translateY(${sheet.offsetHeight}px)`;
      const scrim = scrimRef.current;
      if (scrim) {
        scrim.style.transition = 'opacity 0.26s ease';
        scrim.style.opacity = '0';
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (closing || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const fromGrip = touch.clientY - sheet.getBoundingClientRect().top <= GRIP_ZONE;
      if (sheet.scrollTop > 0 && !fromGrip) return;
      tracking = true;
      dragging = false;
      startY = touch.clientY;
      startX = touch.clientX;
      lastY = touch.clientY;
      prevY = touch.clientY;
      lastAt = event.timeStamp;
      prevAt = event.timeStamp;
      offset = 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || closing || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dy = touch.clientY - startY;
      const dx = touch.clientX - startX;

      if (!dragging) {
        if (dy <= DRAG_START || Math.abs(dx) > Math.abs(dy)) {
          // Upward or sideways intent: hand the gesture back to the browser.
          if (dy < -DRAG_START || Math.abs(dx) > DRAG_START) tracking = false;
          return;
        }
        dragging = true;
        freezeEntryMotion();
      }

      event.preventDefault();
      offset = Math.max(0, dy);
      prevY = lastY;
      prevAt = lastAt;
      lastY = touch.clientY;
      lastAt = event.timeStamp;
      paint(offset);
    };

    const onTouchEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!dragging || closing) return;
      dragging = false;
      const velocity = (lastY - prevY) / Math.max(1, lastAt - prevAt);
      if (offset > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) dismiss();
      else snapBack();
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', onTouchEnd);
    sheet.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.clearTimeout(fallbackTimer);
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
      sheet.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onDismiss, open, scrimRef, sheetRef]);
}
