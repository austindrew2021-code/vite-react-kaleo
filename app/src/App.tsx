import { useEffect, useState, Component } from 'react';
import type { ReactNode } from 'react';
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

// ── Error Boundary — catches render errors so we see a message not a black screen ──
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#05060B', color: '#2BFFF1', padding: '40px', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2 style={{ color: '#ff4444', marginBottom: '16px' }}>⚠ Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: '13px' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#555', fontSize: '11px', marginTop: '12px' }}>{this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '24px', padding: '10px 24px', background: '#2BFFF1', color: '#05060B', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const queryClient = new QueryClient();

// ── Inner component — sits INSIDE all providers so hooks work correctly ──
function AppContent() {
  const { address, isConnected } = useAccount();
  const [userTokens, setUserTokens] = useState<number>(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    if (!isConnected || !address || !supabase) return;

    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from('presale_purchases')
        .select('tokens')
        .eq('wallet_address', address.toLowerCase());
      if (error) { console.error('Supabase fetch error:', error); return; }
      const total = data?.reduce((sum, row) => sum + Number(row.tokens || 0), 0) || 0;
      setUserTokens(total);
    };
    fetchBalance();

    const channel = supabase
      .channel('presale-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presale_purchases' }, (payload) => {
        if (payload.new.wallet_address.toLowerCase() === address.toLowerCase()) {
          setUserTokens((prev) => prev + Number(payload.new.tokens || 0));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [address, isConnected]);

  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      setDirection(rand > 0.65 ? 'up' : rand > 0.35 ? 'down' : 'neutral');
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    gsap.utils.toArray('.fade-in-section').forEach((el: any) => {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none none', once: true },
      });
    });

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
    <div className="relative bg-[#05060B] min-h-screen overflow-x-hidden">
      <div className="noise-overlay pointer-events-none" />
      <Navigation />
      <main className="relative">
        <HeroSection />
        <PresaleProgress direction={direction} />
        <BuySection userTokens={userTokens} direction={direction} supabase={supabase} walletAddress={address} />
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
  );
}

// ── Root — sets up providers, then renders AppContent inside them ──
function App() {
  return (
    <ErrorBoundary>
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
            <AppContent />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;
