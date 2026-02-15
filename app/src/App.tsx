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
    // Eliminate micro-lag on mobile touch
    gsap.ticker.lagSmoothing(0);

    // Force GPU rendering + smooth touch scroll
    gsap.set('body, html, main, section.pinned-section', {
      willChange: 'transform',
      transform: 'translate3d(0,0,0)',
      backfaceVisibility: 'hidden',
    });

    // Normalize scroll behavior for mobile (prevents jitter/jump)
    ScrollTrigger.normalizeScroll(true);

    // Kill any old triggers
    ScrollTrigger.getAll().forEach(st => st.kill());

    // Pin major sections with overlap prevention
    const pinnedSections = document.querySelectorAll('.pinned-section');

    pinnedSections.forEach((section, index) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        fastScrollEnd: true,
        scrub: 0.2,                    // Very fast response → feels natural
        preventOverlaps: true,         // Prevents fighting between pins
        invalidateOnRefresh: true,
        id: `pin-${index}`,
      });
    });

    // Much gentler snap — only triggers when very close to section boundary
    ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: (progress: number) => {
          const targets = [0, 0.25, 0.5, 0.75, 1];
          const closest = targets.reduce((prev, curr) =>
            Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev
          );
          // Only snap if extremely close (prevents forced jumps)
          return Math.abs(closest - progress) < 0.03 ? closest : progress;
        },
        duration: { min: 0.4, max: 0.8 },  // Slower, more natural feel
        delay: 0.1,
        ease: 'power3.out',
        directional: true,
      },
      invalidateOnRefresh: true,
    });

    // Fade-in animations for all major sections (smooth & early trigger)
    gsap.utils.toArray('.fade-in-section').forEach((el: any) => {
      gsap.fromTo(el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',           // Start fading earlier
            toggleActions: 'play none none reverse',
          }
        }
      );
    });

    // Debounced refresh on resize/orientation change
    let resizeTimer: NodeJS.Timeout | undefined;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
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
            <div className="noise-overlay" />
            <Navigation />
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
