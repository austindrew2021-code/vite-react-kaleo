import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, ExternalLink, Shield, Coins, TrendingUp, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const WHITEPAPER_URL = 'https://docs.google.com/document/d/e/2PACX-1vExampleWhitepaperLink/pub';

const highlights = [
  { icon: TrendingUp, label: 'Leverage Mechanism', desc: 'Up to 100x on any Pump.fun memecoin' },
  { icon: Coins, label: 'Tokenomics', desc: '1B total supply, 12-stage presale' },
  { icon: Shield, label: 'Security & Audits', desc: 'Multi-sig treasury, planned audits' },
  { icon: Users, label: 'Governance', desc: 'Community-driven DAO voting rights' },
];

export function WhitePaperSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.wp-card',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none', once: true }
        }
      );

      gsap.fromTo('.wp-highlight',
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none', once: true }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="whitepaper"
      className="fade-in-section relative py-16 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05060B] via-[#080B12] to-[#05060B]" />

      <div className="relative max-w-3xl mx-auto px-6">
        {/* Main CTA Card */}
        <div className="wp-card glass-card rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(43,255,241,0.08) 0%, transparent 60%)'
            }}
          />

          <div className="relative">
            {/* Icon */}
            <div className="flex items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#2BFFF1]" />
              </div>
            </div>

            {/* Badge */}
            <div className="flex items-center justify-center mb-4">
              <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium uppercase tracking-widest">
                Technical Documentation
              </span>
            </div>

            {/* Title */}
            <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-[#F4F6FA] mb-3 text-balance">
              Kaleo <span className="text-[#2BFFF1]">Whitepaper</span>
            </h2>

            {/* Description */}
            <p className="text-[#A7B0B7] text-base max-w-xl mx-auto leading-relaxed mb-8">
              Read our comprehensive whitepaper covering the Kaleo platform architecture,
              tokenomics, leverage trading mechanism, security model, and governance framework.
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8 max-w-lg mx-auto">
              {highlights.map((item, i) => (
                <div
                  key={i}
                  className="wp-highlight flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left"
                >
                  <item.icon className="w-4 h-4 text-[#2BFFF1] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#F4F6FA] text-xs font-semibold">{item.label}</p>
                    <p className="text-[#A7B0B7] text-[11px] leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href={WHITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-button inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold hover:gap-3.5 transition-all"
            >
              Read Full Whitepaper
              <ExternalLink className="w-5 h-5" />
            </a>

            {/* Version note */}
            <p className="text-[#A7B0B7]/50 text-xs mt-4">
              v1.0 &middot; Last updated February 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
