import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X } from 'lucide-react';

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

  // Close mobile menu on link click
  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] px-4 sm:px-6 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'bg-[#05060B]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2BFFF1] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#2BFFF1]/20">
            <span className="text-[#05060B] font-black text-lg tracking-tighter">K</span>
          </div>
          <span className="text-[#F4F6FA] font-bold text-xl tracking-tight">Kaleo</span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors font-medium text-sm"
              {...('external' in link && link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side: Connect + Mobile toggle */}
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

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#A7B0B7] hover:text-[#2BFFF1] hover:border-[#2BFFF1]/30 transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#05060B]/95 backdrop-blur-xl"
            onClick={() => setMobileOpen(false)}
          />

          {/* Menu content */}
          <div className="relative flex flex-col items-center justify-center h-full gap-6 p-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="text-[#F4F6FA] text-2xl font-bold hover:text-[#2BFFF1] transition-colors"
                {...('external' in link && link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </a>
            ))}

            {/* Social links in mobile menu */}
            <div className="mt-6 flex items-center gap-4">
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-sm transition-colors">
                Twitter
              </a>
              <span className="text-white/10">|</span>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-sm transition-colors">
                Discord
              </a>
              <span className="text-white/10">|</span>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] text-sm transition-colors">
                Telegram
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
