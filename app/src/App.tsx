import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createClient } from '@supabase/supabase-js';
import { useAccount } from 'wagmi';

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

// Supabase client (use env vars — add to .env.local or Vercel dashboard)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null; // fallback — show warning in console if missing

const queryClient = new QueryClient();

function App() {
  const { address, isConnected } = useAccount();
  const [userTokens, setUserTokens] = useState<number>(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Fetch user's purchased token balance from Supabase on connect
  useEffect(() => {
    if (!isConnected || !address || !supabase) return;

    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from('presale_purchases')
        .select('tokens')
        .eq('wallet_address', address.toLowerCase());

      if (error) {
        console.error('Supabase fetch error:', error);
        return;
      }

      const total = data?.reduce((sum, row) => sum + Number(row.tokens || 0), 0) || 0;
      setUserTokens(total);
    };

    fetchBalance();

    // Optional: Realtime subscription for live updates
    const channel = supabase
      .channel('presale-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presale_purchases' }, (payload) => {
        if (payload.new.wallet_address.toLowerCase() === address.toLowerCase()) {
          setUserTokens((prev) => prev + Number(payload.new.tokens || 0));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, isConnected]);

  // Simple direction indicator logic (update later with real price/volume data)
  useEffect(() => {
    const interval = setInterval(() => {
      // Placeholder: in real version, fetch recent buys vs price change
      const rand = Math.random();
      setDirection(rand > 0.65 ? 'up' : rand > 0.35 ? 'down' : 'neutral');
    }, 20000); // refresh every 20s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fade-in animations for sections
    gsap.utils.toArray('.fade-in-section').forEach((el: any) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            toggleActions: 'play none none none',
            once: true,
          },
        }
      );
    });

    // RainbowKit modal scroll lock
    const handleModalChange = () => {
      const modal = document.querySelector('[data-rk] [role="dialog"]');
      document.body.classList.toggle('modal-open', !!modal);
    };

    const observer = new MutationObserver(handleModalChange);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
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
          <div className="relative bg-[#05060B] min-h-screen overflow-x-hidden">
            <div className="noise-overlay pointer-events-none" />
            <Navigation />

            <main className="relative">
              <HeroSection />
              <PresaleProgress direction={direction} />
              <BuySection
                userTokens={userTokens}
                direction={direction}
                supabase={supabase}
                walletAddress={address}
              />
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
