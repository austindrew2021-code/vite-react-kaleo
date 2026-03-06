import { useEffect, useRef, useState } from 'react';
import { useWalletStore } from '../store/presaleStore';
import { lockScroll } from '../utils/scrollLock';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface SolWalletDef {
  id: string;
  name: string;
  desc: string;
  accent: string;
  // Returns address string on connect — undefined if wallet not installed
  connect?: () => Promise<string>;
  sendSol?: (to: string, lamports: number, conn: unknown) => Promise<string>;
  // Deeplink for when wallet is NOT installed (mobile)
  deeplink?: (url: string) => string;
  icon: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM
// ─────────────────────────────────────────────────────────────────────────────
function isAndroid() { return /Android/i.test(navigator.userAgent); }
function isMobile()  {
  const ua    = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|webOS|Mobile/i.test(navigator.userAgent);
  const touch = navigator.maxTouchPoints > 1;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return ua || (touch && coarse) || window.innerWidth < 768;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOL TRANSACTION HELPER — shared across wallets
// ─────────────────────────────────────────────────────────────────────────────
async function buildSolTx(from: string, to: string, lamports: number, conn: unknown) {
  const { PublicKey, SystemProgram, Transaction } = await import('@solana/web3.js');
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: new PublicKey(from), toPubkey: new PublicKey(to), lamports })
  );
  const { blockhash } = await (conn as any).getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(from);
  return tx;
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET DEFINITIONS — detection + connection + deeplink
//
// Detection order matters: check specific flags before generic window.solana
// to avoid false positives when wallets all inject into the same namespace.
//
// Deeplink sources:
//   Phantom   https://docs.phantom.app/phantom-deeplinks/other-methods/browse
//   Solflare  https://docs.solflare.com/solflare/technical/deeplinks
//   Backpack  https://docs.xnft.gg/backpack-deeplinks
//   OKX       https://web3.okx.com/build/docs/waas/app-universal-link
//   Coin98    https://docs.coin98.com/products/coin98-super-wallet/deeplink
//   Bitget    https://docs.bitkeep.com/en/docs/guide/mobile/Deeplink.html
// ─────────────────────────────────────────────────────────────────────────────
export function buildSolWallets(): SolWalletDef[] {
  const w = window as any;

  return [
    // ── Phantom ────────────────────────────────────────────────────────────
    {
      id: 'phantom', name: 'Phantom', desc: 'SOL · ETH · BTC · Polygon',
      accent: '#9B8CFF',
      ...(w.phantom?.solana ? {
        connect: async () => (await w.phantom.solana.connect()).publicKey.toString(),
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const pk = w.phantom.solana.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await w.phantom.solana.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) => {
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

    // ── Solflare ───────────────────────────────────────────────────────────
    {
      id: 'solflare', name: 'Solflare', desc: 'SOL · Staking · Hardware',
      accent: '#FC8C04',
      ...(w.solflare ? {
        connect: async () => {
          await w.solflare.connect();
          return w.solflare.publicKey.toString();
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const pk = w.solflare.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await w.solflare.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) => {
        const enc = encodeURIComponent(url);
        const ref = encodeURIComponent(new URL(url).origin);
        return isAndroid()
          ? `https://solflare.com/ul/v1/browse/${enc}?ref=${ref}`
          : `https://solflare.com/ul/v1/browse/${enc}?ref=${ref}`;
      },
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#FC8C04"/>
          <path d="M20 9l9 5.2v10.4L20 30l-9-5.4V14.2L20 9z" fill="white" opacity=".15"/>
          <path d="M12 22l8-13 8 13H12z" fill="white"/>
          <path d="M14 25l6-9 6 9H14z" fill="white" opacity=".55"/>
        </svg>
      ),
    },

    // ── Backpack ───────────────────────────────────────────────────────────
    {
      id: 'backpack', name: 'Backpack', desc: 'SOL · ETH · xNFTs',
      accent: '#E33E3F',
      ...(w.backpack?.solana || w.xnft?.solana ? {
        connect: async () => {
          const bp = w.backpack?.solana || w.xnft?.solana;
          await bp.connect();
          return bp.publicKey.toString();
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const bp = w.backpack?.solana || w.xnft?.solana;
          const pk = bp.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await bp.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) => {
        const enc = encodeURIComponent(url);
        return isAndroid()
          ? `intent://browse/${enc}#Intent;scheme=backpack;package=app.backpack;S.browser_fallback_url=https%3A%2F%2Fwww.backpack.app%2F;end`
          : `https://backpack.app/browse/${enc}`;
      },
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#E33E3F"/>
          <path d="M17 12h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z" stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M18 12v-1a2 2 0 0 1 4 0v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="14" y="18" width="12" height="2" rx="1" fill="white"/>
        </svg>
      ),
    },

    // ── OKX ───────────────────────────────────────────────────────────────
    {
      id: 'okx', name: 'OKX Wallet', desc: 'SOL · ETH · BNB · 100+ chains',
      accent: '#888',
      ...(w.okxwallet?.solana ? {
        connect: async () => (await w.okxwallet.solana.connect()).publicKey.toString(),
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const pk = w.okxwallet.solana.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await w.okxwallet.solana.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) => {
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

    // ── Coin98 ─────────────────────────────────────────────────────────────
    {
      id: 'coin98', name: 'Coin98', desc: 'SOL · ETH · BNB · Multi-chain',
      accent: '#D4A017',
      ...(w.coin98?.sol ? {
        connect: async () => {
          const r = await w.coin98.sol.request({ method: 'connect' });
          return r.publicKey?.toString() ?? r[0];
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const pubkey = (await w.coin98.sol.request({ method: 'connect' })).publicKey.toString();
          const tx = await buildSolTx(pubkey, to, lamports, conn);
          const { signature } = await w.coin98.sol.request({ method: 'signAndSendTransaction', params: { message: Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64') } });
          return signature;
        },
      } : {}),
      deeplink: (url: string) => {
        const enc = encodeURIComponent(url);
        return `https://coin98.com/browse/${enc}`;
      },
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#1A1A1A"/>
          <circle cx="20" cy="20" r="9" stroke="#D4A017" strokeWidth="2"/>
          <text x="20" y="25" textAnchor="middle" fill="#D4A017" fontSize="11" fontWeight="800">98</text>
        </svg>
      ),
    },

    // ── Bitget Wallet ──────────────────────────────────────────────────────
    {
      id: 'bitget', name: 'Bitget Wallet', desc: 'SOL · ETH · BNB · 100+ chains',
      accent: '#00C6D3',
      ...(w.bitkeep?.solana || w.bitget?.solana ? {
        connect: async () => {
          const bg = w.bitkeep?.solana || w.bitget?.solana;
          const r = await bg.connect();
          return r.publicKey?.toString() ?? bg.publicKey?.toString();
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const bg = w.bitkeep?.solana || w.bitget?.solana;
          const pk = bg.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await bg.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) =>
        `https://bkcode.vip?action=dapp&url=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#1AA0C7"/>
          <path d="M14 20h12M20 14v12" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
          <circle cx="20" cy="20" r="6.5" stroke="white" strokeWidth="2"/>
        </svg>
      ),
    },

    // ── Trust Wallet ───────────────────────────────────────────────────────
    {
      id: 'trust', name: 'Trust Wallet', desc: 'SOL · ETH · BNB · 100+ chains',
      accent: '#3375BB',
      ...(w.trustwallet?.solana || w.solana?.isTrust ? {
        connect: async () => {
          const t = w.trustwallet?.solana || w.solana;
          await t.connect();
          return t.publicKey.toString();
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const t = w.trustwallet?.solana || w.solana;
          const pk = t.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await t.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) => {
        const enc = encodeURIComponent(url);
        return isAndroid()
          ? `trust://open_url?coin_id=501&url=${enc}`
          : `https://link.trustwallet.com/open_url?coin_id=501&url=${enc}`;
      },
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#3375BB"/>
          <path d="M20 8l10 4.5v9c0 5.5-4.5 10-10 11.5C14.5 31.5 10 27 10 21.5v-9L20 8z" fill="white"/>
          <path d="M17 21l2 2 4-4" stroke="#3375BB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },

    // ── Exodus ─────────────────────────────────────────────────────────────
    {
      id: 'exodus', name: 'Exodus', desc: 'SOL · ETH · BTC · 300+ assets',
      accent: '#7B5EA7',
      ...(w.exodus?.solana ? {
        connect: async () => {
          const r = await w.exodus.solana.connect();
          return r.publicKey.toString();
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const pk = w.exodus.solana.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await w.exodus.solana.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) => `exodus://open?url=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#0B0B0F"/>
          <defs>
            <linearGradient id="exG2" x1="9" y1="8" x2="31" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9B59B6"/>
              <stop offset="100%" stopColor="#3B82F6"/>
            </linearGradient>
          </defs>
          <path d="M20 9L31 28H9L20 9z" fill="url(#exG2)"/>
        </svg>
      ),
    },

    // ── Glow ──────────────────────────────────────────────────────────────
    {
      id: 'glow', name: 'Glow', desc: 'SOL · NFTs · DeFi',
      accent: '#7CFF8A',
      ...(w.glow ? {
        connect: async () => {
          const r = await w.glow.connect();
          return r.publicKey?.toString() ?? w.glow.publicKey?.toString();
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const pk = w.glow.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await w.glow.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) =>
        `https://glow.app/browse?url=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#111"/>
          <circle cx="20" cy="20" r="8" fill="none" stroke="#7CFF8A" strokeWidth="2"/>
          <circle cx="20" cy="20" r="4" fill="#7CFF8A"/>
        </svg>
      ),
    },

    // ── Nightly ────────────────────────────────────────────────────────────
    {
      id: 'nightly', name: 'Nightly', desc: 'SOL · ETH · Multi-chain',
      accent: '#5A67F2',
      ...(w.nightly?.solana || w.nightlyConnect?.solana ? {
        connect: async () => {
          const n = w.nightly?.solana || w.nightlyConnect?.solana;
          await n.connect();
          return n.publicKey.toString();
        },
        sendSol: async (to: string, lamports: number, conn: unknown) => {
          const n = w.nightly?.solana || w.nightlyConnect?.solana;
          const pk = n.publicKey.toString();
          const tx = await buildSolTx(pk, to, lamports, conn);
          return (await n.signAndSendTransaction(tx)).signature;
        },
      } : {}),
      deeplink: (url: string) =>
        `https://nightly.app/browse?url=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect width="40" height="40" rx="11" fill="#1A1B2E"/>
          <path d="M20 10a10 10 0 0 0 0 20 10 10 0 0 1 0-20z" fill="#5A67F2"/>
          <circle cx="26" cy="14" r="2" fill="#F0C040"/>
          <circle cx="29" cy="19" r="1.2" fill="#F0C040" opacity=".6"/>
          <circle cx="23" cy="11" r="1" fill="#F0C040" opacity=".4"/>
        </svg>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  onConnect: (addr: string, wallet: SolWalletDef) => void;
}

export function SolWalletPicker({ onConnect }: Props) {
  const { showSolPicker, setShowSolPicker } = useWalletStore();
  const [search, setSearch]    = useState('');
  const [hoverId, setHoverId]  = useState<string | null>(null);
  const [wallets, setWallets]  = useState<SolWalletDef[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError]      = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const mobile = isMobile();

  // Build wallet list fresh each time picker opens — detect installed wallets
  useEffect(() => {
    if (showSolPicker) {
      setWallets(buildSolWallets());
      setError('');
      setSearch('');
      if (!mobile) setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [showSolPicker, mobile]);

  // Escape to close + body scroll lock
  useEffect(() => {
    if (!showSolPicker) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSolPicker(false); };
    window.addEventListener('keydown', h);
    const release = lockScroll();
    return () => {
      window.removeEventListener('keydown', h);
      release();
    };
  }, [showSolPicker, setShowSolPicker]);

  if (!showSolPicker) return null;

  // Split wallets: installed (have connect fn) vs deeplink-only
  const installed = wallets.filter(w => !!w.connect);
  const deeplinkOnly = wallets.filter(w => !w.connect && !!w.deeplink);

  const filterWallets = (list: SolWalletDef[]) =>
    search
      ? list.filter(w =>
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.desc.toLowerCase().includes(search.toLowerCase())
        )
      : list;

  const filteredInstalled = filterWallets(installed);
  const filteredDeeplink  = filterWallets(deeplinkOnly);
  const totalFiltered = filteredInstalled.length + filteredDeeplink.length;

  const handleInstalled = async (w: SolWalletDef) => {
    if (!w.connect) return;
    setConnecting(w.id);
    setError('');
    try {
      const addr = await w.connect();
      if (addr) {
        setShowSolPicker(false);
        onConnect(addr, w);
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (!msg.includes('rejected') && !msg.includes('User') && !msg.includes('cancel')) {
        setError(msg.length > 80 ? msg.slice(0, 80) + '…' : msg);
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDeeplink = (w: SolWalletDef) => {
    if (!w.deeplink) return;
    setShowSolPicker(false);
    window.location.href = w.deeplink(window.location.href);
  };

  // Card style helpers
  const baseCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    transition: 'background 0.1s, border-color 0.1s',
  };
  const hoverCard = (accent: string): React.CSSProperties => ({
    background: `${accent}10`,
    border: `1px solid ${accent}45`,
  });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(2,4,10,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={() => setShowSolPicker(false)}
    >
      <div
        className="relative w-full sm:w-[min(96vw,460px)] flex flex-col"
        style={{
          background:   'linear-gradient(160deg,#0D1118 0%,#090C13 100%)',
          border:       '1px solid rgba(255,255,255,0.09)',
          borderRadius: mobile ? '22px 22px 0 0' : '22px',
          maxHeight:    mobile ? '93vh' : '88vh',
          boxShadow:    '0 -30px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(153,140,255,0.07)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        {mobile && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">◎</span>
              <h2 className="text-[#F4F6FA] font-bold text-[17px] leading-tight">Connect Solana Wallet</h2>
            </div>
            <p className="text-[#6B7280] text-xs mt-1">
              {installed.length > 0
                ? `${installed.length} wallet${installed.length > 1 ? 's' : ''} detected — tap to connect`
                : mobile
                  ? 'Tap a wallet — opens the app with this page loaded'
                  : 'Install a Solana wallet extension or use mobile'}
            </p>
          </div>
          <button
            onClick={() => setShowSolPicker(false)}
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

        {/* Mobile tip */}
        {mobile && installed.length === 0 && (
          <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-2 flex-shrink-0"
            style={{ background: 'rgba(153,140,255,0.07)', border: '1px solid rgba(153,140,255,0.2)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9B8CFF' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <p style={{ color: 'rgba(153,140,255,0.85)', fontSize: '11px', lineHeight: '1.45' }}>
              Opens inside your wallet's browser — connected automatically.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-2.5 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: '#374151' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              ref={inputRef}
              type="text" placeholder="Search wallets…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E5E7EB' }}
            />
          </div>
        </div>

        {/* Wallet list */}
        <div className="overflow-y-auto flex-1 px-4 pb-3" style={{ minHeight: 0 }}>
          {totalFiltered === 0 && search ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="text-3xl">🔍</span>
              <p className="text-sm" style={{ color: '#6B7280' }}>No results for "{search}"</p>
              <button onClick={() => setSearch('')} style={{ color: '#9B8CFF', fontSize: '12px' }}>Clear</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">

              {/* ── Installed wallets ──────────────────────────────────────── */}
              {filteredInstalled.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5" style={{ color: '#4B5563' }}>
                    Detected on this device
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {filteredInstalled.map(w => {
                      const hov = hoverId === w.id;
                      const busy = connecting === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => handleInstalled(w)}
                          onMouseEnter={() => setHoverId(w.id)}
                          onMouseLeave={() => setHoverId(null)}
                          disabled={!!connecting}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left active:scale-[0.98] disabled:opacity-60"
                          style={hov ? hoverCard(w.accent) : baseCard}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {busy
                              ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              : w.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[#E5E7EB] font-semibold text-sm">{w.name}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                                style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
                                Installed
                              </span>
                            </div>
                            <p className="text-xs truncate mt-0.5" style={{ color: '#6B7280' }}>{w.desc}</p>
                          </div>
                          <span className="flex-shrink-0 font-bold text-sm transition-opacity"
                            style={{ color: w.accent, opacity: hov ? 1 : 0.2 }}>
                            {busy ? '…' : '→'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Deeplink wallets (mobile + not installed) ─────────────── */}
              {filteredDeeplink.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5 mt-1" style={{ color: '#4B5563' }}>
                    {installed.length > 0 ? 'Open in another wallet' : 'Choose a wallet'}
                  </p>
                  <div className="flex flex-col gap-1">
                    {filteredDeeplink.map(w => {
                      const hov = hoverId === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => mobile ? handleDeeplink(w) : undefined}
                          onMouseEnter={() => setHoverId(w.id)}
                          onMouseLeave={() => setHoverId(null)}
                          className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left active:scale-[0.97] ${!mobile ? 'cursor-default opacity-40' : ''}`}
                          style={hov && mobile ? hoverCard(w.accent) : baseCard}
                          title={!mobile ? `${w.name} — mobile only` : undefined}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {w.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[#C9CDD4] font-semibold text-[13px]">{w.name}</span>
                          </div>
                          {mobile && (
                            <span className="flex-shrink-0 font-semibold text-xs transition-opacity"
                              style={{ color: w.accent, opacity: hov ? 1 : 0.2 }}>→</span>
                          )}
                          {!mobile && (
                            <span className="flex-shrink-0 text-[10px]" style={{ color: '#4B5563' }}>mobile</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Desktop no wallets installed */}
              {!mobile && installed.length === 0 && !search && (
                <div className="mt-2 px-3 py-4 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-sm font-semibold text-[#E5E7EB] mb-1">No Solana wallet detected</p>
                  <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
                    Install a browser extension or open this page on your phone.
                  </p>
                  <a href="https://phantom.app" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                    style={{ background: 'rgba(76,68,198,0.25)', border: '1px solid rgba(76,68,198,0.4)', color: '#9B8CFF' }}>
                    👻 Get Phantom
                  </a>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 pb-4 pt-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#4B5563', fontSize: '11px' }}>Don't have a wallet?</p>
          <a href="https://phantom.app" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:brightness-110 transition-all"
            style={{ background: 'rgba(76,68,198,0.15)', border: '1px solid rgba(76,68,198,0.35)', color: '#9B8CFF' }}>
            👻 Get Phantom
          </a>
        </div>
      </div>
    </div>
  );
}
