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
import { FAQSection } from './sections/FAQSection';
import { WhitePaperSection } from './sections/WhitePaperSection';

import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    // Clean up old triggers
    ScrollTrigger.getAll().forEach(st => st.kill());

    // Simple fade-in for all sections on scroll (no pinning, no scroll hijacking)
    gsap.utils.toArray('.fade-in-section').forEach((el: any) => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );
    });

    // Debounced refresh on resize/orientation
    let resizeTimer: NodeJS.Timeout | undefined;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Modal body scroll lock for RainbowKit
    const handleModalChange = () => {
      const hasModal = document.querySelector('[data-rk] [role="dialog"]') ||
                       document.querySelector('[data-rk] [aria-modal="true"]');
      if (hasModal) {
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
          modalSize="compact"
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
              <WhitePaperSection />
              <RoadmapSection />
              <StakingCTASection />
              <FAQSection />
              <FooterSection />
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
