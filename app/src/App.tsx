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
    gsap.ticker.lagSmoothing(0);

    // GPU acceleration for everything
    gsap.set('body, html, main.content-wrapper, section', {
      willChange: 'transform',
      transform: 'translate3d(0,0,0)',
      backfaceVisibility: 'hidden',
    });

    ScrollTrigger.normalizeScroll(true); // smooth touch on mobile

    // Clean up old triggers
    ScrollTrigger.getAll().forEach(st => st.kill());

    // Pin ONLY the content wrapper – no per-section pinning conflicts
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

    // Quick fade-in for all sections (0.6s duration, early trigger)
    gsap.utils.toArray('.fade-in-section').forEach((el: any) => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            once: false,
          }
        }
      );
    });

    // Debounced refresh on resize/orientation
    let resizeTimer: NodeJS.Timeout | undefined;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Modal body scroll lock
    const handleModalChange = () => {
      if (document.querySelector('.rk-modal-backdrop')) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    };
    const observer = new MutationObserver(handleModalChange);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer.disconnect();
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
          modalSize="compact" // smaller modal = better mobile fit
        >
          <div className="relative bg-[#05060B] min-h-screen">
            <div className="noise-overlay" />
            <Navigation />

            {/* Single pinned wrapper – free scroll inside, all sections visible */}
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
