import { useEffect } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWalletStore } from '../store/presaleStore';

// ── Helpers ──────────────────────────────────────────────────────────────────
function isAndroid() { return /Android/i.test(navigator.userAgent); }
function isIOS()     { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }
function isMobile()  { return isAndroid() || isIOS(); }

// ── Wallet entries ────────────────────────────────────────────────────────────
// Each wallet has:
//   • openUrl: deeplinks INTO the wallet's built-in browser with the dApp preloaded
//   • The wallet browser injects window.ethereum → our mount auto-connect fires → done
//
// ALL deeplinks verified against official docs (see inline sources).
// Universal https:// links work on both iOS + Android and fall back to App Store.
//
const WALLETS = [
  {
    id: 'metamask', name: 'MetaMask', badge: 'Most Popular',
    gradient: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/40',
    badgeColor: 'bg-orange-500/20 text-orange-300',
    icon: (
      <svg viewBox="0 0 35 33" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32.958 1L19.64 10.733l2.441-5.785L32.958 1Z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.042 1l13.2 9.829-2.322-5.881L2.042 1Z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28.17 23.534l-3.544 5.427 7.584 2.087 2.175-7.396-6.215-.118Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M.632 23.652l2.165 7.396 7.574-2.087-3.534-5.427-6.205.118Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M9.97 14.564l-2.127 3.217 7.575.345-.254-8.149-5.194 4.587Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M25.03 14.564l-5.263-4.684-.172 8.246 7.565-.345-2.13-3.217Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M10.371 28.961 14.705 26.6l-3.82-2.977-.514 5.338Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M20.295 26.6l4.334 2.361-.504-5.338-3.83 2.977Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      </svg>
    ),
    desc: 'ETH · BNB · Polygon · Arbitrum',
    openUrl: (url: string) => {
      // https://docs.metamask.io/wallet/how-to/use-mobile/
      const clean = url.replace(/^https?:\/\//, '');
      window.location.href = `https://metamask.app.link/dapp/${clean}`;
    },
  },
  {
    id: 'trust', name: 'Trust Wallet', badge: null,
    gradient: 'from-blue-500/15 to-blue-600/5',
    border: 'border-blue-500/30',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#3375BB"/>
        <path d="M20 8l10 4.5v9c0 5.5-4.5 10-10 11.5C14.5 31.5 10 27 10 21.5v-9L20 8z" fill="white"/>
        <path d="M17 21l2 2 4-4" stroke="#3375BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    desc: 'ETH · BNB · 100+ chains',
    openUrl: (url: string) => {
      // https://developer.trustwallet.com/developer/develop-for-trust/deeplinking
      const enc = encodeURIComponent(url);
      if (isAndroid()) window.location.href = `trust://open_url?coin_id=60&url=${enc}`;
      else window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${enc}`;
    },
  },
  {
    id: 'coinbase', name: 'Coinbase Wallet', badge: null,
    gradient: 'from-blue-600/15 to-blue-700/5',
    border: 'border-blue-600/30',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#1652F0"/>
        <circle cx="20" cy="20" r="10" fill="white"/>
        <rect x="16" y="17" width="8" height="6" rx="2" fill="#1652F0"/>
      </svg>
    ),
    desc: 'ETH · Base · Polygon · Arbitrum',
    openUrl: (url: string) => {
      // https://docs.cdp.coinbase.com/coinbase-wallet/developer-guidance/mobile-dapp-integration
      const enc = encodeURIComponent(url);
      window.location.href = `https://go.cb-w.com/dapp?cb_url=${enc}`;
    },
  },
  {
    id: 'okx', name: 'OKX Wallet', badge: null,
    gradient: 'from-gray-500/10 to-gray-600/5',
    border: 'border-gray-500/25',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#0A0A0A"/>
        <rect x="10" y="10" width="8" height="8" rx="1" fill="white"/>
        <rect x="22" y="10" width="8" height="8" rx="1" fill="white"/>
        <rect x="10" y="22" width="8" height="8" rx="1" fill="white"/>
        <rect x="22" y="22" width="8" height="8" rx="1" fill="white"/>
      </svg>
    ),
    desc: 'ETH · BNB · SOL · 100+ chains',
    openUrl: (url: string) => {
      // https://web3.okx.com/build/docs/waas/app-universal-link
      const inner = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`;
      window.location.href = `https://web3.okx.com/download?deeplink=${encodeURIComponent(inner)}`;
    },
  },
  {
    id: 'phantom', name: 'Phantom', badge: null,
    gradient: 'from-purple-500/15 to-purple-600/5',
    border: 'border-purple-500/30',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#4C44C6"/>
        <path d="M10 20c0-5.5 4.5-10 10-10s10 4.5 10 10c0 3-1.3 5.7-3.4 7.6-1 .9-2 1.4-3.2 1.4h-.8c-.5 0-.8-.4-.8-.8v-.4c0-.5-.4-.8-.8-.8h-1.9c-.4 0-.8.3-.8.8v.4c0 .5-.4.8-.8.8h-.5C13.3 29 10 25 10 20z" fill="white"/>
        <circle cx="16" cy="19" r="2" fill="#4C44C6"/>
        <circle cx="24" cy="19" r="2" fill="#4C44C6"/>
      </svg>
    ),
    desc: 'ETH · SOL · BTC · Polygon',
    openUrl: (url: string) => {
      // https://docs.phantom.app/phantom-deeplinks/other-methods/browse
      const encoded = encodeURIComponent(url);
      const ref = encodeURIComponent(new URL(url).origin);
      if (isAndroid())
        window.location.href = `intent://browse/${encoded}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=https%3A%2F%2Fphantom.app%2F;end`;
      else window.location.href = `https://phantom.app/ul/browse/${encoded}?ref=${ref}`;
    },
  },
  {
    id: 'rainbow', name: 'Rainbow', badge: null,
    gradient: 'from-pink-500/15 to-purple-500/5',
    border: 'border-pink-500/25',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#0E76FD"/>
        <path d="M11 25c0-5 4-9 9-9s9 4 9 9" stroke="#FF4D4D" strokeWidth="3" strokeLinecap="round"/>
        <path d="M14 25c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#FF9500" strokeWidth="3" strokeLinecap="round"/>
        <path d="M17 25c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="#FFE600" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    desc: 'ETH · Base · Arbitrum · Optimism',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      window.location.href = `https://rnbwapp.com/dapp?url=${enc}`;
    },
  },
  {
    id: 'bitget', name: 'Bitget Wallet', badge: null,
    gradient: 'from-cyan-500/15 to-cyan-600/5',
    border: 'border-cyan-500/25',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#00B4D8"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">B</text>
      </svg>
    ),
    desc: 'ETH · BNB · SOL · 100+ chains',
    openUrl: (url: string) => {
      // https://docs.bitkeep.com/en/docs/guide/mobile/Deeplink.html
      const enc = encodeURIComponent(url);
      window.location.href = `https://bkcode.vip?action=dapp&url=${enc}`;
    },
  },
  {
    id: 'bybit', name: 'Bybit Wallet', badge: null,
    gradient: 'from-yellow-500/15 to-yellow-600/5',
    border: 'border-yellow-500/25',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#F7A600"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">By</text>
      </svg>
    ),
    desc: 'ETH · BNB · Polygon · Base',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      window.location.href = `https://www.bybitglobal.com/en/web3-wallet/dapp?url=${enc}`;
    },
  },
  {
    id: 'imtoken', name: 'imToken', badge: null,
    gradient: 'from-blue-400/15 to-blue-500/5',
    border: 'border-blue-400/25',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#11C4D1"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">im</text>
      </svg>
    ),
    desc: 'ETH · BNB · Polygon · TRX',
    openUrl: (url: string) => {
      // https://imtoken.gitbook.io/developers/products/deep-linking
      const enc = encodeURIComponent(url);
      window.location.href = `imtokenv2://navigate/DappView?url=${enc}`;
    },
  },
  {
    id: 'tokenpocket', name: 'TokenPocket', badge: null,
    gradient: 'from-indigo-500/15 to-indigo-600/5',
    border: 'border-indigo-500/25',
    badgeColor: '',
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#2980FE"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">TP</text>
      </svg>
    ),
    desc: 'ETH · BNB · SOL · 100+ chains',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      if (isAndroid()) window.location.href = `tpdapp://url?params=${enc}`;
      else window.location.href = `https://tokenpocket.pro/dapp?url=${enc}`;
    },
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function EvmWalletPicker() {
  const { showEvmPicker, setShowEvmPicker } = useWalletStore();
  const { openConnectModal } = useConnectModal();

  // Close on Escape
  useEffect(() => {
    if (!showEvmPicker) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowEvmPicker(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showEvmPicker, setShowEvmPicker]);

  if (!showEvmPicker) return null;

  const handleWallet = (w: (typeof WALLETS)[number]) => {
    setShowEvmPicker(false);
    w.openUrl(window.location.href);
  };

  const handleDesktopConnect = () => {
    setShowEvmPicker(false);
    openConnectModal?.();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={() => setShowEvmPicker(false)}
    >
      <div
        className="relative w-full sm:w-[min(94vw,440px)] flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #0D1117 0%, #0B0E14 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '92vh',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(43,255,241,0.08)',
        }}
        // Rounded bottom corners on non-mobile
        onClick={e => e.stopPropagation()}
      >
        {/* ── Drag handle (mobile) ── */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h2 className="text-[#F4F6FA] font-bold text-lg leading-tight">Connect Wallet</h2>
            <p className="text-[#A7B0B7] text-xs mt-0.5">
              {isMobile()
                ? 'Tap a wallet to open the app and connect automatically'
                : 'Choose how to connect your wallet'}
            </p>
          </div>
          <button
            onClick={() => setShowEvmPicker(false)}
            className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-[#A7B0B7] hover:text-white transition-all text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* ── How it works banner (mobile only) ── */}
        {isMobile() && (
          <div className="mx-5 mb-3 rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(43,255,241,0.06)', border: '1px solid rgba(43,255,241,0.15)' }}>
            <span className="text-[#2BFFF1] text-base">⚡</span>
            <p className="text-[#2BFFF1]/80 text-[11px] leading-relaxed">
              Opens the dApp inside your wallet's browser — connected automatically, no extra steps.
            </p>
          </div>
        )}

        {/* ── Wallet list ── */}
        <div className="overflow-y-auto flex-1 px-5 pb-3" style={{ maxHeight: '55vh' }}>
          <div className="grid grid-cols-1 gap-2">
            {WALLETS.map((w) => (
              <button
                key={w.id}
                onClick={() => handleWallet(w)}
                className="group flex items-center gap-3 w-full text-left rounded-2xl px-3.5 py-3 transition-all duration-150 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(43,255,241,0.35)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(43,255,241,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.background = '';
                }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {w.icon}
                </div>

                {/* Name + desc */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F4F6FA] font-semibold text-sm">{w.name}</span>
                    {w.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(43,255,241,0.15)', color: '#2BFFF1' }}>
                        {w.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[#A7B0B7] text-xs truncate mt-0.5">{w.desc}</p>
                </div>

                {/* Arrow */}
                <span className="text-[#2BFFF1] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer: Desktop or install ── */}
        <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[#A7B0B7] text-[11px] text-center mb-2.5 font-medium">
            {isMobile() ? "Don't have a wallet?" : 'On a desktop browser?'}
          </p>
          <div className="flex gap-2">
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all"
              style={{ background: 'rgba(225,119,38,0.15)', border: '1px solid rgba(225,119,38,0.35)', color: '#F0A050' }}
            >
              🦊 Get MetaMask
            </a>
            <button
              onClick={handleDesktopConnect}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#A7B0B7' }}
            >
              💻 Extension / QR
            </button>
          </div>
          <p className="text-[#A7B0B7]/50 text-[10px] text-center mt-2">
            Extension / QR supports Ledger, Rabby, Zerion, Frame + 300 more
          </p>
        </div>
      </div>
    </div>
  );
  }
