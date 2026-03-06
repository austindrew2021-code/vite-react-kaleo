/**
 * scrollLock.ts — simple scroll lock, no position:fixed, no reference counting.
 *
 * Uses a single module-level flag. Each caller gets a release function back,
 * so there's no need to call a separate unlock — just call the returned function.
 *
 * Usage in React useEffect:
 *   useEffect(() => {
 *     if (!open) return;
 *     return lockScroll(); // returned function IS the cleanup
 *   }, [open]);
 */

let locked = false;
let _savedY = 0;

export function lockScroll(): () => void {
  if (locked) {
    // Already locked — return a no-op so callers don't double-unlock
    return () => {};
  }
  locked = true;
  _savedY = window.scrollY;
  document.body.style.overflow = 'hidden';

  return function release() {
    if (!locked) return;
    locked = false;
    document.body.style.overflow = '';
    if (_savedY !== window.scrollY) {
      window.scrollTo(0, _savedY);
    }
  };
}

/** Force-clear any stuck lock (e.g. on unmount / error recovery) */
export function forceUnlockScroll() {
  locked = false;
  document.body.style.overflow = '';
}
