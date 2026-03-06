/**
 * scrollLock.ts
 * 
 * A reference-counted scroll lock that saves and restores the exact scroll
 * position. Multiple components can call lockScroll/unlockScroll and the
 * page won't jump around — the lock is only released when all callers unlock.
 *
 * Problem this solves:
 *   Setting overflow:hidden on body (or document.body.style.overflow = 'hidden')
 *   without `position:fixed` still causes iOS/WebKit to lose the scroll position
 *   in some cases. Setting position:fixed prevents scrolling but causes a jump
 *   to Y=0 when removed because the element is taken out of the document flow.
 *
 * Solution:
 *   When locking — save scrollY, set body top = -scrollY + position:fixed.
 *   When unlocking — remove position:fixed, restore scrollY via window.scrollTo.
 *   This is the same technique used by headlessui, radix-ui, and most major
 *   component libraries.
 */

let lockCount = 0;
let savedScrollY = 0;

export function lockScroll() {
  lockCount++;
  if (lockCount > 1) return; // already locked

  savedScrollY = window.scrollY;

  // Apply lock using top offset trick — prevents any Y jump
  document.body.style.overflow   = 'hidden';
  document.body.style.position   = 'fixed';
  document.body.style.top        = `-${savedScrollY}px`;
  document.body.style.left       = '0';
  document.body.style.right      = '0';
  document.body.style.width      = '100%';
}

export function unlockScroll() {
  if (lockCount <= 0) return;
  lockCount--;
  if (lockCount > 0) return; // still locked by another caller

  // Remove all overrides
  document.body.style.overflow   = '';
  document.body.style.position   = '';
  document.body.style.top        = '';
  document.body.style.left       = '';
  document.body.style.right      = '';
  document.body.style.width      = '';

  // Restore scroll position — must happen AFTER styles are cleared
  window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
}
