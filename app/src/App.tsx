import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { config } from './wagmi';
import { Navigation } from './components/Navigation';
import { HeroSection } from './sections/HeroSection';
import { BuySection } from './sections/BuySection';
import { StatsSection } from './sections/StatsSection';
import { FeatureSection } from './sections/FeatureSection';
import { FeaturesGridSection } from './sections/FeaturesGridSection';
import { StakingCTASection } from './sections/StakingCTASection';
import { FooterSection } from './sections/FooterSection';
import { PresaleProgress } from './sections/PresaleProgress';
import { RoadmapSection } from './sections/RoadmapSection';

import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Force GPU acceleration globally (helps mobile smoothness)
    gsap.set('body, html, main, section.pinned-section', {
      willChange: 'transform',
      transform: 'translate3d(0,0,0)',
      backfaceVisibility: 'hidden',
    });

    // Kill previous ScrollTriggers to prevent memory leaks
    ScrollTrigger.getAll().forEach(st => st.kill());

    // Pin major sections individually with optimized settings
    const pinnedSections = document.querySelectorAll('.pinned-section');

    pinnedSections.forEach((section, index) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,           // Prevents jank on mobile
        fastScrollEnd: true,         // Smoother quick scrolls
        scrub: 0.4,                  // Faster response, less lag
        id: `pin-${index}`,
      });
    });

    // Lightweight global snap (only near section boundaries)
    ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: (progress: number) => {
          // Snap only near 0%, 25%, 50%, 75%, 100% (adjust as needed)
          const targets = [0, 0.25, 0.5, 0.75, 1];
          const closest = targets.reduce((prev, curr) =>
            Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev
          );
          // Only snap if very close (prevents constant micro-snaps)
          return Math.abs(closest - progress) < 0.08 ? closest : progress;
        },
        duration: { min: 0.18, max: 0.45 }, // Faster on mobile
        delay: 0.05,
        ease: 'power2.out',
        directional: true,
      },
      invalidateOnRefresh: true,
    });

    // Refresh on resize (debounced to prevent spam)
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#2BFFF1',
            accentColorForeground: '#05060B',
            borderRadius: 'large',
            fontStack: 'system',
          })}
        >
          <div className="relative bg-[#05060B] min-h-screen">
            {/* Noise Overlay */}
            <div className="noise-overlay" />
            
            {/* Navigation */}
            <Navigation />
            
            {/* Main Content */}
            <main className="relative">
              <HeroSection />
              <PresaleProgress />
              <BuySection />
              <StatsSection />
              <FeatureSection />
              <FeaturesGridSection />
              <StakingCTASection />
              <RoadmapSection />
              <FooterSection />
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
