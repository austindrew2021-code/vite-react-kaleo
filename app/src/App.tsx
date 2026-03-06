import { useEffect, useState, Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { lockScroll, forceUnlockScroll } from './utils/scrollLock';
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
import { EvmWalletPicker } from './components/EvmWalletPicker';
import { HeroSection } from './sections/HeroSection';
import { PresaleProgress } from './sections/PresaleProgress';
import { BuySection } from './sections/BuySection';

// ── Lazy-load below-the-fold sections — reduces initial JS parse time ──────
// Users see Hero + Buy in ~1s; the rest streams in as they scroll.
const StatsSection       = lazy(() => import('./sections/StatsSection').then(m => ({ default: m.StatsSection })));
const FeatureSection     = lazy(() => import('./sections/FeatureSection').then(m => ({ default: m.FeatureSection })));
const FeaturesGridSection= lazy(() => import('./sections/FeaturesGridSection').then(m => ({ default: m.FeaturesGridSection })));
const StakingCTASection  = lazy(() => import('./sections/StakingCTASection').then(m => ({ default: m.StakingCTASection })));
const RoadmapSection     = lazy(() => import('./sections/RoadmapSection').then(m => ({ default: m.RoadmapSection })));
const WhitePaperSection  = lazy(() => import('./sections/WhitePaperSection').then(m => ({ default: m.WhitePaperSection })));
const FAQSection         = lazy(() => import('./sections/FAQSection').then(m => ({ default: m.FAQSection })));
const FooterSection      = lazy(() => import('./sections/FooterSection').then(m => ({ default: m.FooterSection })));

// Minimal fallback — invisible spacer so layout doesn't jump
const SectionFallback = () => <div style={{ minHeight: '200px' }} />;

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
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('up');
  const [stripeSuccess, setStripeSuccess] = useState<string | null>(null);
  const [stripeCanceled, setStripeCanceled] = useState(false);

  const { totalRaised, addRaised, addPurchase } = usePresaleStore();

  // ── Fetch user token balance from Supabase whenever wallet connects ──
  useEffect(() => {
    if (!isConnected || !address || !supabase) return;
    supabase
      .from('presale_purchases')
      .select('tokens')
      .eq('wallet_address', address.toLowerCase())
      .then(({ error }) => {
        if (error) console.error('Supabase fetch error:', error.message, error.code);
        // Token total can be summed here when a balance display is added
      });
  }, [address, isConnected]);

  // ── Handle Stripe redirect back — record purchase to Supabase + update store ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
      const tokensParam = params.get('tokens');
      const walletParam = params.get('wallet');
      const sessionId = params.get('session_id') || 'stripe';
      const tokens = tokensParam ? parseFloat(tokensParam) : 0;

      // ── Guard against double-processing (MetaMask browser reloads page after
      //    wallet approval, which re-runs this effect with the same URL) ──────
      const processedKey = `_kleo_stripe_processed_${sessionId}`;
      const alreadyProcessed = localStorage.getItem(processedKey);

      // Always clean URL immediately so subsequent reloads don't see ?success=true
      window.history.replaceState({}, '', '/');

      if (!alreadyProcessed && tokens > 0) {
        localStorage.setItem(processedKey, '1');
        // Clear this guard after 10 minutes so it doesn't accumulate forever
        setTimeout(() => localStorage.removeItem(processedKey), 10 * 60 * 1000);

        const usdParam = params.get('usd') || '0';
        const usdSpent = parseFloat(usdParam) || 0;
        const stage = getCurrentStage(totalRaised);

        addRaised(usdSpent);
        addPurchase({
          usdSpent,
          kleoReceived: tokens,
          stage: stage.stage,
          priceUsd: stage.priceUsd,
          txHash: sessionId,
          timestamp: Date.now(),
          cryptoType: 'card',
        });

        // Insert to Supabase with correct column names
        if (supabase && walletParam) {
          supabase
            .from('presale_purchases')
            .upsert({
              wallet_address: walletParam.toLowerCase(),
              tokens,
              eth_spent: 0,
              usd_amount: usdSpent,
              stage: stage.stage,
              price_eth: stage.priceUsd,
              tx_hash: sessionId,
              payment_method: 'card',
            }, { onConflict: 'tx_hash', ignoreDuplicates: true })
            .then(({ error }) => {
              if (error) console.error('Supabase card insert failed:', error.message, error.code);
            });
        }
      }

      setStripeSuccess(tokens > 0 ? tokens.toLocaleString() : 'Your');
    }

    if (params.get('canceled') === 'true') {
      setStripeCanceled(true);
      window.history.replaceState({}, '', '/');
      setTimeout(() => setStripeCanceled(false), 5000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Price direction — always bullish ──
  useEffect(() => {
    const bullish: Array<'up' | 'neutral'> = ['up', 'up', 'up', 'neutral', 'up', 'up'];
    const interval = setInterval(() => {
      setDirection(bullish[Math.floor(Math.random() * bullish.length)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let release: (() => void) | null = null;
    const handleModalChange = () => {
      const modal = document.querySelector('[data-rk] [role="dialog"]');
      if (modal && !release) {
        release = lockScroll();
      } else if (!modal && release) {
        release();
        release = null;
      }
    };
    const observer = new MutationObserver(handleModalChange);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      observer.disconnect();
      release?.();
      forceUnlockScroll();
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
              {stripeSuccess} KLEO tokens reserved for your wallet. They will be credited at mainnet launch.
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
      {/* Global EVM wallet picker — triggered by Nav, BuySection, or any CTA */}
      <EvmWalletPicker />
      <main className="relative">
        <HeroSection />
        <PresaleProgress direction={direction} />
        <BuySection />
        <Suspense fallback={<SectionFallback />}>
          <StatsSection />
          <FeatureSection />
          <FeaturesGridSection />
          <StakingCTASection />
          <RoadmapSection />
          <WhitePaperSection />
          <FAQSection />
          <FooterSection />
        </Suspense>
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
