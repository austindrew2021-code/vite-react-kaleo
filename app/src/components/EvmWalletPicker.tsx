import { useEffect, useRef, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useWalletStore } from '../store/presaleStore';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM DETECTION — four independent signals, any one triggers mobile mode
//
//  1. UA string   — covers all real phones/tablets
//  2. maxTouchPoints > 1 — catches touch-primary devices with non-standard UA
//  3. pointer: coarse — CSS media query, most reliable on modern browsers
//  4. screen width < 768 — catch-all for narrow viewports
//
// We are deliberately over-conservative: one signal = mobile.
// WalletConnect relay is NEVER used on mobile — it causes "approve connection"
// prompts inside the wallet instead of loading the dApp in the wallet browser.
// ─────────────────────────────────────────────────────────────────────────────
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua       = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|webOS|Mobile/i.test(navigator.userAgent);
  const touch    = navigator.maxTouchPoints > 1;
  const coarse   = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow   = window.innerWidth < 768;
  return ua || (touch && coarse) || (coarse && narrow);
}

function isAndroid(): boolean { return /Android/i.test(navigator.userAgent); }

// ─────────────────────────────────────────────────────────────────────────────
// WALLET BROWSER DETECTION
// Are we already inside a wallet's built-in browser?
// If yes → connect injected() directly. No deeplink or QR needed.
// ─────────────────────────────────────────────────────────────────────────────
function getWalletBrowserName(): string | null {
  const eth = (window as any).ethereum;
  if (!eth) return null;
  if (eth.isOKExWallet || eth.isOkxWallet)  return 'OKX Wallet';
  if (eth.isBitKeep    || eth.isBitget)       return 'Bitget Wallet';
  if (eth.isBybit)                             return 'Bybit Wallet';
  if (eth.isSafePal)                           return 'SafePal';
  if (eth.isBinance)                           return 'Binance Web3';
  if (eth.isGate       || eth.isGateWallet)    return 'Gate Wallet';
  if (eth.isZerion)                            return 'Zerion';
  if (eth.isRabby)                             return 'Rabby';
  if (eth.isOneInch)                           return '1inch Wallet';
  if (eth.isKraken)                            return 'Kraken Wallet';
  if (eth.isTokenPocket)                       return 'TokenPocket';
  if (eth.isImToken)                           return 'imToken';
  if (eth.isRainbow)                           return 'Rainbow';
  if (eth.isBraveWallet)                       return 'Brave Wallet';
  if (eth.isCoinbaseWallet)                    return 'Coinbase Wallet';
  if (eth.isTrust || eth.isTrustWallet)        return 'Trust Wallet';
  if (eth.isPhantom)                           return 'Phantom';
  if (eth.isMetaMask)                          return 'MetaMask';
  return 'Wallet';
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET DEFINITIONS
//
// Each entry has a `deeplink` factory that returns the URL to open.
// On mobile:  deeplink → wallet app opens at our URL → auto-connect fires.
// On desktop: deeplinks are NOT used. Instead:
//   - Extension detected → connect injected() directly (no picker row needed)
//   - No extension       → WalletConnect QR (scan from phone)
//
// MOBILE DEEPLINK DOCS (all verified):
//   MetaMask    https://docs.metamask.io/wallet/how-to/use-mobile/
//   Trust       https://developer.trustwallet.com/developer/develop-for-trust/deeplinking
//   Coinbase    https://docs.cdp.coinbase.com/coinbase-wallet/developer-guidance/mobile-dapp-integration
//   OKX         https://web3.okx.com/build/docs/waas/app-universal-link
//   Phantom     https://docs.phantom.app/phantom-deeplinks/other-methods/browse
//   Rainbow     https://www.rainbow.me developer docs
//   Bitget      https://docs.bitkeep.com/en/docs/guide/mobile/Deeplink.html
//   imToken     https://imtoken.gitbook.io/developers/products/deep-linking
//   Zerion      https://zerion.io/blog/zerion-link
//   TokenPocket https://docs.tokenpocket.pro/developer/deeplinking
// ─────────────────────────────────────────────────────────────────────────────

interface WalletDef {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  accent: string;
  deeplink: (url: string) => string;
  icon: React.ReactNode;
}

const WALLETS: WalletDef[] = [
  {
    id: 'metamask', name: 'MetaMask', badge: 'Most popular',
    desc: 'ETH · BNB · Polygon · Arbitrum',
    accent: '#E27625',
    deeplink: (url) => `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, '')}`,
    icon: (
      <svg viewBox="0 0 35 33" className="w-6 h-6" fill="none">
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
  {
    id: 'trust', name: 'Trust Wallet',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accent: '#3375BB',
    deeplink: (url) => {
      const enc = encodeURIComponent(url);
      return isAndroid()
        ? `trust://open_url?coin_id=60&url=${enc}`
        : `https://link.trustwallet.com/open_url?coin_id=60&url=${enc}`;
    },
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#3375BB"/>
        <path d="M20 8l10 4.5v9c0 5.5-4.5 10-10 11.5C14.5 31.5 10 27 10 21.5v-9L20 8z" fill="white"/>
        <path d="M17 21l2 2 4-4" stroke="#3375BB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'coinbase', name: 'Coinbase Wallet',
    desc: 'ETH · Base · Polygon · Arbitrum',
    accent: '#1652F0',
    deeplink: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#1652F0"/>
        <circle cx="20" cy="20" r="10.5" fill="white"/>
        <rect x="15.5" y="17" width="9" height="6" rx="2.2" fill="#1652F0"/>
      </svg>
    ),
  },
  {
    id: 'okx', name: 'OKX Wallet',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accent: '#888',
    deeplink: (url) => {
      const inner = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`;
      return `https://web3.okx.com/download?deeplink=${encodeURIComponent(inner)}`;
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
  {
    id: 'phantom', name: 'Phantom',
    desc: 'ETH · SOL · BTC · Polygon',
    accent: '#9B8CFF',
    deeplink: (url) => {
      const enc = encodeURIComponent(url);
      const ref = encodeURIComponent(new URL(url).origin);
      return isAndroid()
        ? `intent://browse/${enc}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=https%3A%2F%2Fphantom.app%2F;end`
        : `https://phantom.app/ul/browse/${enc}?ref=${ref}`;
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
  {
    id: 'rainbow', name: 'Rainbow',
    desc: 'ETH · Base · Arbitrum · Optimism',
    accent: '#FF6B6B',
    deeplink: (url) => `https://rnbwapp.com/dapp?url=${encodeURIComponent(url)}`,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#174299"/>
        <path d="M10 27c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#FF4D4D" strokeWidth="3" strokeLinecap="round"/>
        <path d="M13 27c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#FF9500" strokeWidth="3" strokeLinecap="round"/>
        <path d="M16 27c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'bitget', name: 'Bitget Wallet',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accent: '#00C6D3',
    deeplink: (url) => `https://bkcode.vip?action=dapp&url=${encodeURIComponent(url)}`,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#1AA0C7"/>
        <path d="M14 20h12M20 14v12" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="6.5" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'bybit', name: 'Bybit Wallet',
    desc: 'ETH · BNB · Polygon · Base',
    accent: '#F7A600',
    deeplink: (url) => `https://www.bybitglobal.com/en/web3-wallet/dapp?url=${encodeURIComponent(url)}`,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#F7A600"/>
        <path d="M12 14h8c2.2 0 4 1.8 4 4s-1.8 4-4 4H12V14z" fill="white"/>
        <path d="M12 22h9c2.2 0 4 1.8 4 4H12V22z" fill="white" opacity=".75"/>
      </svg>
    ),
  },
  {
    id: 'zerion', name: 'Zerion',
    desc: 'ETH · Base · All EVM chains',
    accent: '#2962EF',
    deeplink: (url) => `https://link.zerion.io/dapp?url=${encodeURIComponent(url)}`,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#2962EF"/>
        <path d="M10 12h20L16 28h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'imtoken', name: 'imToken',
    desc: 'ETH · BNB · Polygon · TRX',
    accent: '#11C4D1',
    deeplink: (url) => `imtokenv2://navigate/DappView?url=${encodeURIComponent(url)}`,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#11C4D1"/>
        <rect x="11" y="15" width="18" height="4" rx="2" fill="white"/>
        <rect x="14" y="22" width="12" height="3.5" rx="1.75" fill="white" opacity=".75"/>
      </svg>
    ),
  },
  {
    id: 'tokenpocket', name: 'TokenPocket',
    desc: 'ETH · BNB · SOL · 100+ chains',
    accent: '#2980FE',
    deeplink: (url) => {
      const enc = encodeURIComponent(url);
      return isAndroid() ? `tpdapp://url?params=${enc}` : `https://tokenpocket.pro/dapp?url=${enc}`;
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
  {
    id: 'safepal', name: 'SafePal',
    desc: 'ETH · BNB · SOL · Hardware',
    accent: '#335BFF',
    deeplink: (url) => `safepal://dapp?url=${encodeURIComponent(url)}`,
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="11" fill="#1A2ECC"/>
        <path d="M20 10l8 3.5v7c0 4.2-3.4 8-8 9.4-4.6-1.4-8-5.2-8-9.4v-7L20 10z"
          stroke="white" strokeWidth="1.5" fill="none"/>
        <path d="M17 20.5l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function EvmWalletPicker() {
  const { showEvmPicker, setShowEvmPicker } = useWalletStore();
  const { openConnectModal }  = useConnectModal();
  const { connectAsync }      = useConnect();
  const [search, setSearch]   = useState('');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  // Evaluate fresh each render — catches orientation change
  const mobile      = isMobile();
  const walletBrowser = getWalletBrowserName();
  const hasExtension  = !!(window as any).ethereum;

  // Escape to close
  useEffect(() => {
    if (!showEvmPicker) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowEvmPicker(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [showEvmPicker, setShowEvmPicker]);

  // Auto-focus search on desktop, reset search on close
  useEffect(() => {
    if (showEvmPicker && !mobile) setTimeout(() => inputRef.current?.focus(), 80);
    if (!showEvmPicker) setSearch('');
  }, [showEvmPicker, mobile]);

  // Lock body scroll — save/restore position so page doesn't jump
  useEffect(() => {
    if (showEvmPicker) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => { unlockScroll(); };
  }, [showEvmPicker]);

  if (!showEvmPicker) return null;

  const filtered = search
    ? WALLETS.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.desc.toLowerCase().includes(search.toLowerCase())
      )
    : WALLETS;

  // ─── Connection logic ────────────────────────────────────────────────────
  //
  //  CASE 1 — Inside a wallet browser (mobile or desktop):
  //    window.ethereum is injected by the wallet → connect directly, no redirect.
  //
  //  CASE 2 — Mobile, external browser (Safari, Chrome, Samsung Internet…):
  //    → deeplink into the chosen wallet's built-in browser.
  //    → The wallet opens our URL, injects window.ethereum, auto-connect fires.
  //    → NEVER use WalletConnect relay here — it shows "Approve in app" instead
  //      of loading the dApp in the wallet browser.
  //
  //  CASE 3 — Desktop, extension present:
  //    → connect injected() directly. Fast, no modal.
  //
  //  CASE 4 — Desktop, no extension:
  //    → Open WalletConnect QR modal only.
  //    → The user scans QR with their phone wallet — it connects via WalletConnect
  //      relay to the desktop session. This is the CORRECT WC use case on desktop.
  //    → Individual wallet deeplinks are NOT shown here because they are mobile-only
  //      and clicking them from desktop would open an App Store page in the browser.
  //
  const handleWalletClick = (w: WalletDef) => {
    setShowEvmPicker(false);

    // CASE 1
    if (walletBrowser) {
      connectAsync({ connector: injected() }).catch(() => {});
      return;
    }

    // CASE 2 — re-check innerWidth as belt-and-suspenders against UA spoofing
    if (mobile || window.innerWidth < 768) {
      window.location.href = w.deeplink(window.location.href);
      return;
    }

    // CASE 3 — desktop extension
    if (hasExtension) {
      connectAsync({ connector: injected() }).catch(() => {});
      return;
    }

    // CASE 4 — desktop no extension → QR (only WalletConnect should reach here)
    openConnectModal?.();
  };

  const handleWCClick = () => {
    setShowEvmPicker(false);
    // Safety: if somehow triggered on mobile, use MetaMask deeplink instead
    if (mobile || window.innerWidth < 768) {
      window.location.href = WALLETS[0].deeplink(window.location.href);
      return;
    }
    openConnectModal?.();
  };

  // ─── Shared card style ───────────────────────────────────────────────────
  const card = {
    base: {
      background: 'rgba(255,255,255,0.025)',
      border:     '1px solid rgba(255,255,255,0.07)',
      transition: 'background 0.1s, border-color 0.1s',
    },
    hover: (accent: string) => ({
      background: `${accent}10`,
      border:     `1px solid ${accent}45`,
    }),
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(2,4,10,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={() => setShowEvmPicker(false)}
    >
      <div
        className="relative w-full sm:w-[min(96vw,460px)] flex flex-col"
        style={{
          background:   'linear-gradient(160deg,#0D1118 0%,#090C13 100%)',
          border:       '1px solid rgba(255,255,255,0.09)',
          borderRadius: mobile ? '22px 22px 0 0' : '22px',
          maxHeight:    mobile ? '93vh' : '86vh',
          boxShadow:    '0 -30px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(43,255,241,0.05)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        {mobile && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div>
            <h2 className="text-[#F4F6FA] font-bold text-[17px] leading-tight">Connect Wallet</h2>
            <p className="text-[#6B7280] text-xs mt-1">
              {walletBrowser
                ? `${walletBrowser} detected — tap to connect instantly`
                : mobile
                  ? 'Tap a wallet — opens the app with this page already loaded'
                  : hasExtension
                    ? `${getWalletBrowserName() ?? 'Browser extension'} detected — connect below`
                    : 'Scan QR with your phone wallet, or install a browser extension'}
            </p>
          </div>
          <button
            onClick={() => setShowEvmPicker(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F4F6FA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MOBILE PATH — deeplinks only, zero WalletConnect relay
            ═══════════════════════════════════════════════════════════════════ */}
        {mobile ? (
          <>
            {/* Tip — hidden when already in wallet browser */}
            {!walletBrowser && (
              <div className="mx-4 mb-2.5 px-3 py-2.5 rounded-xl flex items-center gap-2 flex-shrink-0"
                style={{ background: 'rgba(43,255,241,0.06)', border: '1px solid rgba(43,255,241,0.13)' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#2BFFF1' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <p style={{ color: 'rgba(43,255,241,0.82)', fontSize: '11px', lineHeight: '1.45' }}>
                  The app opens with this page loaded — you're connected automatically.
                </p>
              </div>
            )}

            <SearchInput value={search} onChange={setSearch} inputRef={null} />

            <div className="overflow-y-auto flex-1 px-4 pb-3" style={{ minHeight: 0 }}>
              {filtered.length === 0
                ? <NoResults query={search} onClear={() => setSearch('')} />
                : (
                  <div className="flex flex-col gap-1.5">
                    {filtered.map(w => (
                      <WalletRow
                        key={w.id}
                        wallet={w}
                        hovered={hoverId === w.id}
                        onHover={setHoverId}
                        onClick={() => handleWalletClick(w)}
                        chevron="→"
                        cardStyle={card}
                      />
                    ))}
                  </div>
                )
              }
            </div>

            <PickerFooter />
          </>

        ) : (
        /* ═══════════════════════════════════════════════════════════════════
           DESKTOP PATH
           
           Case A — extension installed:
             Show "Connect [WalletName]" button + WalletConnect QR as alternative
           
           Case B — no extension:
             Show WalletConnect QR only. Individual wallet rows are NOT shown
             because they are mobile deeplinks and would open an App Store page
             in the desktop browser, which is the wrong experience.
           ═══════════════════════════════════════════════════════════════════ */
          <>
            {hasExtension ? (
              /* Case A — extension present */
              <div className="px-4 pb-3 flex-shrink-0">
                {/* Direct connect button */}
                <button
                  onClick={() => { setShowEvmPicker(false); connectAsync({ connector: injected() }).catch(() => {}); }}
                  onMouseEnter={() => setHoverId('__ext')}
                  onMouseLeave={() => setHoverId(null)}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 mb-3 text-left active:scale-[0.98] transition-all"
                  style={hoverId === '__ext'
                    ? { background: 'rgba(43,255,241,0.1)', border: '1px solid rgba(43,255,241,0.45)' }
                    : { background: 'rgba(43,255,241,0.05)', border: '1px solid rgba(43,255,241,0.22)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[#F4F6FA] font-semibold text-sm">
                      Connect {walletBrowser ?? 'Browser Extension'}
                    </p>
                    <p className="text-[#6B7280] text-xs mt-0.5">Extension detected — instant connection</p>
                  </div>
                  <span className="text-[#2BFFF1] font-bold text-sm">→</span>
                </button>

                {/* WalletConnect QR as secondary option */}
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5" style={{ color: '#4B5563' }}>
                  Or scan with a different wallet
                </p>
                <WCButton hovered={hoverId === '__wc'} onHover={setHoverId} onClick={handleWCClick} />
              </div>

            ) : (
              /* Case B — no extension: WalletConnect QR only */
              <div className="px-4 pb-4 flex-shrink-0">
                <div className="mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p style={{ color: '#9CA3AF', fontSize: '11px' }}>
                    No wallet extension detected. Scan QR with your phone, or{' '}
                    <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
                      className="underline" style={{ color: '#F59E0B' }}>
                      install MetaMask
                    </a>.
                  </p>
                </div>
                <WCButton hovered={hoverId === '__wc'} onHover={setHoverId} onClick={handleWCClick} />
              </div>
            )}

            {/* Divider + search for extension users wanting to switch wallets */}
            {hasExtension && (
              <>
                <div className="flex-shrink-0 px-4 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5" style={{ color: '#4B5563' }}>
                    Mobile wallet? Open on your phone instead
                  </p>
                </div>
                <SearchInput value={search} onChange={setSearch} inputRef={inputRef} />
                <div className="overflow-y-auto flex-1 px-4 pb-3" style={{ minHeight: 0 }}>
                  {filtered.length === 0
                    ? <NoResults query={search} onClear={() => setSearch('')} />
                    : (
                      <div className="flex flex-col gap-1">
                        {filtered.map(w => (
                          <WalletRow
                            key={w.id}
                            wallet={w}
                            hovered={hoverId === w.id}
                            onHover={setHoverId}
                            onClick={() => handleWalletClick(w)}
                            chevron="Open on phone →"
                            compact
                            cardStyle={card}
                          />
                        ))}
                      </div>
                    )
                  }
                </div>
              </>
            )}

            <PickerFooter />
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SearchInput({ value, onChange, inputRef }: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.Ref<HTMLInputElement> | null;
}) {
  return (
    <div className="px-4 pb-2.5 flex-shrink-0">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: '#374151' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
        </svg>
        <input
          ref={inputRef}
          type="text" placeholder="Search wallets…" value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E5E7EB' }}
        />
      </div>
    </div>
  );
}

function WCButton({ hovered, onHover, onClick }: {
  hovered: boolean; onHover: (id: string | null) => void; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover('__wc')}
      onMouseLeave={() => onHover(null)}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left active:scale-[0.98]"
      style={hovered
        ? { background: 'rgba(59,153,252,0.12)', border: '1px solid rgba(59,153,252,0.55)', transition: 'all 0.1s' }
        : { background: 'rgba(59,153,252,0.06)', border: '1px solid rgba(59,153,252,0.25)', transition: 'all 0.1s' }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(59,153,252,0.1)' }}>
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#3B99FC"/>
          <path d="M13.3 17.2c3.7-3.6 9.7-3.6 13.4 0l.4.4c.2.2.2.5 0 .7l-1.5 1.5c-.1.1-.3.1-.4 0l-.6-.6c-2.6-2.5-6.7-2.5-9.3 0l-.7.6c-.1.1-.3.1-.4 0l-1.5-1.5c-.2-.2-.2-.5 0-.7l.6-.4zm16.5 3.1-1.3 1.3c-.2.2-.4.2-.6 0l-2.7-2.7c-.7-.7-1.9-.7-2.6 0l-2.7 2.7c-.2.2-.4.2-.6 0l-2.7-2.7c-.7-.7-1.9-.7-2.6 0l-2.7 2.7c-.2.2-.4.2-.6 0L9.2 20.3c-.2-.2-.2-.4 0-.6l1.3-1.3"
            stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[#E5E7EB] font-semibold text-sm">WalletConnect</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(59,153,252,0.18)', color: '#60A5FA', border: '1px solid rgba(59,153,252,0.28)' }}>
            300+ wallets
          </span>
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>
          Scan QR from MetaMask · Trust · OKX · Phantom · Ledger + any wallet
        </p>
      </div>
      <span className="flex-shrink-0 font-bold text-sm transition-opacity"
        style={{ color: '#60A5FA', opacity: hovered ? 1 : 0.35 }}>
        QR →
      </span>
    </button>
  );
}

function WalletRow({ wallet, hovered, onHover, onClick, chevron, compact = false, cardStyle }: {
  wallet: WalletDef;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  chevron: string;
  compact?: boolean;
  cardStyle: { base: React.CSSProperties; hover: (a: string) => React.CSSProperties };
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(wallet.id)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(wallet.id)}
      onTouchEnd={() => { setTimeout(() => onHover(null), 200); }}
      className={`w-full flex items-center gap-3 rounded-xl text-left active:scale-[0.97] ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
      style={hovered ? cardStyle.hover(wallet.accent) : cardStyle.base}
    >
      <div className={`${compact ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} flex items-center justify-center flex-shrink-0 overflow-hidden`}
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        {wallet.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${compact ? 'text-[#C9CDD4] text-[13px]' : 'text-[#E5E7EB] text-sm'}`}>
            {wallet.name}
          </span>
          {wallet.badge && !compact && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
              style={{ background: `${wallet.accent}20`, color: '#2BFFF1', border: `1px solid ${wallet.accent}28` }}>
              {wallet.badge}
            </span>
          )}
        </div>
        {!compact && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#6B7280' }}>{wallet.desc}</p>
        )}
      </div>
      <span className="flex-shrink-0 font-semibold text-xs transition-opacity"
        style={{ color: wallet.accent, opacity: hovered ? 1 : 0.22 }}>
        {chevron}
      </span>
    </button>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <span className="text-3xl">🔍</span>
      <p className="text-sm" style={{ color: '#6B7280' }}>No results for "{query}"</p>
      <button onClick={onClear} style={{ color: '#2BFFF1', fontSize: '12px' }}>Clear</button>
    </div>
  );
}

function PickerFooter() {
  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-3 flex items-center justify-between"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ color: '#4B5563', fontSize: '11px' }}>Don't have a wallet?</p>
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:brightness-110 transition-all"
        style={{ background: 'rgba(226,118,37,0.12)', border: '1px solid rgba(226,118,37,0.3)', color: '#F59E0B' }}>
        🦊 Get MetaMask
      </a>
    </div>
  );
  }
