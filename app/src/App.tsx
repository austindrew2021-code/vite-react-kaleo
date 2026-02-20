import { useEffect, useState, Component } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createClient } from '@supabase/supabase-js';
import { useAccount } from 'wagmi';
import { usePresaleStore, getCurrentStage } from './store/presaleStore';

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
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('up');
  const [stripeSuccess, setStripeSuccess] = useState<string | null>(null);
  const [stripeCanceled, setStripeCanceled] = useState(false);

  const { totalRaised, addRaised, addPurchase } = usePresaleStore();

  // Handle Stripe redirect — record purchase to Supabase + update store
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
      const tokensParam = params.get('tokens');
      const walletParam = params.get('wallet');
      const sessionId = params.get('session_id') || 'stripe';
      const tokens = tokensParam ? parseFloat(tokensParam) : 0;

      if (tokens > 0) {
        const stage = getCurrentStage(totalRaised);
        const ethEquivalent = tokens * stage.priceEth;

        // Update local store immediately so UI refreshes
        addRaised(ethEquivalent);
        addPurchase({
          ethSpent: ethEquivalent,
          kleoReceived: tokens,
          stage: stage.stage,
          priceEth: stage.priceEth,
          txHash: sessionId,
          timestamp: Date.now(),
        });

        // Also update the displayed user token balance
        setUserTokens((prev) => prev + tokens);

        // Persist to Supabase
        if (supabase && walletParam) {
          supabase
            .from('presale_purchases')
            .insert({
              wallet_address: walletParam.toLowerCase(),
              tokens,
              eth_spent: ethEquivalent,
              stage: stage.stage,
              price_eth: stage.priceEth,
              tx_hash: sessionId,
              method: 'card',
            })
            .then(({ error }) => {
              if (error) console.error('Supabase card insert failed:', error);
            });
        }
      }

      setStripeSuccess(tokens > 0 ? tokens.toLocaleString() : 'Your');
      window.history.replaceState({}, '', '/');
    }

    if (params.get('canceled') === 'true') {
      setStripeCanceled(true);
      window.history.replaceState({}, '', '/');
      setTimeout(() => setStripeCanceled(false), 5000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const bullishStates: Array<'up' | 'neutral'> = ['up', 'up', 'up', 'neutral', 'up', 'up'];
      let idx = Math.floor(Math.random() * bullishStates.length);
      setDirection(bullishStates[idx]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only animate sections that don't have their own GSAP animations
    // (sections with their own useEffect handle their own entrance)
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

      {/* Stripe payment success toast */}
      {stripeSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,480px)] bg-[#0B1A1A] border border-[#2BFFF1]/40 rounded-2xl px-6 py-4 shadow-2xl shadow-cyan-500/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#2BFFF1]/15 border border-[#2BFFF1]/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[#2BFFF1] text-lg">✓</span>
          </div>
          <div className="flex-1">
            <p className="text-[#F4F6FA] font-bold text-base mb-1">Payment Successful!</p>
            <p className="text-[#A7B0B7] text-sm leading-relaxed">
              {stripeSuccess} KLEO tokens have been reserved for your wallet and will be credited at mainnet launch.
            </p>
          </div>
          <button onClick={() => setStripeSuccess(null)} className="text-[#A7B0B7] hover:text-white text-xl leading-none shrink-0 mt-0.5">×</button>
        </div>
      )}

      {/* Stripe payment canceled toast */}
      {stripeCanceled && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,400px)] bg-[#1A0B0B] border border-red-500/30 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
          <span className="text-red-400 text-lg">✕</span>
          <p className="text-[#A7B0B7] text-sm">Payment canceled. No charge was made.</p>
        </div>
      )}

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
