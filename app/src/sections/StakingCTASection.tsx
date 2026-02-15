import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ExternalLink, TrendingUp } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

gsap.registerPlugin(ScrollTrigger);

export function StakingCTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const bg = bgRef.current;

    if (!section || !card || !bg) return;

    // Initial quick fade-in on load (draw-in effect)
    gsap.fromTo(section, 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          pin: true,
          pinSpacing: false,
          scrub: 0.2,                  // Faster response → feels natural
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
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
          0.05
        )
        .fromTo('.cta-body', 
          { y: '3vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.1
        )
        .fromTo('.cta-button', 
          { y: '3vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'none' },
          0.15
        )
        .to({}, { duration: 0.4 }) // Settle time
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

      // Stagger entrance for CTA elements
      gsap.fromTo('.cta-element',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

    }, section);

    return () => ctx.revert();
  }, []);

  const handleConnect = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
  };

  return (
    <section
      ref={sectionRef}
      className="pinned-section fade-in-section min-h-screen z-50 flex items-center justify-center relative overflow-hidden"
    >
      {/* Background Image – eager load to prevent flash */}
      <div ref={bgRef} className="absolute inset-0 w-full h-full">
        <img
          src="/final_city_bg_06.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/90" />
      </div>

      {/* CTA Card – centered on all screens */}
      <div
        ref={cardRef}
        className="glass-card relative w-[min(92vw,520px)] rounded-[28px] overflow-hidden p-8 mx-auto"
        style={{ transform: 'rotate(-4deg)', opacity: 0 }}
      >
        {/* Card Glow */}
        <div
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(43,255,241,0.1) 0%, transparent 60%)'
          }}
        />

        {/* Content */}
        <div className="relative text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2BFFF1]/20 to-[#00D4FF]/20 border border-[#2BFFF1]/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <TrendingUp className="w-8 h-8 text-[#2BFFF1]" />
            </div>
          </div>

          {/* Headline */}
          <h2 className="cta-headline cta-element text-[clamp(28px,3.5vw,40px)] font-bold text-[#F4F6FA] mb-6 leading-tight transition-colors hover:text-[#2BFFF1]">
            Start leverage <span className="text-[#2BFFF1]">trading</span> today
          </h2>

          {/* Body */}
          <p className="cta-body cta-element text-[#A7B0B7] text-[clamp(14px,1.2vw,16px)] mb-8 leading-relaxed max-w-[480px] mx-auto">
            Connect your wallet, buy Kaleo, and start leverage trading any Pump.fun memecoin with up to 100x leverage.
          </p>

          {/* Features Badges */}
          <div className="cta-body cta-element flex flex-wrap justify-center gap-3 mb-10">
            <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-sm font-medium transition-transform hover:scale-105">
              100x Leverage
            </span>
            <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-sm font-medium transition-transform hover:scale-105">
              Pump.fun Integration
            </span>
            <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-sm font-medium transition-transform hover:scale-105">
              Fee Contests
            </span>
          </div>

          {/* CTAs */}
          <div className="cta-button cta-element flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleConnect}
              className="neon-button px-10 py-5 text-lg font-semibold flex items-center gap-3 hover:gap-4 transition-all shadow-lg shadow-cyan-500/20"
            >
              {isConnected ? 'Buy Kaleo' : 'Connect Wallet'}
              <ArrowRight className="w-6 h-6" />
            </button>
            <a
              href="#docs"
              className="text-[#A7B0B7] hover:text-[#2BFFF1] text-base font-medium transition-colors flex items-center gap-2 px-6 py-5 hover:gap-3"
            >
              View Contracts
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
