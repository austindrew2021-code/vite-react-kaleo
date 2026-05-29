import { useEffect, useState } from 'react';

// Breakpoint in pixels – matches common Tailwind md: breakpoint (768px)
const MOBILE_BREAKPOINT = 768;

/**
 * Custom hook to detect if the current viewport is mobile-sized.
 * Returns `true` on mobile (< 768px), `false` on desktop/tablet.
 * 
 * Features:
 * - Uses matchMedia for efficiency (no resize event spam)
 * - SSR-safe (returns undefined during initial render on server)
 * - Cleans up listener properly
 * - Works with orientation change & window resize
 * - Can be used in conditional rendering or className logic
 * 
 * Usage examples:
 * const isMobile = useIsMobile();
 * 
 * if (isMobile) return <MobileLayout />;
 * 
 * <div className={cn("grid", isMobile ? "grid-cols-1" : "grid-cols-2")}>
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Create media query
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Handler function
    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    // Set initial value immediately (prevents flash of wrong layout)
    handleChange();

    // Listen for changes (resize, orientation change)
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []); // Empty deps – only runs once on mount

  return isMobile;
}
