import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X, ExternalLink } from 'lucide-react';
import { gsap } from 'gsap';

const WHITEPAPER_URL = 'https://docs.google.com/document/d/e/2PACX-1vExampleWhitepaperLink/pub';

const navLinks = [
  { label: 'Buy', href: '#buy' },
  { label: 'Features', href: '#features' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Whitepaper', href: WHITEPAPER_URL, external: true },
  { label: 'FAQ', href: '#faq' },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const tl = gsap.timeline();
    tl.fromTo(
      '.mobile-menu-content',
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    )
      .fromTo(
        '.mobile-link',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
        '-=0.2'
      );

    // Return cleanup function (void) to satisfy EffectCallback type
    return () => {
      tl.kill();
    };
  }, [mobileOpen]);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] px-4 sm:px-6 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'bg-[#05060B]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <a href="#" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2BFFF1] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#2BFFF1]/20 transition-transform group-hover:scale-105">
            <span className="text-[#05060B] font-black text-lg tracking-tighter">K</span>
          </div>
          <span className="text-[#F4F6FA] font-bold text-xl tracking-tight group-hover:text-[#2BFFF1] transition-colors">
            Kaleo
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={handleLinkClick}
              className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors font-medium text-sm flex items-center gap-1 hover:gap-2"
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
              {link.external && <ExternalLink className="w-3.5 h-3.5 opacity-60" />}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton
            label="Connect Wallet"
            showBalance={false}
            chainStatus="icon"
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'address',
            }}
          />

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#A7B0B7] hover:text-[#2BFFF1] hover:border-[#2BFFF1]/30 transition-all duration-200"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[99] lg:hidden">
          <div
            className="absolute inset-0 bg-[#05060B]/95 backdrop-blur-xl"
            onClick={() => setMobileOpen(false)}
          />

          <div className="mobile-menu-content relative flex flex-col items-center justify-center h-full gap-8 p-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="mobile-link text-[#F4F6FA] text-3xl font-bold hover:text-[#2BFFF1] transition-colors"
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </a>
            ))}

            <div className="mt-8 flex items-center gap-6">
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-lg transition-colors">
                Twitter
              </a>
              <span className="text-white/10 text-lg">|</span>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-lg transition-colors">
                Discord
              </a>
              <span className="text-white/10 text-lg">|</span>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-lg transition-colors">
                Telegram
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
