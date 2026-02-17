import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  Info,
  Wallet,
  TrendingUp,
  Zap,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { usePresale } from '../hooks/usePresale';
import { usePresaleStore } from '../store/presaleStore';

gsap.registerPlugin(ScrollTrigger);

export function BuySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { ethAmount, setEthAmount, tokenAmount, setTokenAmount } = usePresaleStore();

  const {
    isConnected,
    isOnSepolia,
    buyWithEth,
    buyWithCard,
    switchToSepolia,
    calculateTokenAmount,
    resetTx,
    currentStage,
    nextStage,
    txHash,
    txStatus,
    txError,
    isSending,
    isConfirming,
    stripeLoading,
    directionIndicator,
  } = usePresale();

  const [tab, setTab] = useState<'eth' | 'card'>('eth');
  const [usdAmount, setUsdAmount] = useState('100');

  const MIN_ETH = 0.001;
  const MAX_ETH = 100;
  const MIN_USD = 10;

  useEffect(() => {
    if (sectionRef.current && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        }
      );
    }
  }, []);

  const handleEthChange = (value: string) => {
    setEthAmount(value);
    setTokenAmount(calculateTokenAmount(value, true));
  };

  const handleUsdChange = (value: string) => {
    setUsdAmount(value);
    setTokenAmount(calculateTokenAmount(value, false));
  };

  const handleBuy = () => {
    if (tab === 'eth') {
      if (!ethAmount) return;
      buyWithEth(ethAmount);
    } else {
      if (!usdAmount || parseFloat(usdAmount) < MIN_USD) return;
      buyWithCard(usdAmount);
    }
  };

  const handleDismissTx = () => {
    resetTx();
    setEthAmount('');
    setTokenAmount('');
    setUsdAmount('100');
  };

  const isProcessing = txStatus !== 'idle' || isSending || isConfirming || stripeLoading;
  const etherscanLink = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

  return (
    <section
      ref={sectionRef}
      id="buy"
      className="fade-in-section relative overflow-hidden py-16"
    >
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/stage_city_bg_02.jpg"
          alt="Background"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/85" />
      </div>

      <div ref={cardRef} className="glass-card relative w-[min(92vw,560px)] rounded-[28px] overflow-hidden p-8 mx-auto">
        <div className="relative">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <TrendingUp className="w-7 h-7 text-[#2BFFF1]" />
              <h2 className="text-4xl font-bold text-[#F4F6FA]">Buy Kaleo</h2>
            </div>
            <p className="text-[#2BFFF1] text-xl font-medium">
              Stage {currentStage.stage} — {currentStage.priceEth} ETH / KLEO
            </p>
            <p className={`mt-2 text-lg font-semibold ${directionIndicator.color}`}>
              {directionIndicator.text}
            </p>
            {nextStage && (
              <p className="text-[#A7B0B7] text-sm mt-1">
                Next: {nextStage.priceEth} ETH/KLEO ({nextStage.discount}% off listing)
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setTab('eth')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                tab === 'eth'
                  ? 'bg-[#2BFFF1] text-[#05060B] shadow-lg shadow-[#2BFFF1]/30'
                  : 'bg-white/5 border border-white/10 hover:border-[#2BFFF1]/50'
              }`}
            >
              ETH (Sepolia)
            </button>
            <button
              onClick={() => setTab('card')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                tab === 'card'
                  ? 'bg-[#2BFFF1] text-[#05060B] shadow-lg shadow-[#2BFFF1]/30'
                  : 'bg-white/5 border border-white/10 hover:border-[#2BFFF1]/50'
              }`}
            >
              Card (Stripe)
            </button>
          </div>

          {txStatus !== 'idle' && (
            <div className="mb-6 p-5 rounded-xl border text-center">
              {(txStatus === 'pending' || txStatus === 'confirming' || stripeLoading) && (
                <div className="border-[#2BFFF1]/30 bg-[#2BFFF1]/5">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <svg className="animate-spin h-6 w-6 text-[#2BFFF1]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-[#2BFFF1] font-medium text-lg">
                      {stripeLoading ? 'Redirecting to Stripe...' : txStatus === 'pending' ? 'Approve in wallet...' : 'Confirming...'}
                    </span>
                  </div>
                  {etherscanLink && (
                    <a href={etherscanLink} target="_blank" rel="noopener noreferrer" className="text-[#2BFFF1] underline flex items-center justify-center gap-2">
                      View on Etherscan <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {txStatus === 'success' && (
                <div className="border-green-500/30 bg-green-500/5 p-5 rounded-xl border">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p className="text-green-400 font-semibold text-lg mb-2">Success!</p>
                  <p className="text-[#A7B0B7] mb-4">
                    You received {tokenAmount} KLEO
                  </p>
                  {etherscanLink && (
                    <a href={etherscanLink} target="_blank" rel="noopener noreferrer" className="text-[#2BFFF1] underline flex items-center justify-center gap-2 mb-4">
                      View Tx <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={handleDismissTx} className="text-[#2BFFF1] hover:underline">
                    Buy More
                  </button>
                </div>
              )}

              {txStatus === 'error' && (
                <div className="border-red-500/30 bg-red-500/5 p-5 rounded-xl border">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400 font-semibold text-lg mb-2">Failed</p>
                  <p className="text-[#A7B0B7] mb-4">{txError}</p>
                  <button onClick={resetTx} className="text-[#2BFFF1] underline hover:text-white">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {txStatus === 'idle' && (
            <>
              {!isConnected && (
                <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                  <p className="text-yellow-300 mb-3">Connect wallet to buy</p>
                </div>
              )}

              {isConnected && !isOnSepolia && tab === 'eth' && (
                <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                  <p className="text-yellow-300 mb-3 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Wrong network
                  </p>
                  <button onClick={switchToSepolia} className="neon-button px-6 py-3 text-sm">
                    Switch to Sepolia
                  </button>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-[#A7B0B7] mb-2 flex items-center gap-2">
                  {tab === 'eth' ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  {tab === 'eth' ? 'Pay with ETH' : 'Pay with Card (USD)'}
                </label>

                <div className="relative">
                  <input
                    type="number"
                    value={tab === 'eth' ? ethAmount : usdAmount}
                    onChange={(e) => (tab === 'eth' ? handleEthChange(e.target.value) : handleUsdChange(e.target.value))}
                    placeholder="0.0"
                    min={tab === 'eth' ? MIN_ETH : MIN_USD}
                    step="any"
                    className="input-glass w-full px-5 py-5 text-2xl font-semibold"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A7B0B7] font-medium">
                    {tab === 'eth' ? 'ETH' : 'USD'}
                  </span>
                </div>

                <div className="flex gap-3 mt-4 flex-wrap">
                  {tab === 'eth' ? (
                    [0.01, 0.05, 0.1, 0.5].map(a => (
                      <button key={a} onClick={() => handleEthChange(a.toString())} className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#2BFFF1]/50 text-sm">
                        {a} ETH
                      </button>
                    ))
                  ) : (
                    [50, 100, 250, 500].map(a => (
                      <button key={a} onClick={() => handleUsdChange(a.toString())} className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#2BFFF1]/50 text-sm">
                        ${a}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {tokenAmount && tokenAmount !== '0' && (
                <div className="mb-8 p-5 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-center">
                  <p className="text-[#A7B0B7] mb-2">You will receive</p>
                  <p className="text-[#2BFFF1] text-3xl font-bold">
                    {tokenAmount} <span className="text-xl">KLEO</span>
                  </p>
                </div>
              )}

              <button
                onClick={handleBuy}
                disabled={isProcessing || !isConnected || !(tab === 'eth' ? ethAmount : usdAmount)}
                className="neon-button w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isConnected
                  ? 'Connect Wallet'
                  : tab === 'eth'
                  ? 'Buy with ETH'
                  : stripeLoading
                  ? 'Redirecting...'
                  : 'Buy with Card'}
                <ArrowRight className="w-6 h-6" />
              </button>

              <div className="mt-5 text-center text-[#A7B0B7] text-sm flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                {tab === 'eth'
                  ? `Min: ${MIN_ETH} ETH · Max: ${MAX_ETH} ETH · Direct to presale wallet`
                  : 'Min $10 · Processed via Stripe · Tokens credited after payment'}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
                      }
