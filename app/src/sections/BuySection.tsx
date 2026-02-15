import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAccount } from 'wagmi';
import { ArrowRight, Info, Wallet, TrendingUp, Zap } from 'lucide-react';
import { usePresaleStore } from '../store/presaleStore';

gsap.registerPlugin(ScrollTrigger);

export function BuySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();
  
  const { ethAmount, setEthAmount, tokenAmount, setTokenAmount } = usePresaleStore();
  const [isCalculating, setIsCalculating] = useState(false);

  const TOKEN_PRICE = 0.0042; // ETH per KLEO
  const MIN_ETH = 0.05;
  const MAX_ETH = 10;

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const bg = bgRef.current;

    if (!section || !card || !bg) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          fastScrollEnd: true,
        }
      });

      // Entrance (0% - 30%)
      scrollTl
        .fromTo(card, 
          { x: '60vw', opacity: 0, scale: 0.9 }, 
          { x: 0, opacity: 1, scale: 1, ease: 'none' },
          0
        )
        .fromTo('.buy-title', 
          { x: '-10vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'none' },
          0.05
        )
        .fromTo('.buy-input', 
          { y: '4vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.1
        )
        .fromTo('.buy-button', 
          { y: '4vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.15
        )
        .to({}, { duration: 0.4 }) // Settle (30% - 70%)
        // Exit (70% - 100%)
        .fromTo(card, 
          { x: 0, opacity: 1 }, 
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(bg, 
          { scale: 1 }, 
          { scale: 1.05, ease: 'power2.in' },
          0.7
        );

    }, section);

    return () => ctx.revert();
  }, []);

  const handleEthChange = (value: string) => {
    setEthAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const tokens = (parseFloat(value) / TOKEN_PRICE).toFixed(2);
      setTokenAmount(tokens);
    } else {
      setTokenAmount('');
    }
  };

  const handleBuy = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    const eth = parseFloat(ethAmount);
    if (isNaN(eth) || eth < MIN_ETH || eth > MAX_ETH) {
      alert(`Please enter an amount between ${MIN_ETH} and ${MAX_ETH} ETH`);
      return;
    }
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      alert(`Successfully purchased ${tokenAmount} KLEO tokens!`);
      setEthAmount('');
      setTokenAmount('');
    }, 1500);
  };

  const setPresetAmount = (amount: number) => {
    handleEthChange(amount.toString());
  };

  return (
    <section 
      ref={sectionRef} 
      id="buy"
      className="pinned-section min-h-screen z-20 flex items-center justify-center relative"
    >
      {/* Background Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
      >
        <img 
          src="/stage_city_bg_02.jpg" 
          alt="Cyberpunk street"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/85" />
      </div>

      {/* Main Card */}
      <div 
        ref={cardRef}
        className="glass-card relative w-[min(92vw,520px)] rounded-[28px] overflow-hidden p-8"
        style={{ opacity: 0 }}
      >
        {/* Card Glow */}
        <div className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(43,255,241,0.1) 0%, transparent 60%)'
          }}
        />

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="buy-title text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#2BFFF1]" />
              </div>
            </div>
            <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-[#F4F6FA]">
              Buy Kaleo
            </h2>
            <p className="text-[#2BFFF1] text-lg font-medium mt-1">
              1 KLEO = ${TOKEN_PRICE}
            </p>
          </div>

          {/* Leverage Badge */}
          <div className="buy-title flex items-center justify-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Up to 100x Leverage
            </span>
          </div>

          {/* Input Section */}
          <div className="buy-input mb-4">
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
                step="0.01"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A7B0B7] text-sm font-medium">
                ETH
              </span>
            </div>
            
            {/* Preset Amounts */}
            <div className="flex gap-2 mt-3">
              {[0.1, 0.5, 1, 5].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setPresetAmount(amount)}
                  className="flex-1 px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors"
                >
                  {amount} ETH
                </button>
              ))}
            </div>
          </div>

          {/* Token Output */}
          {tokenAmount && (
            <div className="buy-input mb-4 p-4 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30">
              <p className="text-[#A7B0B7] text-sm mb-1">You receive</p>
              <p className="text-[#2BFFF1] text-2xl font-bold">
                {tokenAmount} <span className="text-lg">KLEO</span>
              </p>
            </div>
          )}

          {/* Buy Button */}
          <button
            onClick={handleBuy}
            disabled={isCalculating || !ethAmount}
            className="buy-button neon-button w-full py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                Buy Kaleo
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Helper Text */}
          <div className="buy-button mt-4 flex items-center justify-center gap-2 text-[#A7B0B7] text-xs">
            <Info className="w-4 h-4" />
            <span>Min: {MIN_ETH} ETH · Max: {MAX_ETH} ETH</span>
          </div>
        </div>
      </div>
    </section>
  );
}
