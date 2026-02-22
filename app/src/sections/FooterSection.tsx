import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, ExternalLink, Mail, Twitter, MessageCircle, Send } from 'lucide-react';

const productLinks = [
  { label: 'Buy KLEO', href: '#buy' },
  { label: 'Features', href: '#features' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Staking', href: '#staking' },
];

const resourceLinks = [
  { label: 'Whitepaper', href: 'https://telegra.ph/Kaleo-AI-Powered-Leverage-Trading-Platform-Whitepaper-02-21' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Tokenomics', href: 'https://telegra.ph/Kaleo-AI-Powered-Leverage-Trading-Platform-Whitepaper-02-21' },
  { label: 'Smart Contracts', href: '#', external: true },
];

const communityLinks = [
  { label: 'Twitter / X', href: '#', icon: Twitter },
  { label: 'Discord', href: '#', icon: MessageCircle },
  { label: 'Telegram', href: '#', icon: Send },
];

export function FooterSection() {
  useEffect(() => {
    // Quick fade-in on load + stagger for content blocks
    gsap.fromTo('.footer-content',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    gsap.fromTo('.footer-block',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.footer-content',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    gsap.fromTo('.footer-social',
      { scale: 0.9, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.footer-content',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  return (
    <footer className="fade-in-section relative bg-[#05060B] overflow-hidden">
      {/* Top gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2BFFF1]/20 to-transparent" />

      <div className="footer-content max-w-6xl mx-auto px-6 pt-16 pb-12">
        {/* CTA Banner */}
        <div className="glass-card rounded-2xl p-8 md:p-12 mb-16 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(43,255,241,0.08) 0%, transparent 60%)'
            }}
          />
          <div className="relative">
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-[#F4F6FA] mb-4 text-balance">
              Ready to <span className="text-[#2BFFF1]">leverage trade</span> memecoins?
            </h2>
            <p className="text-[#A7B0B7] mb-6 max-w-lg mx-auto text-base md:text-lg leading-relaxed">
              Join thousands of traders on the first leverage platform built for Pump.fun memecoins.
              Up to 100x leverage with weekly contest prizes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#buy"
                className="neon-button px-6 py-3 text-sm md:text-base font-semibold flex items-center gap-2 hover:gap-3 transition-all"
              >
                Buy Kaleo
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a
                href="https://telegra.ph/Kaleo-AI-Powered-Leverage-Trading-Platform-Whitepaper-02-21"
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[#A7B0B7] text-sm md:text-base font-medium hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors flex items-center gap-2"
              >
                Read Whitepaper
                <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 footer-block">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2BFFF1] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#2BFFF1]/20">
                <span className="text-[#05060B] font-black text-xl tracking-tighter">K</span>
              </div>
              <span className="text-[#F4F6FA] font-bold text-xl">Kaleo</span>
            </div>
            <p className="text-[#A7B0B7] text-sm leading-relaxed mb-6 max-w-[280px]">
              The first leverage trading platform for Pump.fun memecoins. Trade with up to 100x leverage.
            </p>
            <a
              href="mailto:hello@kaleo.xyz"
              className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              hello@kaleo.xyz
            </a>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-[#F4F6FA] font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm hover:pl-1"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h4 className="text-[#F4F6FA] font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm flex items-center gap-1 hover:gap-2"
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {link.label}
                    {link.external && <ExternalLink className="w-3 h-3 opacity-70" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-[#F4F6FA] font-semibold text-sm mb-4">Community</h4>
            <ul className="space-y-3">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm flex items-center gap-2 hover:gap-3"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Social icons */}
            <div className="flex gap-4 mt-6">
              {communityLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="footer-social w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#A7B0B7] hover:text-[#2BFFF1] hover:border-[#2BFFF1]/30 hover:scale-110 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#A7B0B7]">
            <p>© 2026 Kaleo. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#2BFFF1] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#2BFFF1] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#2BFFF1] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
