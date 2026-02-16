import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { config } from './wagmi';
import { Navigation } from './components/Navigation';
import { HeroSection } from './sections/HeroSection';
import { PresaleProgress } from './sections/PresaleProgress';
import { BuySection } from './sections/BuySection';
import { StatsSection } from './sections/StatsSection';
import { FeatureSection } from './sections/FeatureSection';
import { FeaturesGridSection } from './sections/FeaturesGridSection';
import { StakingCTASection } from './sections/StakingCTASection';
import { RoadmapSection } from './sections/RoadmapSection';
import { WhitePaperSection } from './sections/WhitePaperSection';
import { FAQSection } from './sections/FAQSection';
import { FooterSection } from './sections/FooterSection';

import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Simple fade-in animations for sections -- no pinning, no scroll hijacking
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
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );
    });

    // Modal scroll lock for RainbowKit
    const handleModalChange = () => {
      if (document.querySelector('[data-rk]')?.querySelector('[role="dialog"]')) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    };
    const observer = new MutationObserver(handleModalChange);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      observer.disconnect();
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
              <StakingCTASection />
              <RoadmapSection />
              <WhitePaperSection />
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
