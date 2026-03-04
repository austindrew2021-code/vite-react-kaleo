import { useEffect, useRef, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useWalletStore } from '../store/presaleStore';

// ── Platform helpers ──────────────────────────────────────────────────────────
const _ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isAndroid = () => /Android/i.test(_ua);
const isIOS     = () => /iPhone|iPad|iPod/i.test(_ua);
const isMobile  = () => isAndroid() || isIOS();

// Detect if we are already INSIDE a wallet's built-in browser (window.ethereum injected).
// Returns the wallet name or null.
function detectWalletBrowser(): string | null {
  const eth = (window as any).ethereum;
  if (!eth) return null;
  if (eth.isOKExWallet || eth.isOkxWallet)  return 'OKX Wallet';
  if (eth.isBitKeep   || eth.isBitget)       return 'Bitget Wallet';
  if (eth.isBybit)                            return 'Bybit Wallet';
  if (eth.isSafePal)                          return 'SafePal';
  if (eth.isBinance)                          return 'Binance Web3';
  if (eth.isGate      || eth.isGateWallet)    return 'Gate Wallet';
  if (eth.isZerion)                           return 'Zerion';
  if (eth.isRabby)                            return 'Rabby';
  if (eth.isOneInch)                          return '1inch Wallet';
  if (eth.isTokenPocket)                      return 'TokenPocket';
  if (eth.isImToken)                          return 'imToken';
  if (eth.isRainbow)                          return 'Rainbow';
  if (eth.isBraveWallet)                      return 'Brave Wallet';
  if (eth.isCoinbaseWallet)                   return 'Coinbase Wallet';
  if (eth.isTrust || eth.isTrustWallet)       return 'Trust Wallet';
  if (eth.isPhantom)                          return 'Phantom';
  if (eth.isMetaMask)                         return 'MetaMask';
  return 'Wallet';
}

// ── Wallet definitions ────────────────────────────────────────────────────────
// Two types:
//   isQR   — opens the RainbowKit/WalletConnect modal (QR scan or desktop extension)
//   openUrl — deeplinks INTO the wallet app's built-in browser.
//             The wallet browser injects window.ethereum → mount auto-connect → done.
//
// WalletConnect is in the MAIN list because mobile users often scan from their phone to
// connect a desktop browser tab. NOT hidden in a footer.
//
// If the user is already inside a wallet browser (detectWalletBrowser() != null), we
// connect directly via injected() regardless of which row they tap — no deeplink needed.
//
// DEEPLINK SOURCES (all official docs):
//  MetaMask   https://docs.metamask.io/wallet/how-to/use-mobile/
//  Trust      https://developer.trustwallet.com/developer/develop-for-trust/deeplinking
//  Coinbase   https://docs.cdp.coinbase.com/coinbase-wallet/developer-guidance/mobile-dapp-integration
//  OKX        https://web3.okx.com/build/docs/waas/app-universal-link
//  Phantom    https://docs.phantom.app/phantom-deeplinks/other-methods/browse
//  Rainbow    https://www.rainbow.me developer docs
//  Bitget     https://docs.bitkeep.com/en/docs/guide/mobile/Deeplink.html
//  imToken    https://imtoken.gitbook.io/developers/products/deep-linking
//  Zerion     https://zerion.io/blog/zerion-link
//  TokenPocket https://docs.tokenpocket.pro/developer/deeplinking

interface WalletEntry {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  accentColor: string;      // for hover ring + badge bg
  isQR?: true;
  openUrl?: (url: string) => void;
  icon: React.ReactNode;
}

const WALLETS: WalletEntry[] = [
  // ── WalletConnect QR — universal, works on all platforms ─────────────────
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    desc: '300+ wallets · Scan QR · Ledger · Rabby · Zerion + desktop extensions',
    badge: 'All wallets',
    accentColor: '#3B99FC',
    isQR: true,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#3B99FC"/>
        <path d="M13.3 17.2c3.7-3.6 9.7-3.6 13.4 0l.4.4c.2.2.2.5 0 .7l-1.5 1.5c-.1.1-.3.1-.4 0l-.6-.6c-2.6-2.5-6.7-2.5-9.3 0l-.7.6c-.1.1-.3.1-.4 0l-1.5-1.5c-.2-.2-.2-.5 0-.7l.6-.4zm16.5 3.1-1.3 1.3c-.2.2-.4.2-.6 0l-2.7-2.7c-.7-.7-1.9-.7-2.6 0l-2.7 2.7c-.2.2-.4.2-.6 0l-2.7-2.7c-.7-.7-1.9-.7-2.6 0l-2.7 2.7c-.2.2-.4.2-.6 0L9.2 20.3c-.2-.2-.2-.4 0-.6l1.3-1.3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },

  // ── MetaMask ──────────────────────────────────────────────────────────────
  {
    id: 'metamask',
    name: 'MetaMask',
    desc: 'ETH · BNB · Polygon · Arbitrum',
    badge: 'Most popular',
    accentColor: '#E27625',
    openUrl: (url) => {
      const clean = url.replace(/^https?:\/\//, '');
      window.location.href = `https://metamask.app.link/dapp/${clean}`;
    },
    icon: (
      <svg viewBox="0 0 35 33" className="w-7 h-7" fill="none">
        <path d="M32.958 1L19.64 10.733l2.441-5.785L32.958 1Z" fill="#E17726" stroke="#E17726" strokeWidth=".25"/>
        <path d="M2.042 1l13.2 9.829-2.322-5.881L2.042 1Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M28.17 23.534l-3.544 5.427 7.584 2.087 2.175-7.396-6.215-.118Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M.632 23.652l2.165 7.396 7.574-2.087-3.534-5.427-6.205.118Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M9.97 14.564l-2.127 3.217 7.575.345-.254-8.149-5.194 4.587Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M25.03 14.564l-5.263-4.684-.172 8.246 7.565-.345-2.13-3.217Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M10.371 28.961 14.705 26.6l-3.82-2.977-.514 5.338Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
        <path d="M20.295 26.6l4.334 2.361-.504-5.338-3.83 2.977Z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      </svg>
    ),
  },

  // ── Trust Wallet ──────────────────────────────────────────────────────────
  {
    id: 'trust',
    name: 'Trust Wallet',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accentColor: '#3375BB',
    openUrl: (url) => {
      const enc = encodeURIComponent(url);
      // Android: native scheme. iOS: universal link (browser tab removed from iOS app)
      if (isAndroid()) window.location.href = `trust://open_url?coin_id=60&url=${enc}`;
      else             window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${enc}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#3375BB"/>
        <path d="M20 8l10 4.5v9c0 5.5-4.5 10-10 11.5C14.5 31.5 10 27 10 21.5v-9L20 8z" fill="white"/>
        <path d="M17 21l2 2 4-4" stroke="#3375BB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },

  // ── Coinbase Wallet ───────────────────────────────────────────────────────
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    desc: 'ETH · Base · Polygon · Arbitrum',
    accentColor: '#1652F0',
    openUrl: (url) => {
      // go.cb-w.com is the correct domain (go.cb-wallet.com is wrong)
      window.location.href = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#1652F0"/>
        <circle cx="20" cy="20" r="10.5" fill="white"/>
        <rect x="15.5" y="17" width="9" height="6" rx="2.2" fill="#1652F0"/>
      </svg>
    ),
  },

  // ── OKX Wallet ────────────────────────────────────────────────────────────
  {
    id: 'okx',
    name: 'OKX Wallet',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accentColor: '#888',
    openUrl: (url) => {
      const inner = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`;
      window.location.href = `https://web3.okx.com/download?deeplink=${encodeURIComponent(inner)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#111"/>
        <rect x="10" y="10" width="8" height="8" rx="1.5" fill="white"/>
        <rect x="22" y="10" width="8" height="8" rx="1.5" fill="white"/>
        <rect x="10" y="22" width="8" height="8" rx="1.5" fill="white"/>
        <rect x="22" y="22" width="8" height="8" rx="1.5" fill="white"/>
      </svg>
    ),
  },

  // ── Phantom ───────────────────────────────────────────────────────────────
  {
    id: 'phantom',
    name: 'Phantom',
    desc: 'ETH · SOL · BTC · Polygon',
    accentColor: '#9B8CFF',
    openUrl: (url) => {
      const encoded = encodeURIComponent(url);
      const ref     = encodeURIComponent(new URL(url).origin);
      if (isAndroid())
        window.location.href = `intent://browse/${encoded}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=https%3A%2F%2Fphantom.app%2F;end`;
      else
        window.location.href = `https://phantom.app/ul/browse/${encoded}?ref=${ref}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#4C44C6"/>
        <path d="M10 20c0-5.5 4.5-10 10-10s10 4.5 10 10c0 3-1.3 5.7-3.4 7.6-1 .9-2 1.4-3.2 1.4h-.8c-.5 0-.8-.4-.8-.8v-.4c0-.5-.4-.8-.8-.8h-1.9c-.4 0-.8.3-.8.8v.4c0 .5-.4.8-.8.8h-.5C13.3 29 10 25 10 20z" fill="white"/>
        <circle cx="16" cy="19" r="2" fill="#4C44C6"/>
        <circle cx="24" cy="19" r="2" fill="#4C44C6"/>
      </svg>
    ),
  },

  // ── Rainbow ───────────────────────────────────────────────────────────────
  {
    id: 'rainbow',
    name: 'Rainbow',
    desc: 'ETH · Base · Arbitrum · Optimism',
    accentColor: '#FF6B6B',
    openUrl: (url) => {
      window.location.href = `https://rnbwapp.com/dapp?url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#174299"/>
        <path d="M10 27c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#FF4D4D" strokeWidth="3" strokeLinecap="round"/>
        <path d="M13 27c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#FF9500" strokeWidth="3" strokeLinecap="round"/>
        <path d="M16 27c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },

  // ── Bitget Wallet ─────────────────────────────────────────────────────────
  {
    id: 'bitget',
    name: 'Bitget Wallet',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accentColor: '#00C6D3',
    openUrl: (url) => {
      window.location.href = `https://bkcode.vip?action=dapp&url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#1AA0C7"/>
        <path d="M14 20h12M20 14v12" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="6.5" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },

  // ── Bybit Wallet ──────────────────────────────────────────────────────────
  {
    id: 'bybit',
    name: 'Bybit Wallet',
    desc: 'ETH · BNB · Polygon · Base',
    accentColor: '#F7A600',
    openUrl: (url) => {
      window.location.href = `https://www.bybitglobal.com/en/web3-wallet/dapp?url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#F7A600"/>
        <path d="M12 14h8c2.2 0 4 1.8 4 4s-1.8 4-4 4H12V14z" fill="white"/>
        <path d="M12 22h9c2.2 0 4 1.8 4 4H12V22z" fill="white" opacity=".75"/>
      </svg>
    ),
  },

  // ── Zerion ────────────────────────────────────────────────────────────────
  {
    id: 'zerion',
    name: 'Zerion',
    desc: 'ETH · Base · All EVM chains · Portfolio',
    accentColor: '#2962EF',
    openUrl: (url) => {
      window.location.href = `https://link.zerion.io/dapp?url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#2962EF"/>
        <path d="M10 12h20L16 28h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },

  // ── imToken ───────────────────────────────────────────────────────────────
  {
    id: 'imtoken',
    name: 'imToken',
    desc: 'ETH · BNB · Polygon · TRX',
    accentColor: '#11C4D1',
    openUrl: (url) => {
      window.location.href = `imtokenv2://navigate/DappView?url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#11C4D1"/>
        <rect x="11" y="15" width="18" height="4" rx="2" fill="white"/>
        <rect x="14" y="22" width="12" height="3.5" rx="1.75" fill="white" opacity=".75"/>
      </svg>
    ),
  },

  // ── TokenPocket ───────────────────────────────────────────────────────────
  {
    id: 'tokenpocket',
    name: 'TokenPocket',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accentColor: '#2980FE',
    openUrl: (url) => {
      const enc = encodeURIComponent(url);
      if (isAndroid()) window.location.href = `tpdapp://url?params=${enc}`;
      else             window.location.href = `https://tokenpocket.pro/dapp?url=${enc}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#2980FE"/>
        <rect x="11" y="11" width="18" height="4" rx="2" fill="white"/>
        <rect x="11" y="18" width="18" height="4" rx="2" fill="white" opacity=".8"/>
        <rect x="11" y="25" width="11" height="4" rx="2" fill="white" opacity=".6"/>
      </svg>
    ),
  },

  // ── SafePal ───────────────────────────────────────────────────────────────
  {
    id: 'safepal',
    name: 'SafePal',
    desc: 'ETH · BNB · SOL · Hardware wallet',
    accentColor: '#335BFF',
    openUrl: (url) => {
      window.location.href = `safepal://dapp?url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#1A2ECC"/>
        <path d="M20 10l8 3.5v7c0 4.2-3.4 8-8 9.4-4.6-1.4-8-5.2-8-9.4v-7L20 10z" stroke="white" strokeWidth="1.5" fill="none"/>
        <path d="M17 20.5l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },

  // ── Exodus ────────────────────────────────────────────────────────────────
  {
    id: 'exodus',
    name: 'Exodus',
    desc: 'ETH · BNB · SOL · BTC · 300+ assets',
    accentColor: '#7B5EA7',
    openUrl: (url) => {
      window.location.href = `exodus://open?url=${encodeURIComponent(url)}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#0B0B0F"/>
        <defs>
          <linearGradient id="exG" x1="9" y1="8" x2="31" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9B59B6"/>
            <stop offset="100%" stopColor="#3B82F6"/>
          </linearGradient>
        </defs>
        <path d="M20 9L31 28H9L20 9z" fill="url(#exG)"/>
      </svg>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function EvmWalletPicker() {
  const { showEvmPicker, setShowEvmPicker } = useWalletStore();
  const { openConnectModal } = useConnectModal();
  const { connectAsync } = useConnect();
  const [search, setSearch]       = useState('');
  const [hoverId, setHoverId]     = useState<string | null>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const mobile                    = isMobile();

  // Close on Escape
  useEffect(() => {
    if (!showEvmPicker) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowEvmPicker(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [showEvmPicker, setShowEvmPicker]);

  // Auto-focus search on desktop
  useEffect(() => {
    if (showEvmPicker && !mobile) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
    if (!showEvmPicker) setSearch('');
  }, [showEvmPicker, mobile]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = showEvmPicker ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showEvmPicker]);

  if (!showEvmPicker) return null;

  const filtered = search
    ? WALLETS.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.desc.toLowerCase().includes(search.toLowerCase())
      )
    : WALLETS;

  const handleWallet = (w: WalletEntry) => {
    if (w.isQR) {
      setShowEvmPicker(false);
      openConnectModal?.();
      return;
    }

    // If already inside a wallet browser, connect directly — skip the deeplink
    const wb = detectWalletBrowser();
    if (wb) {
      setShowEvmPicker(false);
      connectAsync({ connector: injected() }).catch(() => {});
      return;
    }

    setShowEvmPicker(false);
    w.openUrl?.(window.location.href);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={() => setShowEvmPicker(false)}
    >
      <div
        className="relative w-full sm:w-[min(96vw,460px)] flex flex-col"
        style={{
          background: 'linear-gradient(160deg,#0D1118 0%,#090C13 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: mobile ? '22px 22px 0 0' : '22px',
          maxHeight: mobile ? '93vh' : '88vh',
          boxShadow: '0 -30px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(43,255,241,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        {mobile && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div>
            <h2 className="text-[#F4F6FA] font-bold text-[17px] leading-tight tracking-tight">
              Connect Wallet
            </h2>
            <p className="text-[#6B7280] text-xs mt-1 leading-relaxed">
              {mobile
                ? "Tap a wallet — it opens with this page loaded, already connected"
                : "Choose your wallet to buy KLEO"}
            </p>
          </div>
          <button
            onClick={() => setShowEvmPicker(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F4F6FA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Mobile tip */}
        {mobile && (
          <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-2 flex-shrink-0"
            style={{ background: 'rgba(43,255,241,0.06)', border: '1px solid rgba(43,255,241,0.15)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#2BFFF1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(43,255,241,0.8)' }}>
              The app opens with this page pre-loaded — you're connected automatically.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-2.5 flex-shrink-0">
          <div className="relative flex items-center">
            <svg className="absolute left-3 w-4 h-4 pointer-events-none" style={{ color: '#4B5563' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search wallets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: '#E5E7EB',
              }}
            />
          </div>
        </div>

        {/* Wallet list */}
        <div className="overflow-y-auto flex-1 px-4 pb-3" style={{ minHeight: 0 }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="text-3xl">🔍</span>
              <p className="text-sm" style={{ color: '#6B7280' }}>No results for "{search}"</p>
              <button onClick={() => setSearch('')} className="text-xs hover:underline" style={{ color: '#2BFFF1' }}>
                Clear search
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(w => {
                const hovered = hoverId === w.id;
                const isQR = !!w.isQR;
                const accent = w.accentColor;
                return (
                  <button
                    key={w.id}
                    onClick={() => handleWallet(w)}
                    onMouseEnter={() => setHoverId(w.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onTouchStart={() => setHoverId(w.id)}
                    onTouchEnd={() => setHoverId(null)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-100 active:scale-[0.98]"
                    style={{
                      background: hovered ? `${accent}12` : 'rgba(255,255,255,0.025)',
                      border: hovered
                        ? `1px solid ${accent}50`
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {w.icon}
                    </div>

                    {/* Name + desc */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[#E5E7EB] font-semibold text-sm leading-tight">{w.name}</span>
                        {w.badge && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                            style={{
                              background: `${accent}22`,
                              color: isQR ? '#60A5FA' : '#2BFFF1',
                              border: `1px solid ${accent}30`,
                            }}
                          >
                            {w.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#6B7280' }}>{w.desc}</p>
                    </div>

                    {/* Chevron / QR label */}
                    <div className="flex-shrink-0 transition-all duration-100"
                      style={{ color: hovered ? accent : 'rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: 700 }}>
                      {isQR ? 'QR →' : '→'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 pb-4 pt-3 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[11px]" style={{ color: '#4B5563' }}>
            {mobile ? "Don't have a wallet?" : "New to Web3?"}
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
            style={{
              background: 'rgba(226,118,37,0.13)',
              border: '1px solid rgba(226,118,37,0.35)',
              color: '#F59E0B',
            }}
          >
            🦊 Get MetaMask
          </a>
        </div>
      </div>
    </div>
  );
}
