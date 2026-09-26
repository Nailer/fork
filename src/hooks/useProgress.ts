import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Respects the OS "reduce motion" setting. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

/**
 * Drives a 0→1 eased value with requestAnimationFrame. Used for SVG path drawing,
 * which renders identically on iOS, Android and web. Jumps straight to 1 when the
 * user prefers reduced motion.
 */
export function useProgress(duration: number, key: unknown = 0, delay = 0) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);

  useEffect(() => {
    if (reduced) {
      setT(1);
      return;
    }
    setT(0);
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start - delay;
      const raw = Math.min(1, Math.max(0, elapsed / duration));
      setT(easeOutCubic(raw));
      if (raw < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, delay, reduced, key]);

  return t;
}

/** Maps overall progress into a sub-range, e.g. stage(t, 0.3, 0.7). */
export const stage = (t: number, from: number, to: number) => Math.min(1, Math.max(0, (t - from) / (to - from)));
