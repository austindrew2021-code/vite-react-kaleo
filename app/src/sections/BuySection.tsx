import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Info, Wallet, TrendingUp, Zap, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePresaleStore } from '../store/presaleStore';
import { usePresale } from '../hooks/usePresale';

gsap.registerPlugin(ScrollTrigger);

export function BuySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { ethAmount, setEthAmount, tokenAmount, setTokenAmount } = usePresaleStore();

  const {
    isConnected,
    isOnSepolia,
    buyTokens,
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
  } = usePresale();

  const MIN_ETH = 0.001;
  const MAX_ETH = 100;

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;

    if (!section || !card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleEthChange = (value: string) => {
    setEthAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const tokens = calculateTokenAmount(value);
      setTokenAmount(tokens);
    } else {
      setTokenAmount('');
    }
  };

  const handleBuy = () => {
    if (!isConnected) return;

    if (!isOnSepolia) {
      switchToSepolia();
      return;
    }

    const eth = parseFloat(ethAmount);
    if (isNaN(eth) || eth < MIN_ETH || eth > MAX_ETH) return;

    buyTokens(ethAmount);
  };

  const handleDismissTx = () => {
    resetTx();
    setEthAmount('');
    setTokenAmount('');
  };

  const setPresetAmount = (amount: number) => {
    handleEthChange(amount.toString());
  };

  const isProcessing = txStatus === 'pending' || isSending || isConfirming;
  const etherscanLink = txHash
    ? `https://sepolia.etherscan.io/tx/${txHash}`
    : null;

  return (
    <section
      ref={sectionRef}
      id="buy"
      className="fade-in-section flex items-center justify-center relative overflow-hidden py-24"
    >
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/stage_city_bg_02.jpg"
          alt="Cyberpunk street"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/85" />
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        className="glass-card relative w-[min(92vw,520px)] rounded-[28px] overflow-hidden p-8 mx-auto"
        style={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(43,255,241,0.1) 0%, transparent 60%)'
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#2BFFF1]" />
              </div>
            </div>
            <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-[#F4F6FA]">
              Buy Kaleo
            </h2>
            <p className="text-[#2BFFF1] text-lg font-medium mt-1">
              Stage {currentStage.stage} &mdash; {currentStage.priceEth} ETH/KLEO
            </p>
            {nextStage && (
              <p className="text-[#A7B0B7] text-xs mt-1">
                Next stage: {nextStage.priceEth} ETH/KLEO ({nextStage.discount}% off listing)
              </p>
            )}
          </div>

          {/* Stage + Discount Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {currentStage.discount}% Discount vs Listing
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#A7B0B7] text-xs font-medium">
              Stage {currentStage.stage}/12
            </span>
          </div>

          {/* Transaction Status Overlay */}
          {txStatus !== 'idle' && (
            <div className="mb-4 p-4 rounded-xl border text-center">
              {(txStatus === 'pending' || txStatus === 'confirming') && (
                <div className="border-[#2BFFF1]/30 bg-[#2BFFF1]/5">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="animate-spin h-5 w-5 text-[#2BFFF1]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-[#2BFFF1] font-medium">
                      {txStatus === 'pending' ? 'Waiting for wallet approval...' : 'Confirming on Sepolia...'}
                    </span>
                  </div>
                  {etherscanLink && (
                    <a
                      href={etherscanLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2BFFF1] text-xs underline flex items-center justify-center gap-1"
                    >
                      View on Etherscan <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {txStatus === 'success' && (
                <div className="border-green-500/30 bg-green-500/5 p-4 rounded-xl border">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Transaction Confirmed!</span>
                  </div>
                  <p className="text-[#A7B0B7] text-sm mb-2">
                    You purchased {tokenAmount} KLEO at Stage {currentStage.stage} pricing.
                  </p>
                  {etherscanLink && (
                    <a
                      href={etherscanLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2BFFF1] text-sm underline flex items-center justify-center gap-1 mb-3"
                    >
                      View on Etherscan <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={handleDismissTx}
                    className="text-[#A7B0B7] text-xs hover:text-[#F4F6FA] transition-colors"
                  >
                    Buy More
                  </button>
                </div>
              )}

              {txStatus === 'error' && (
                <div className="border-red-500/30 bg-red-500/5 p-4 rounded-xl border">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">Transaction Failed</span>
                  </div>
                  <p className="text-[#A7B0B7] text-sm mb-3">{txError || 'Something went wrong'}</p>
                  <button
                    onClick={resetTx}
                    className="text-[#2BFFF1] text-sm underline hover:text-[#F4F6FA] transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Buy Form (hidden during active tx) */}
          {txStatus === 'idle' && (
            <>
              {/* Not on Sepolia warning */}
              {isConnected && !isOnSepolia && (
                <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                  <p className="text-yellow-400 text-sm mb-2 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Wrong network detected
                  </p>
                  <button
                    onClick={switchToSepolia}
                    className="neon-button px-4 py-2 text-xs font-semibold"
                  >
                    Switch to Sepolia
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="mb-4">
                <label className="block text-[#A7B0B7] text-sm mb-2 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Pay with ETH
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={ethAmount}
                    onChange={(e) => handleEthChange(e.target.value)}
                    placeholder="0.0"
                    className="input-glass w-full px-4 py-4 text-xl font-semibold"
                    min={MIN_ETH}
                    max={MAX_ETH}
                    step="0.001"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A7B0B7] text-sm font-medium">
                    ETH
                  </span>
                </div>

                {/* Preset Amounts */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[0.01, 0.05, 0.1, 0.5].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPresetAmount(amount)}
                      className="flex-1 min-w-[70px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors"
                    >
                      {amount} ETH
                    </button>
                  ))}
                </div>
              </div>

              {/* Token Output */}
              {tokenAmount && tokenAmount !== '0' && (
                <div className="mb-4 p-4 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-center">
                  <p className="text-[#A7B0B7] text-sm mb-1">You receive</p>
                  <p className="text-[#2BFFF1] text-2xl font-bold">
                    {tokenAmount} <span className="text-lg">KLEO</span>
                  </p>
                </div>
              )}

              {/* Buy Button */}
              <button
                onClick={handleBuy}
                disabled={isProcessing || !ethAmount || !isConnected}
                className="neon-button w-full py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isConnected ? (
                  'Connect Wallet to Buy'
                ) : !isOnSepolia ? (
                  'Switch to Sepolia'
                ) : (
                  <>
                    Buy Kaleo
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Helper Text */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[#A7B0B7] text-xs">
                <Info className="w-4 h-4" />
                <span>Min: {MIN_ETH} ETH &middot; Max: {MAX_ETH} ETH &middot; Direct ETH transfer</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
