// @ts-nocheck
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ExternalLink, TrendingUp, Clock } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePresaleStore } from '../store/presaleStore';
import { PRESALE_CONFIG } from '../config/presaleConfig';

gsap.registerPlugin(ScrollTrigger);

export function StakingCTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { currentStage, totalRaised } = usePresaleStore();

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
          end: '+=120%',
          pin: true,
          scrub: 0.6,
        }
      });

      scrollTl
        .fromTo(card, 
          { x: '60vw', rotate: -8, scale: 0.94, opacity: 0 }, 
          { x: 0, rotate: -4, scale: 1, opacity: 1, ease: 'none' },
          0
        )
        .fromTo('.cta-headline', 
          { y: '4vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.1
        )
        .fromTo('.cta-body', 
          { y: '3vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.16
        )
        .fromTo('.cta-button', 
          { y: '3vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.2
        )
        .to({}, { duration: 0.4 })
        .fromTo(card, 
          { y: 0, opacity: 1 }, 
          { y: '-18vh', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(bg, 
          { opacity: 1 }, 
          { opacity: 0.7, ease: 'power2.in' },
          0.7
        );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleConnect = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
  };

  const currentPrice = PRESALE_CONFIG.STAGES[currentStage - 1]?.price || PRESALE_CONFIG.STAGES[0].price;

  return (
    <section 
      ref={sectionRef} 
      className="section-pinned z-50 flex items-center justify-center"
    >
      {/* Background Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
      >
        <img 
          src="/final_city_bg_06.jpg" 
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/90" />
      </div>

      {/* Final CTA Card */}
      <div 
        ref={cardRef}
        className="glass-card relative w-[min(92vw,520px)] rounded-[28px] overflow-hidden p-8"
        style={{ transform: 'rotate(-4deg)', opacity: 0 }}
      >
        {/* Card Glow */}
        <div className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(43,255,241,0.1) 0%, transparent 60%)'
          }}
        />

        {/* Content */}
        <div className="relative text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-[#2BFFF1]" />
            </div>
          </div>

          {/* Presale Status */}
          <div className="cta-headline flex items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Presale Live - Stage {currentStage}
            </span>
          </div>

          {/* Headline */}
          <h2 className="cta-headline text-[clamp(26px,3.5vw,36px)] font-bold text-[#F4F6FA] mb-4 leading-tight">
            Don't miss <span className="text-[#2BFFF1]">Stage {currentStage}</span> pricing
          </h2>

          {/* Price Info */}
          <div className="cta-body p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A7B0B7] text-sm">Current Price</span>
              <span className="text-[#2BFFF1] font-bold">${currentPrice.toFixed(5)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A7B0B7] text-sm">Total Raised</span>
              <span className="text-[#F4F6FA] font-medium">${totalRaised.toLocaleString()}</span>
            </div>
          </div>

          {/* Body */}
          <p className="cta-body text-[#A7B0B7] text-[clamp(14px,1.2vw,16px)] mb-8 leading-relaxed">
            Connect your wallet and secure your Kaleo tokens at the current stage price. 
            Price increases when each stage sells out.
          </p>

          {/* Features */}
          <div className="cta-body flex flex-wrap justify-center gap-2 mb-8">
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs">
              100x Leverage
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs">
              Pump.fun Integration
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-xs">
              Fee Contests
            </span>
          </div>

          {/* CTAs */}
          <div className="cta-button flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleConnect}
              className="neon-button px-8 py-4 text-base font-semibold flex items-center gap-2"
            >
              {isConnected ? 'Buy Kaleo Now' : 'Connect Wallet'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#whitepaper"
              className="text-[#A7B0B7] hover:text-[#2BFFF1] text-sm font-medium transition-colors flex items-center gap-2 px-4 py-4"
            >
              Read White Paper
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
