import { useEffect } from 'react';
import { gsap } from 'gsap';
import { FileText, ExternalLink, Shield, Coins, TrendingUp, Users } from 'lucide-react';

const WHITEPAPER_URL = 'https://telegra.ph/Kaleo-AI-Powered-Leverage-Trading-Platform-Whitepaper-02-21';

const highlights = [
  { icon: TrendingUp, label: 'Leverage Mechanism', desc: 'Up to 100x on any Pump.fun memecoin' },
  { icon: Coins, label: 'Tokenomics', desc: '1B total supply, 12-stage presale' },
  { icon: Shield, label: 'Security & Audits', desc: 'Multi-sig treasury, planned audits' },
  { icon: Users, label: 'Governance', desc: 'Community-driven DAO voting rights' },
];

export function WhitePaperSection() {
  useEffect(() => {
    // Quick fade-in on load + stagger for highlights & CTA
    gsap.fromTo('.wp-container',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    gsap.fromTo('.wp-highlight',
      { opacity: 0, y: 20, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.wp-container',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    gsap.fromTo('.wp-cta',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.wp-container',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  return (
    <section className="fade-in-section relative py-16 overflow-hidden bg-gradient-to-b from-black to-gray-900">
      <div className="wp-container max-w-4xl mx-auto px-6">
        {/* Main CTA Card */}
        <div className="glass-card rounded-2xl p-8 md:p-10 text-center relative overflow-hidden border border-cyan-500/20">
          {/* Inner Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(43,255,241,0.12) 0%, transparent 60%)'
            }}
          />

          <div className="relative">
            {/* Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <FileText className="w-7 h-7 text-[#2BFFF1]" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-sm font-medium uppercase tracking-widest mb-4">
              Technical Documentation
            </div>

            {/* Title */}
            <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-[#F4F6FA] mb-4 text-balance">
              Kaleo <span className="text-[#2BFFF1]">Whitepaper</span>
            </h2>

            {/* Description */}
            <p className="text-[#A7B0B7] text-base max-w-xl mx-auto leading-relaxed mb-8">
              Read our comprehensive whitepaper covering the Kaleo platform architecture,
              tokenomics, leverage trading mechanism, security model, and governance framework.
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {highlights.map((item, i) => (
                <div
                  key={i}
                  className="wp-highlight flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:border-[#2BFFF1]/30 hover:scale-[1.02]"
                >
                  <item.icon className="w-5 h-5 text-[#2BFFF1] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#F4F6FA] text-sm font-semibold">{item.label}</p>
                    <p className="text-[#A7B0B7] text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href={WHITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="wp-cta neon-button inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold hover:gap-3.5 transition-all shadow-lg shadow-cyan-500/20"
            >
              Read Full Whitepaper
              <ExternalLink className="w-5 h-5" />
            </a>

            {/* Version note */}
            <p className="text-[#A7B0B7]/50 text-xs mt-6">
              v1.0 &middot; Last updated February 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
