import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/presaleStore';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Menu, X, ExternalLink } from 'lucide-react';
import { gsap } from 'gsap';
import { Link } from 'react-scroll'; // for smooth internal scrolling

const WHITEPAPER_URL = 'https://docs.google.com/document/d/e/2PACX-1vExampleWhitepaperLink/pub';

const navLinks = [
  { label: 'Buy', href: 'buy', isExternal: false },
  { label: 'Features', href: 'features', isExternal: false },
  { label: 'Roadmap', href: 'roadmap', isExternal: false },
  { label: 'Whitepaper', href: WHITEPAPER_URL, isExternal: true },
  { label: 'FAQ', href: 'faq', isExternal: false },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { solAddress, btcAddress, solWalletName, btcWalletName, disconnectSol, disconnectBtc } = useWalletStore();
  const { address: evmAddress, isConnected: evmConnected, connector: evmConnector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect: evmDisconnect } = useDisconnect();

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

    return () => {
      tl.kill();
    };
  }, [mobileOpen]);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const handleConnectWallet = async () => {
    const eth = (window as any).ethereum;
    if (eth && !evmConnected) {
      // Inside a wallet browser — connect directly (no modal needed)
      try {
        const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
        if (accounts[0]) {
          // Wagmi will pick this up automatically via the injected connector
          // Force wagmi sync by also calling openConnectModal as fallback
        }
      } catch {}
    } else {
      // Desktop / external browser — open RainbowKit modal (WalletConnect + all wallets)
      openConnectModal?.();
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] px-4 sm:px-6 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'bg-[#05060B]/92 backdrop-blur-xl border-b border-white/[0.08] shadow-xl shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        <a href="#" className="flex items-center gap-2.5 shrink-0 group" onClick={handleLinkClick}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2BFFF1] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#2BFFF1]/20 transition-transform group-hover:scale-105">
            <span className="text-[#05060B] font-black text-lg tracking-tighter">K</span>
          </div>
          <span className="text-[#F4F6FA] font-bold text-xl tracking-tight group-hover:text-[#2BFFF1] transition-colors">
            Kaleo
          </span>
        </a>

        {/* Desktop Nav – smooth scroll */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            link.isExternal ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors font-medium text-sm flex items-center gap-1 hover:gap-2"
              >
                {link.label}
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                smooth={true}
                duration={800}
                offset={-80} // account for fixed nav height
                spy={true}
                activeClass="text-[#2BFFF1] font-semibold"
                className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors font-medium text-sm cursor-pointer flex items-center gap-1 hover:gap-2"
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* SOL connected pill */}
          {solAddress && !evmConnected && (
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[#F4F6FA] text-xs font-medium hidden sm:block">
                {solAddress.slice(0,4)}...{solAddress.slice(-4)}
              </span>
              <span className="text-purple-300 text-xs font-semibold">{solWalletName}</span>
              <button onClick={disconnectSol}
                className="text-[#A7B0B7] hover:text-red-400 text-xs ml-1 transition-colors leading-none"
                title="Disconnect">
                ×
              </button>
            </div>
          )}

          {/* BTC connected pill */}
          {btcAddress && !evmConnected && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-orange-400 text-xs font-semibold">₿ {btcWalletName}</span>
              <button onClick={disconnectBtc}
                className="text-[#A7B0B7] hover:text-red-400 text-xs ml-1 transition-colors leading-none"
                title="Disconnect">
                ×
              </button>
            </div>
          )}

          {/* EVM wallet via RainbowKit — always shown, handles ETH/BNB */}
          {evmConnected && evmAddress ? (
            /* Connected: show address + wallet name pill with disconnect */
            <div className="flex items-center gap-2 bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[#F4F6FA] text-xs font-medium hidden sm:block">
                {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
              </span>
              {evmConnector?.name && (
                <span className="text-[#2BFFF1] text-xs font-semibold hidden sm:block">{evmConnector.name}</span>
              )}
              <button
                onClick={() => evmDisconnect()}
                className="text-[#A7B0B7] hover:text-red-400 text-xs ml-1 transition-colors leading-none"
                title="Disconnect">
                ×
              </button>
            </div>
          ) : (
            /* Not connected: open RainbowKit modal */
            <button
              onClick={handleConnectWallet}
              className="neon-button px-5 py-2.5 text-sm font-semibold rounded-xl">
              Connect Wallet
            </button>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-11 h-11 rounded-xl bg-white/6 border border-white/12 flex items-center justify-center text-[#A7B0B7] hover:text-[#2BFFF1] hover:border-[#2BFFF1]/40 transition-all duration-200 shadow-sm"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99] lg:hidden">
          <div
            className="absolute inset-0 bg-[#05060B]/96 backdrop-blur-2xl"
            onClick={() => setMobileOpen(false)}
          />

          <div className="mobile-menu-content relative flex flex-col items-center justify-center h-full gap-10 p-8">
            {navLinks.map((link) => (
              link.isExternal ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="mobile-link text-[#F4F6FA] text-4xl font-bold hover:text-[#2BFFF1] transition-colors flex items-center gap-3"
                >
                  {link.label}
                  <ExternalLink className="w-6 h-6 opacity-70" />
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  smooth={true}
                  duration={800}
                  offset={-80}
                  onClick={handleLinkClick}
                  className="mobile-link text-[#F4F6FA] text-4xl font-bold hover:text-[#2BFFF1] transition-colors cursor-pointer"
                >
                  {link.label}
                </Link>
              )
            ))}

            <div className="mt-12 flex items-center gap-8 text-lg">
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors">
                Twitter
              </a>
              <span className="text-white/15">|</span>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors">
                Discord
              </a>
              <span className="text-white/15">|</span>
              <a href="#" className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors">
                Telegram
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
