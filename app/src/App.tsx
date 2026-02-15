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
    gsap.ticker.lagSmoothing(0); // remove micro-lag

    // GPU hints
    gsap.set('body, html, main, .content-wrapper', {
      willChange: 'transform',
      transform: 'translate3d(0,0,0)',
      backfaceVisibility: 'hidden',
    });

    ScrollTrigger.normalizeScroll(true); // smooth touch

    ScrollTrigger.getAll().forEach(st => st.kill());

    // Pin ONE long wrapper instead of many sections
    ScrollTrigger.create({
      trigger: '.content-wrapper',
      start: 'top top',
      end: 'bottom bottom',
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
      fastScrollEnd: true,
      scrub: 0.25,
      preventOverlaps: true,
      invalidateOnRefresh: true,
    });

    // Very gentle snap – almost no forced movement
    ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: (progress: number) => {
          const targets = [0, 0.25, 0.5, 0.75, 1];
          const closest = targets.reduce((prev, curr) =>
            Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev
          );
          return Math.abs(closest - progress) < 0.02 ? closest : progress;
        },
        duration: { min: 0.6, max: 1.2 }, // slower, more natural
        delay: 0.15,
        ease: 'power3.out',
        directional: true,
      },
      invalidateOnRefresh: true,
    });

    // Fade-in for sections
    gsap.utils.toArray('.fade-in-section').forEach((el: any) => {
      gsap.fromTo(el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    });

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

            {/* Single pinned wrapper for all content */}
            <main className="content-wrapper relative min-h-screen">
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
