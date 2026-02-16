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
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

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
            start: 'top 70%',
            toggleActions: 'play none none none',
            once: true,
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
      id="staking"
      className="fade-in-section min-h-screen flex items-center justify-center relative overflow-hidden py-20"
    >
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/final_city_bg_06.jpg"
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/90" />
      </div>

      {/* CTA Card */}
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

        <div className="relative text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-[#2BFFF1]" />
            </div>
          </div>

          <h2 className="cta-element text-[clamp(28px,3.5vw,40px)] font-bold text-[#F4F6FA] mb-6 leading-tight text-balance">
            Start leverage <span className="text-[#2BFFF1]">trading</span> today
          </h2>

          <p className="cta-element text-[#A7B0B7] text-[clamp(14px,1.2vw,16px)] mb-8 leading-relaxed max-w-[480px] mx-auto">
            Connect your wallet, buy Kaleo, and start leverage trading any Pump.fun memecoin with up to 100x leverage.
          </p>

          <div className="cta-element flex flex-wrap justify-center gap-3 mb-10">
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

          <div className="cta-element flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={isConnected ? undefined : handleConnect}
              className="neon-button px-10 py-5 text-lg font-semibold flex items-center gap-3 hover:gap-4 transition-all"
            >
              {isConnected ? (
                <a href="#buy" className="flex items-center gap-3">
                  Buy Kaleo
                  <ArrowRight className="w-6 h-6" />
                </a>
              ) : (
                <>
                  Connect Wallet
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
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
