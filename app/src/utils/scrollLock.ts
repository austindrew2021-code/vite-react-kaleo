/**
 * scrollLock.ts — only locks scroll on mobile (touch) devices.
 * On desktop, fixed-position modals don't need body scroll locked.
 */

let _release: (() => void) | null = null;

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function lockScroll(): () => void {
  // Already locked — return no-op
  if (_release) return () => {};

  // On desktop: modals are fixed overlays, no lock needed
  if (!isTouchDevice()) return () => {};

  const savedY = window.scrollY;
  document.body.style.overflow = 'hidden';

  function release() {
    if (!_release) return;
    _release = null;
    document.body.style.overflow = '';
    if (window.scrollY !== savedY) window.scrollTo(0, savedY);
  }

  _release = release;
  return release;
}

export function forceUnlockScroll() {
  if (_release) { _release(); }
  _release = null;
  document.body.style.overflow = '';
}
