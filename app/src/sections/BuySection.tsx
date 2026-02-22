import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, CreditCard, TrendingUp,
  ExternalLink, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useSendTransaction, useBalance, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { mainnet, bsc } from 'wagmi/chains';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePresaleStore, getCurrentStage, LISTING_PRICE_USD } from '../store/presaleStore';

gsap.registerPlugin(ScrollTrigger);

const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = _sbUrl && _sbKey ? createClient(_sbUrl, _sbKey) : null;

// ── Receiving wallet addresses ────────────────────────────────────────────
const PRESALE_ETH_WALLET = '0x0722ef1dcfa7849b3bf0db375793bfacc52b8e39' as `0x${string}`;
const PRESALE_SOL_WALLET = 'HAEC8fjg9Wpg1wpL8j5EQFRmrq4dj8BqYQVKgZZdKmRM';
const PRESALE_BTC_WALLET = 'bc1q3rdjpm36lcy30amzfkaqpvvm5xu8n8y665ajlx';

// ─────────────────────────────────────────────────────────────────────────────
// PHANTOM DEEPLINK API
// Works from ANY browser (Chrome, Safari, Firefox) — no in-app browser needed.
// Standard used by Magic Eden, Tensor, and every major Solana dapp.
//
// Flow:
//   1. User clicks Connect → app generates keypair, redirects to Phantom
//   2. Phantom app opens natively → user approves
//   3. Phantom redirects BACK to this page with encrypted session payload
//   4. Page decrypts it → wallet shows as connected
//   5. On Buy → same redirect flow for transaction approval
// ─────────────────────────────────────────────────────────────────────────────
const PHANTOM_UL = 'https://phantom.app/ul/v1';

// Retrieve or create the dApp encryption keypair (survives the redirect via sessionStorage)
async function getDappKeypair() {
  const nacl = (await import('tweetnacl')).default;
  const stored = sessionStorage.getItem('_kleo_dapp_kp');
  if (stored) {
    try {
      const { pk, sk } = JSON.parse(stored);
      return { publicKey: new Uint8Array(pk), secretKey: new Uint8Array(sk) };
    } catch {}
  }
  const kp = nacl.box.keyPair();
  sessionStorage.setItem('_kleo_dapp_kp', JSON.stringify({
    pk: Array.from(kp.publicKey),
    sk: Array.from(kp.secretKey),
  }));
  return kp;
}

async function decryptPhantomPayload(phantomPubKey58: string, data58: string, nonce58: string) {
  const nacl = (await import('tweetnacl')).default;
  const bs58 = (await import('bs58')).default;
  const kp = await getDappKeypair();
  const shared = nacl.box.before(bs58.decode(phantomPubKey58), kp.secretKey);
  const decrypted = nacl.box.open.after(bs58.decode(data58), bs58.decode(nonce58), shared);
  if (!decrypted) throw new Error('Phantom decryption failed');
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// Redirect to Phantom for wallet connection — works from Chrome, Safari, any browser
async function phantomDeeplinkConnect(type: 'sol') {
  const bs58 = (await import('bs58')).default;
  const kp = await getDappKeypair();
  sessionStorage.setItem('_kleo_connect_type', type);
  // Clean base URL (no query params) so Phantom can redirect back cleanly
  const redirectLink = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    app_url: window.location.origin,
    dapp_encryption_public_key: bs58.encode(kp.publicKey),
    redirect_link: redirectLink,
    cluster: 'mainnet-beta',
  });
  window.location.href = `${PHANTOM_UL}/connect?${params}`;
}

// Redirect to Phantom to sign & broadcast a SOL transaction
async function phantomDeeplinkSignAndSend(
  fromAddress: string,
  toAddress: string,
  lamports: number,
  session: string,
  phantomPubKey58: string,
  purchaseMeta: object
) {
  const nacl = (await import('tweetnacl')).default;
  const bs58 = (await import('bs58')).default;
  const { Connection, PublicKey, SystemProgram, Transaction } = await import('@solana/web3.js');

  const conn = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const { blockhash } = await conn.getLatestBlockhash();

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(fromAddress),
      toPubkey:   new PublicKey(toAddress),
      lamports,
    })
  );
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(fromAddress);

  const kp = await getDappKeypair();
  const shared = nacl.box.before(bs58.decode(phantomPubKey58), kp.secretKey);
  const nonce = nacl.randomBytes(24);
  const payload = { session, transaction: bs58.encode(tx.serialize({ requireAllSignatures: false })) };
  const encrypted = nacl.box.after(new TextEncoder().encode(JSON.stringify(payload)), nonce, shared);

  // Store purchase metadata so we can record it when Phantom redirects back
  sessionStorage.setItem('_kleo_pending_purchase', JSON.stringify(purchaseMeta));

  const redirectLink = window.location.origin + window.location.pathname;
  const p = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(kp.publicKey),
    nonce:   bs58.encode(nonce),
    redirect_link: redirectLink,
    payload: bs58.encode(encrypted),
  });
  window.location.href = `${PHANTOM_UL}/signAndSendTransaction?${p}`;
}

// ── Mobile detection ──────────────────────────────────────────────────────
function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
function isAndroid() { return /Android/i.test(navigator.userAgent); }
function isIOS()    { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

// ── Injected wallet types (desktop / in-app browser) ────────────────────
type PhantomSolProvider = {
  isConnected: boolean;
  publicKey: { toString: () => string } | null;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
};
type BitcoinProvider = {
  requestAccounts: () => Promise<{ address: string; publicKey: string; purpose?: string }[]>;
  sendBitcoin: (to: string, satoshis: number) => Promise<string>;
};
type SolflareProvider = {
  isConnected: boolean;
  publicKey?: { toString: () => string };
  connect: () => Promise<void>;
  signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
};
declare global {
  interface Window {
    phantom?:   { solana?: PhantomSolProvider; bitcoin?: BitcoinProvider };
    solana?:    PhantomSolProvider;
    solflare?:  SolflareProvider;
    okxwallet?: { bitcoin?: BitcoinProvider; solana?: PhantomSolProvider };
  }
}

// ── Injected wallet registry (desktop / in-app browser fallback) ──────────
interface DetectedWallet {
  id: string; name: string; icon: string; color: string;
  connect: () => Promise<string>;
  sendSol?: (to: string, lamports: number, conn: unknown) => Promise<string>;
  sendBtc?: (to: string, satoshis: number) => Promise<string>;
}

function detectSolanaWallets(): DetectedWallet[] {
  const list: DetectedWallet[] = [];
  if (window.phantom?.solana) list.push({
    id: 'phantom', name: 'Phantom', icon: '👻', color: 'text-purple-400',
    connect: async () => (await window.phantom!.solana!.connect()).publicKey.toString(),
    sendSol: async (to, lamports, conn) => {
      const { PublicKey, SystemProgram, Transaction } = await import('@solana/web3.js');
      const pk = window.phantom!.solana!.publicKey!;
      const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: new PublicKey(pk.toString()), toPubkey: new PublicKey(to), lamports,
      }));
      const { blockhash } = await (conn as any).getLatestBlockhash();
      tx.recentBlockhash = blockhash; tx.feePayer = new PublicKey(pk.toString());
      return (await window.phantom!.solana!.signAndSendTransaction(tx)).signature;
    },
  });
  if (window.solflare) list.push({
    id: 'solflare', name: 'Solflare', icon: '🔥', color: 'text-orange-400',
    connect: async () => { await window.solflare!.connect(); return window.solflare!.publicKey!.toString(); },
    sendSol: async (to, lamports, conn) => {
      const { PublicKey, SystemProgram, Transaction } = await import('@solana/web3.js');
      const pk = window.solflare!.publicKey!;
      const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: new PublicKey(pk.toString()), toPubkey: new PublicKey(to), lamports,
      }));
      const { blockhash } = await (conn as any).getLatestBlockhash();
      tx.recentBlockhash = blockhash; tx.feePayer = new PublicKey(pk.toString());
      return (await window.solflare!.signAndSendTransaction(tx)).signature;
    },
  });
  if (window.okxwallet?.solana) list.push({
    id: 'okx-sol', name: 'OKX Wallet', icon: '⭕', color: 'text-gray-300',
    connect: async () => (await window.okxwallet!.solana!.connect()).publicKey.toString(),
  });
  return list;
}

function detectBitcoinWallets(): DetectedWallet[] {
  const list: DetectedWallet[] = [];
  if (window.phantom?.bitcoin) list.push({
    id: 'phantom-btc', name: 'Phantom', icon: '👻', color: 'text-purple-400',
    connect: async (): Promise<string> => {
      const accs = await window.phantom!.bitcoin!.requestAccounts();
      return accs.find(a => a.purpose === 'payment')?.address ?? accs[0]?.address ?? '';
    },
    sendBtc: async (to, sat) => window.phantom!.bitcoin!.sendBitcoin(to, sat),
  });
  const xverseProvider = (window as any).XverseProviders?.BitcoinProvider ?? (window as any).BitcoinProvider;
  if (xverseProvider) list.push({
    id: 'xverse', name: 'Xverse', icon: '✦', color: 'text-blue-400',
    connect: async (): Promise<string> => {
      const r = await xverseProvider.request('getAccounts', { purposes: ['payment'], message: 'Connect to Kaleo presale' });
      return r?.result?.addresses?.[0]?.address ?? '';
    },
    sendBtc: async (to, sat) => {
      const r = await xverseProvider.request('sendTransfer', { recipients: [{ address: to, amount: sat }] });
      return r?.result?.txid ?? '';
    },
  });
  if (window.okxwallet?.bitcoin) list.push({
    id: 'okx-btc', name: 'OKX Wallet', icon: '⭕', color: 'text-gray-300',
    connect: async (): Promise<string> => {
      const accs = await window.okxwallet!.bitcoin!.requestAccounts();
      return accs[0]?.address ?? '';
    },
    sendBtc: async (to, sat) => window.okxwallet!.bitcoin!.sendBitcoin(to, sat),
  });
  return list;
}

// ── Price data ────────────────────────────────────────────────────────────
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana', BTC: 'bitcoin',
};

const CURRENCIES = [
  { id: 'SOL', label: 'Solana',   symbol: 'SOL', icon: '◎', color: 'text-purple-400', chain: 'sol' },
  { id: 'ETH', label: 'Ethereum', symbol: 'ETH', icon: 'Ξ', color: 'text-blue-400',   chain: 'evm', chainId: mainnet.id },
  { id: 'BNB', label: 'BNB',      symbol: 'BNB', icon: '◆', color: 'text-yellow-400', chain: 'evm', chainId: bsc.id },
  { id: 'BTC', label: 'Bitcoin',  symbol: 'BTC', icon: '₿', color: 'text-orange-400', chain: 'btc' },
];

// ════════════════════════════════════════════════════════════════════════════
export function BuySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  const { totalRaised, addRaised, addPurchase } = usePresaleStore();
  const currentStage = getCurrentStage(totalRaised);

  // EVM (wagmi)
  const { address, isConnected, chain } = useAccount();
  const { data: evmBalance }            = useBalance({ address });
  const { sendTransactionAsync }        = useSendTransaction();
  const { switchChainAsync }            = useSwitchChain();

  // UI state
  const [tab,           setTab]          = useState<'crypto' | 'card'>('crypto');
  const [currency,      setCurrency]     = useState('SOL');
  const [amount,        setAmount]       = useState('');
  const [usdEst,        setUsdEst]       = useState(0);
  const [txStatus,      setTxStatus]     = useState<'idle'|'pending'|'success'|'error'>('idle');
  const [txHash,        setTxHash]       = useState('');
  const [txError,       setTxError]      = useState('');
  const [cardUsd,       setCardUsd]      = useState('100');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [liveRates,     setLiveRates]    = useState<Record<string,number>>({ ETH: 3200, BNB: 580, SOL: 170, BTC: 65000 });
  const [priceLoading,  setPriceLoading] = useState(false);
  const [priceError,    setPriceError]   = useState(false);

  // SOL wallet state
  const [solAddr,      setSolAddr]      = useState('');
  const [solConnected, setSolConnected] = useState(false);
  const [solViaDeeplink, setSolViaDeeplink] = useState(false); // true = connected via Phantom deeplink

  // BTC wallet state
  const [btcAddr,      setBtcAddr]      = useState('');
  const [btcConnected, setBtcConnected] = useState(false);

  // Picker modals
  const [showInjectedPicker, setShowInjectedPicker] = useState(false);
  const [injectedWallets,    setInjectedWallets]    = useState<DetectedWallet[]>([]);
  const [pickerType,         setPickerType]         = useState<'sol'|'btc'>('sol');
  const [activeWallet,       setActiveWallet]       = useState<DetectedWallet | null>(null);

  // BTC mobile picker modal
  const [showBtcPicker,  setShowBtcPicker]  = useState(false);

  // Manual BTC payment modal (MetaMask)
  const [showManualBtc,       setShowManualBtc]       = useState(false);
  const [manualBtcTxHash,     setManualBtcTxHash]     = useState('');
  const [manualBtcCopied,     setManualBtcCopied]     = useState(false);
  const [manualBtcSubmitting, setManualBtcSubmitting] = useState(false);

  const selected = CURRENCIES.find(c => c.id === currency)!;
  const isEvm    = selected.chain === 'evm';
  const isBtc    = selected.chain === 'btc';

  // ── Record purchase ────────────────────────────────────────────────────
  const recordPurchase = useCallback(async (
    hash: string, usd: number, tokens: number, wallet: string, method: string
  ) => {
    addRaised(usd);
    addPurchase({ usdSpent: usd, kleoReceived: tokens, stage: currentStage.stage, priceUsd: currentStage.priceUsd, txHash: hash, timestamp: Date.now(), cryptoType: method });
    if (supabase) {
      const { error } = await supabase.from('presale_purchases').insert({
        wallet_address: wallet.toLowerCase(), tokens, eth_spent: 0,
        usd_amount: usd, stage: currentStage.stage, price_eth: currentStage.priceUsd,
        tx_hash: hash, payment_method: method.toLowerCase(),
      });
      if (error) console.error('Supabase insert:', error.message);
    }
  }, [addRaised, addPurchase, currentStage]);

  // ── On mount: handle Phantom deeplink callback + detect injected wallets ──
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const phantomPubKey = params.get('phantom_encryption_public_key');
      const data          = params.get('data');
      const nonce         = params.get('nonce');
      const errorCode     = params.get('errorCode');

      // Always clean the URL after a Phantom redirect
      if (phantomPubKey || errorCode) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }

      if (phantomPubKey && data && nonce && !errorCode) {
        try {
          const payload = await decryptPhantomPayload(phantomPubKey, data, nonce);

          if (payload.public_key) {
            // ── CONNECT CALLBACK ──────────────────────────────────────────
            // Store session + Phantom's public key for later transaction signing
            sessionStorage.setItem('_kleo_phantom_session', payload.session);
            sessionStorage.setItem('_kleo_phantom_pubkey', phantomPubKey);
            setSolAddr(payload.public_key);
            setSolConnected(true);
            setSolViaDeeplink(true);
            setCurrency('SOL');

          } else if (payload.signature) {
            // ── TRANSACTION CALLBACK ──────────────────────────────────────
            const pendingStr = sessionStorage.getItem('_kleo_pending_purchase');
            if (pendingStr) {
              sessionStorage.removeItem('_kleo_pending_purchase');
              const { usd, tokens, addr, method } = JSON.parse(pendingStr);
              await recordPurchase(payload.signature, usd, tokens, addr, method);
              setTxHash(payload.signature);
              setTxStatus('success');
            }
          }
        } catch (e) {
          console.error('Phantom callback error:', e);
        }
      }

      // ── Also detect injected wallets (desktop extensions / in-app browsers) ──
      const phantom = window.phantom?.solana || window.solana;
      if (phantom?.isConnected && phantom.publicKey) {
        setSolAddr(phantom.publicKey.toString());
        setSolConnected(true);
      }
      const btcProv = window.phantom?.bitcoin;
      if (btcProv) {
        btcProv.requestAccounts().then(accs => {
          if (accs?.[0]?.address) { setBtcAddr(accs[0].address); setBtcConnected(true); }
        }).catch(() => {});
      }
    };
    init();
  }, [recordPurchase]);

  // ── Live prices ────────────────────────────────────────────────────────
  useEffect(() => {
    const ids = Object.values(COINGECKO_IDS).join(',');
    setPriceLoading(true);
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
      .then(r => r.json())
      .then(data => {
        const rates: Record<string, number> = {};
        for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
          if (data[id]?.usd) rates[sym] = data[id].usd;
        }
        if (Object.keys(rates).length) { setLiveRates(p => ({ ...p, ...rates })); setPriceError(false); }
      })
      .catch(() => setPriceError(true))
      .finally(() => setPriceLoading(false));
  }, []);

  // ── USD estimate ───────────────────────────────────────────────────────
  useEffect(() => {
    const n = parseFloat(amount);
    setUsdEst(!n || n <= 0 ? 0 : n * (liveRates[currency] || 1));
  }, [amount, currency, liveRates]);

  const tokensFor = (usd: number) => Math.floor(usd / currentStage.priceUsd);
  const tokensEst = tokensFor(usdEst);

  // ── GSAP ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sectionRef.current && cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true } });
    }
  }, []);

  // ── Connect SOL wallet ─────────────────────────────────────────────────
  const connectSol = async () => {
    const injected = detectSolanaWallets();
    if (injected.length > 0) {
      // Desktop or already inside wallet browser — use injected API directly
      if (injected.length === 1) {
        const addr = await injected[0].connect();
        setSolAddr(addr); setSolConnected(true); setActiveWallet(injected[0]);
      } else {
        setInjectedWallets(injected); setPickerType('sol'); setShowInjectedPicker(true);
      }
      return;
    }
    // Mobile with no injected wallet → use Phantom Deeplink API
    // Works from Chrome, Safari, any browser. No in-app browser required.
    if (isMobile()) {
      await phantomDeeplinkConnect('sol');
    } else {
      window.open('https://phantom.app/', '_blank');
    }
  };

  // ── Connect BTC wallet ─────────────────────────────────────────────────
  const connectBtc = () => {
    const injected = detectBitcoinWallets();
    if (injected.length > 0) {
      if (injected.length === 1) {
        injected[0].connect().then(addr => {
          setBtcAddr(addr); setBtcConnected(true); setActiveWallet(injected[0]);
        }).catch(() => {});
      } else {
        setInjectedWallets(injected); setPickerType('btc'); setShowInjectedPicker(true);
      }
      return;
    }
    // Mobile: show BTC wallet picker (Phantom in-app browser or Xverse or MetaMask manual)
    setShowBtcPicker(true);
  };

  const connectInjected = async (wallet: DetectedWallet, type: 'sol' | 'btc') => {
    setShowInjectedPicker(false);
    try {
      const addr = await wallet.connect();
      if (!addr) return;
      if (type === 'sol') { setSolAddr(addr); setSolConnected(true); }
      else                { setBtcAddr(addr); setBtcConnected(true); }
      setActiveWallet(wallet);
    } catch {}
  };

  // ── Open Phantom in-app browser for BTC ──────────────────────────────
  const openPhantomInApp = () => {
    const url = encodeURIComponent(window.location.href);
    const ref = encodeURIComponent(window.location.origin);
    if (isAndroid()) window.location.href = `intent://browse/${url}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;end`;
    else if (isIOS()) window.location.href = `https://phantom.app/ul/browse/${url}?ref=${ref}`;
    else window.open('https://phantom.app/', '_blank');
  };

  const openXverseInApp = () => {
    const url = encodeURIComponent(window.location.href);
    if (isAndroid()) window.location.href = `intent://browse?url=${url}#Intent;scheme=xverse;package=com.secretkeylabs.xverse;end`;
    else if (isIOS()) window.location.href = `https://www.xverse.app/browser?url=${url}`;
    else window.open('https://www.xverse.app/', '_blank');
  };

  // ── Send SOL ──────────────────────────────────────────────────────────
  const sendSol = async (): Promise<string> => {
    const { LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);

    // If connected via Phantom Deeplink, use deeplink for signing too
    const session    = sessionStorage.getItem('_kleo_phantom_session');
    const phantomPk  = sessionStorage.getItem('_kleo_phantom_pubkey');
    if (solViaDeeplink && session && phantomPk) {
      await phantomDeeplinkSignAndSend(
        solAddr, PRESALE_SOL_WALLET, lamports, session, phantomPk,
        { usd: usdEst, tokens: tokensEst, addr: solAddr, method: 'SOL' }
      );
      return ''; // redirects — never reaches here
    }

    // Injected wallet (desktop or in-app browser)
    if (!activeWallet?.sendSol) throw new Error('Connect a Solana wallet first');
    const { Connection } = await import('@solana/web3.js');
    const conn = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    return activeWallet.sendSol(PRESALE_SOL_WALLET, lamports, conn);
  };

  // ── Send BTC ──────────────────────────────────────────────────────────
  const sendBtc = async (): Promise<string> => {
    if (!activeWallet?.sendBtc) throw new Error('Connected wallet does not support BTC sends — try Phantom or Xverse');
    const satoshis = Math.round(parseFloat(amount) * 100_000_000);
    return activeWallet.sendBtc(PRESALE_BTC_WALLET, satoshis);
  };

  // ── Manual BTC submit ─────────────────────────────────────────────────
  const handleManualBtcSubmit = async () => {
    const txid = manualBtcTxHash.trim();
    if (!txid || txid.length < 60) return;
    setManualBtcSubmitting(true);
    try {
      await recordPurchase(txid, usdEst, tokensEst, 'metamask-btc-manual', 'BTC');
      setShowManualBtc(false); setManualBtcTxHash('');
      setTxHash(txid); setTxStatus('success');
    } catch {
      setTxError('Failed to record — contact support with your tx hash.');
      setTxStatus('error');
    } finally {
      setManualBtcSubmitting(false);
    }
  };

  // ── Main buy ──────────────────────────────────────────────────────────
  const handleBuy = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setTxStatus('pending'); setTxError('');
    try {
      let hash = '';
      if (isBtc) {
        if (!btcConnected) throw new Error('Connect Bitcoin wallet first');
        hash = await sendBtc();
        await recordPurchase(hash, usdEst, tokensEst, btcAddr, 'BTC');
      } else if (!isEvm) {
        if (!solConnected) throw new Error('Connect Solana wallet first');
        hash = (await sendSol()) || '';
        if (hash) await recordPurchase(hash, usdEst, tokensEst, solAddr, 'SOL');
        // If no hash, we redirected to Phantom — status will be set on return
      } else {
        if (!address) throw new Error('Connect wallet first');
        if (chain?.id !== selected.chainId) await switchChainAsync({ chainId: selected.chainId! });
        hash = await sendTransactionAsync({ to: PRESALE_ETH_WALLET, value: parseEther(amount) });
        await recordPurchase(hash, usdEst, tokensEst, address, selected.id);
      }
      if (hash) { setTxHash(hash); setTxStatus('success'); }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setTxError(msg.includes('reject') || msg.includes('User') || msg.includes('cancel')
        ? 'Transaction rejected — nothing was sent' : msg);
      setTxStatus('error');
    }
  };

  const buyWithCard = async () => {
    const usd = parseFloat(cardUsd);
    if (!usd || usd < 10) return;
    const wallet = isBtc ? btcAddr : isEvm ? (address || '') : solAddr;
    setStripeLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdAmount: usd, tokens: tokensFor(usd), wallet, stage: currentStage.stage }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) { console.error('Stripe:', e); } finally { setStripeLoading(false); }
  };

  const explorerUrl = txHash
    ? isBtc   ? `https://mempool.space/tx/${txHash}`
    : !isEvm  ? `https://solscan.io/tx/${txHash}`
    : selected.chainId === bsc.id ? `https://bscscan.com/tx/${txHash}`
    : `https://etherscan.io/tx/${txHash}`
    : null;

  const reset = () => { setTxStatus('idle'); setTxHash(''); setTxError(''); setAmount(''); };
  const presets: Record<string, number[]> = {
    SOL: [0.5, 1, 2, 5], ETH: [0.01, 0.05, 0.1, 0.5],
    BNB: [0.05, 0.2, 0.5, 1], BTC: [0.0005, 0.001, 0.005, 0.01],
  };
  const balanceDisplay = isEvm && evmBalance
    ? `${parseFloat(evmBalance.formatted).toFixed(4)} ${evmBalance.symbol}` : null;
  const walletReady = isBtc ? btcConnected : isEvm ? isConnected : solConnected;

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <section ref={sectionRef} id="buy" className="fade-in-section relative overflow-hidden py-16">
      <div className="absolute inset-0 w-full h-full">
        <img src="/stage_city_bg_02.jpg" alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/80 via-[#05060B]/50 to-[#05060B]/85" />
      </div>

      <div ref={cardRef} className="glass-card relative w-[min(92vw,520px)] rounded-[28px] p-8 mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingUp className="w-7 h-7 text-[#2BFFF1]" />
            <h2 className="text-4xl font-bold text-[#F4F6FA]">Buy Kaleo</h2>
          </div>
          <p className="text-[#2BFFF1] text-xl font-semibold">
            Stage {currentStage.stage} &mdash; ${currentStage.priceUsd.toFixed(4)} / KLEO
          </p>
          <p className="text-[#A7B0B7] text-sm mt-1">
            {currentStage.discount}% off listing (${LISTING_PRICE_USD})
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
          {(['crypto', 'card'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${tab === t ? 'bg-[#2BFFF1] text-[#05060B] shadow-lg' : 'text-[#A7B0B7] hover:text-white'}`}>
              {t === 'card' && <CreditCard className="w-4 h-4" />}
              {t === 'crypto' ? 'Crypto' : 'Card'}
            </button>
          ))}
        </div>

        {/* ── CRYPTO TAB ── */}
        {tab === 'crypto' && (
          <>
            {/* Currency selector */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {CURRENCIES.map(c => (
                <button key={c.id} onClick={() => { setCurrency(c.id); reset(); }}
                  className={`py-3 px-2 rounded-xl border text-center transition-all duration-200 ${
                    currency === c.id
                      ? 'border-[#2BFFF1]/60 bg-[#2BFFF1]/10 scale-[1.03]'
                      : 'border-white/10 bg-white/5 hover:border-white/25'}`}>
                  <div className={`text-2xl font-bold ${c.color}`}>{c.icon}</div>
                  <div className="text-xs text-[#A7B0B7] mt-1 font-semibold">{c.symbol}</div>
                </button>
              ))}
            </div>

            {/* Wallet connect section */}
            <div className="mb-5">
              {isEvm ? (
                isConnected && evmBalance ? (
                  <div className="flex items-center justify-between bg-[#2BFFF1]/5 border border-[#2BFFF1]/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">{address?.slice(0,6)}...{address?.slice(-4)}</span>
                    </div>
                    <span className="text-[#2BFFF1] font-semibold text-sm">{balanceDisplay}</span>
                  </div>
                ) : (
                  <div className="[&>div]:w-full [&_button]:!w-full [&_button]:!py-3.5 [&_button]:!rounded-xl [&_button]:!font-semibold [&_button]:!text-sm">
                    <ConnectButton label={`Connect wallet for ${selected.label}`} />
                  </div>
                )
              ) : isBtc ? (
                btcConnected ? (
                  <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">{btcAddr.slice(0,8)}...{btcAddr.slice(-6)}</span>
                    </div>
                    <span className="text-orange-400 font-semibold text-sm">Bitcoin ✓</span>
                  </div>
                ) : (
                  <button onClick={connectBtc}
                    className="w-full flex items-center justify-center gap-3 bg-orange-600/20 border border-orange-500/40 hover:border-orange-400/70 hover:bg-orange-600/30 rounded-xl px-4 py-3.5 transition-all">
                    <span className="text-2xl leading-none text-orange-400">₿</span>
                    <span className="text-orange-300 font-semibold">Connect Bitcoin Wallet</span>
                  </button>
                )
              ) : (
                solConnected ? (
                  <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">{solAddr.slice(0,6)}...{solAddr.slice(-4)}</span>
                    </div>
                    <span className="text-purple-300 font-semibold text-sm">Phantom ✓</span>
                  </div>
                ) : (
                  <button onClick={connectSol}
                    className="w-full flex items-center justify-center gap-3 bg-purple-600/20 border border-purple-500/40 hover:border-purple-400/70 hover:bg-purple-600/30 rounded-xl px-4 py-3.5 transition-all">
                    <span className="text-2xl leading-none">◎</span>
                    <span className="text-purple-300 font-semibold">Connect Solana Wallet</span>
                  </button>
                )
              )}
            </div>

            {/* TX states */}
            {txStatus === 'success' && (
              <div className="mb-5 p-5 rounded-xl border border-green-500/30 bg-green-500/5 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-bold text-lg mb-1">Transaction Confirmed!</p>
                <p className="text-[#A7B0B7] text-sm mb-3">{tokensEst.toLocaleString()} KLEO reserved at Stage {currentStage.stage}</p>
                {explorerUrl && (
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#2BFFF1] text-sm hover:underline mb-3">
                    View on Explorer <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <div><button onClick={reset} className="text-[#2BFFF1] text-sm hover:underline">Buy More</button></div>
              </div>
            )}
            {txStatus === 'error' && (
              <div className="mb-5 p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold text-sm">{txError}</p>
                  <button onClick={reset} className="text-[#2BFFF1] text-xs hover:underline mt-1">Try again</button>
                </div>
              </div>
            )}

            {/* Amount input */}
            {txStatus === 'idle' && walletReady && (
              <>
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#A7B0B7] text-sm">Amount to spend</label>
                    <span className="text-xs text-[#A7B0B7]/70">
                      {priceLoading
                        ? <span className="text-[#2BFFF1]/50">Fetching price...</span>
                        : priceError
                        ? <span className="text-yellow-500/70">Using cached price</span>
                        : <span className="text-green-400/80">1 {selected.symbol} = ${liveRates[currency]?.toLocaleString('en-US', {maximumFractionDigits: 2})}</span>}
                    </span>
                  </div>
                  <div className="relative">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="0.0" min="0" step="any"
                      className="input-glass w-full px-5 py-5 text-2xl font-semibold pr-20" />
                    <span className={`absolute right-5 top-1/2 -translate-y-1/2 font-bold text-lg ${selected.color}`}>
                      {selected.symbol}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {presets[currency].map(a => (
                      <button key={a} onClick={() => setAmount(String(a))}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#2BFFF1]/40 text-xs text-[#A7B0B7] transition-colors">
                        {a}
                      </button>
                    ))}
                  </div>
                  {usdEst > 0 && (
                    <div className="mt-3 p-4 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/20 text-center">
                      <p className="text-[#A7B0B7] text-xs mb-1">You will receive approximately</p>
                      <p className="text-[#2BFFF1] text-2xl font-bold">
                        {tokensEst.toLocaleString()} <span className="text-base font-normal">KLEO</span>
                      </p>
                      <p className="text-[#A7B0B7] text-xs mt-1">~${usdEst.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD</p>
                    </div>
                  )}
                </div>
                <button onClick={handleBuy} disabled={!amount || parseFloat(amount) <= 0}
                  className="neon-button w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
                  {txStatus === 'pending'
                    ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Processing...</>
                    : <>Buy KLEO with {selected.symbol} <ArrowRight className="w-5 h-5" /></>}
                </button>
              </>
            )}
            {txStatus === 'idle' && !walletReady && (
              <p className="text-center text-[#A7B0B7] text-sm mt-2">Connect your wallet above to continue</p>
            )}
          </>
        )}

        {/* ── CARD TAB ── */}
        {tab === 'card' && (
          <div>
            <div className="mb-5">
              <label className="block text-[#A7B0B7] mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7B0B7] font-medium">$</span>
                <input type="number" value={cardUsd} onChange={e => setCardUsd(e.target.value)}
                  placeholder="100" min="10"
                  className="input-glass w-full pl-8 pr-5 py-5 text-2xl font-semibold" />
              </div>
              {cardUsd && parseFloat(cardUsd) > 0 && (
                <p className="text-[#2BFFF1] text-sm mt-2 text-center">
                  ~{tokensFor(parseFloat(cardUsd)).toLocaleString()} KLEO at ${currentStage.priceUsd.toFixed(4)}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                {[50, 100, 250, 500].map(a => (
                  <button key={a} onClick={() => setCardUsd(String(a))}
                    className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#2BFFF1]/40 text-sm text-[#A7B0B7] transition-colors">
                    ${a}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={buyWithCard} disabled={stripeLoading || !cardUsd || parseFloat(cardUsd) < 10}
              className="neon-button w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
              {stripeLoading
                ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirecting...</>
                : <>Pay with Card <ExternalLink className="w-5 h-5" /></>}
            </button>
            <p className="text-center text-[#A7B0B7] text-xs mt-3">Min $10 &middot; Secured by Stripe &middot; KLEO delivered at launch</p>
          </div>
        )}
      </div>

      {/* ── INJECTED WALLET PICKER MODAL (desktop / in-app browser) ── */}
      {showInjectedPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowInjectedPicker(false)}>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,340px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#F4F6FA] font-bold text-lg">
                Choose {pickerType === 'sol' ? 'Solana' : 'Bitcoin'} Wallet
              </h3>
              <button onClick={() => setShowInjectedPicker(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              {injectedWallets.map(w => (
                <button key={w.id} onClick={() => connectInjected(w, pickerType)}
                  className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#2BFFF1]/30 rounded-xl px-4 py-4 transition-all">
                  <span className="text-2xl">{w.icon}</span>
                  <span className={`font-semibold ${w.color}`}>{w.name}</span>
                  <span className="ml-auto text-[#A7B0B7] text-xs">Detected</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BTC MOBILE PICKER MODAL ── */}
      {showBtcPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowBtcPicker(false)}>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,360px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#F4F6FA] font-bold text-lg">Connect Bitcoin Wallet</h3>
              <button onClick={() => setShowBtcPicker(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <p className="text-[#A7B0B7] text-xs mb-5 leading-relaxed">
              Choose your wallet. Phantom and Xverse will open their app to connect, then return you here.
            </p>
            <div className="space-y-3">
              {/* Phantom — opens in-app browser where bitcoin API is injected */}
              <button onClick={() => { setShowBtcPicker(false); openPhantomInApp(); }}
                className="w-full flex items-center gap-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-400/60 rounded-xl px-4 py-4 transition-all">
                <span className="text-2xl">👻</span>
                <div className="text-left">
                  <p className="text-purple-300 font-semibold">Phantom</p>
                  <p className="text-[#A7B0B7] text-xs">Opens Phantom browser to connect</p>
                </div>
              </button>
              {/* Xverse — Bitcoin-native, injects window.BitcoinProvider */}
              <button onClick={() => { setShowBtcPicker(false); openXverseInApp(); }}
                className="w-full flex items-center gap-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-400/60 rounded-xl px-4 py-4 transition-all">
                <span className="text-2xl">₿</span>
                <div className="text-left">
                  <p className="text-blue-300 font-semibold">Xverse</p>
                  <p className="text-[#A7B0B7] text-xs">Native Bitcoin wallet</p>
                </div>
              </button>
              {/* MetaMask — manual payment only */}
              <button onClick={() => { setShowBtcPicker(false); setShowManualBtc(true); }}
                className="w-full flex items-center gap-4 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/30 hover:border-orange-400/60 rounded-xl px-4 py-4 transition-all">
                <span className="text-2xl">🦊</span>
                <div className="text-left">
                  <p className="text-orange-300 font-semibold">MetaMask</p>
                  <p className="text-[#A7B0B7] text-xs">Send manually &middot; paste tx hash</p>
                </div>
                <span className="ml-auto text-[#A7B0B7] text-xs bg-white/5 rounded px-2 py-0.5">Manual</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL BTC PAYMENT MODAL (MetaMask) ── */}
      {showManualBtc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowManualBtc(false)}>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,380px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦊</span>
                <h3 className="text-[#F4F6FA] font-bold text-lg">Pay with MetaMask Bitcoin</h3>
              </div>
              <button onClick={() => setShowManualBtc(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <p className="text-[#A7B0B7] text-xs mb-5 leading-relaxed">
              MetaMask&apos;s Bitcoin account can&apos;t connect to websites directly. Send the BTC manually, then paste your transaction ID below.
            </p>
            <div className="mb-4">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-2">Step 1 — Copy our BTC address</p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-[#F4F6FA] text-xs font-mono flex-1 truncate">{PRESALE_BTC_WALLET}</span>
                <button onClick={() => { navigator.clipboard.writeText(PRESALE_BTC_WALLET); setManualBtcCopied(true); setTimeout(() => setManualBtcCopied(false), 2000); }}
                  className="text-xs text-[#2BFFF1] hover:text-white font-semibold shrink-0">
                  {manualBtcCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="mb-4 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-1">Step 2 — Send exact amount</p>
              <div className="flex items-baseline gap-2">
                <span className="text-orange-400 font-bold text-2xl">{amount ? parseFloat(amount).toFixed(8) : '0.00000000'}</span>
                <span className="text-orange-400 font-semibold">BTC</span>
                {usdEst > 0 && <span className="text-[#A7B0B7] text-xs ml-auto">≈ ${usdEst.toFixed(2)}</span>}
              </div>
              <p className="text-[#A7B0B7] text-xs mt-1">MetaMask → Bitcoin → Send → paste address above</p>
            </div>
            <div className="mb-5">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-2">Step 3 — Paste transaction ID</p>
              <input type="text" value={manualBtcTxHash} onChange={e => setManualBtcTxHash(e.target.value)}
                placeholder="e.g. 3a1b2c3d4e5f..."
                className="w-full bg-white/5 border border-white/10 focus:border-[#2BFFF1]/50 rounded-xl px-4 py-3 text-[#F4F6FA] text-xs font-mono outline-none transition-colors placeholder:text-[#A7B0B7]/40" />
            </div>
            <button onClick={handleManualBtcSubmit}
              disabled={manualBtcTxHash.trim().length < 60 || manualBtcSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-white/10 disabled:text-[#A7B0B7] text-white font-bold py-4 rounded-xl transition-all">
              {manualBtcSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
            <p className="text-[#A7B0B7] text-xs text-center mt-4">
              Your KLEO tokens will be reserved once we verify the transaction on-chain.
            </p>
          </div>
        </div>
      )}
    </section>
  );
  }
