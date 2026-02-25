import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, CreditCard, TrendingUp,
  ExternalLink, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useSendTransaction, useDisconnect, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { sepolia, bscTestnet } from 'wagmi/chains';
import { usePresaleStore, getCurrentStage, LISTING_PRICE_USD, useWalletStore } from '../store/presaleStore';

gsap.registerPlugin(ScrollTrigger);

const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = _sbUrl && _sbKey ? createClient(_sbUrl, _sbKey) : null;

// ── Receiving wallet addresses ────────────────────────────────────────────
// ⚠️ TESTNET — swap back to mainnet address before going live
const PRESALE_ETH_WALLET = '0x0722ef1dcfa7849b3bf0db375793bfacc52b8e39' as `0x${string}`; // same address works on Sepolia + BSC testnet
const PRESALE_SOL_WALLET = 'HAEC8fjg9Wpg1wpL8j5EQFRmrq4dj8BqYQVKgZZdKmRM'; // ⚠️ TESTNET: same address, just switch Phantom to Devnet
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

// Retrieve or create the dApp encryption keypair (stored in localStorage so it survives new tabs)
async function getDappKeypair() {
  const nacl = (await import('tweetnacl')).default;
  const stored = localStorage.getItem('_kleo_dapp_kp');
  if (stored) {
    try {
      const { pk, sk } = JSON.parse(stored);
      return { publicKey: new Uint8Array(pk), secretKey: new Uint8Array(sk) };
    } catch {}
  }
  const kp = nacl.box.keyPair();
  localStorage.setItem('_kleo_dapp_kp', JSON.stringify({
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



// ── Mobile detection ──────────────────────────────────────────────────────
// isMobile removed — deeplink used on all platforms
function isAndroid() { return /Android/i.test(navigator.userAgent); }
function isIOS()    { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }
function isInEvmBrowser() {
  // Returns wallet name if we're inside an EVM wallet's in-app browser
  const eth = (window as any).ethereum;
  if (!eth) return null;
  if (eth.isMetaMask)  return 'MetaMask';
  if (eth.isTrust)     return 'Trust Wallet';
  if (eth.isCoinbaseWallet) return 'Coinbase Wallet';
  if (eth.isRainbow)   return 'Rainbow';
  if (eth.isBraveWallet) return 'Brave Wallet';
  return 'Wallet'; // generic injected
}

// EVM wallet in-app browser URL builders
const EVM_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    color: 'text-orange-400',
    openUrl: (url: string) => {
      const clean = url.replace(/^https?:\/\//, '');
      window.location.href = `https://metamask.app.link/dapp/${clean}`;
    },
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🛡️',
    color: 'text-blue-400',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      if (isAndroid()) window.location.href = `trust://open_url?coin_id=60&url=${enc}`;
      else window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${enc}`;
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    color: 'text-blue-500',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      window.location.href = `https://go.cb-wallet.com/dapp?url=${enc}`;
    },
  },
];

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
    unisat?: { requestAccounts: () => Promise<string[]>; sendBitcoin: (to: string, sat: number) => Promise<string> };
    // MetaMask native Bitcoin (injected as window.bitcoin when on Bitcoin network)
    bitcoin?: { requestAccounts: () => Promise<{ address: string; addressType: string; publicKey: string; purpose: string }[]>; sendBitcoin: (to: string, satoshis: number, opts?: { feeRate?: number }) => Promise<string> };
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
  if ((window as any).unisat) list.push({
    id: 'unisat', name: 'Unisat', icon: '🟠', color: 'text-orange-400',
    connect: async (): Promise<string> => {
      const accs = await (window as any).unisat.requestAccounts();
      return accs[0] ?? '';
    },
    sendBtc: async (to, sat) => (window as any).unisat.sendBitcoin(to, sat),
  });

  return list;
}

// ── Price data ────────────────────────────────────────────────────────────
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana', BTC: 'bitcoin',
  USDC: 'usd-coin', USDT: 'tether',
};

// ERC-20 token contracts (⚠️ TESTNET — swap for mainnet at launch)
// Mainnet: USDC=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48  USDT=0xdAC17F958D2ee523a2206206994597C13D831ec7
const TOKEN_CONTRACTS: Record<string, { address: string; decimals: number; chainId: number }> = {
  USDC: { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, chainId: sepolia.id },   // Sepolia USDC
  USDT: { address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', decimals: 18, chainId: bscTestnet.id }, // BSC Testnet USDT
};

// Encode ERC-20 transfer(address,uint256) calldata — no ethers needed
function encodeERC20Transfer(to: string, amount: bigint): string {
  const selector = 'a9059cbb'; // transfer(address,uint256)
  const paddedTo = to.replace('0x', '').toLowerCase().padStart(64, '0');
  const paddedAmt = amount.toString(16).padStart(64, '0');
  return `0x${selector}${paddedTo}${paddedAmt}`;
}

const CURRENCIES = [
  { id: 'SOL',  label: 'Solana',   symbol: 'SOL',  icon: '◎', color: 'text-purple-400', chain: 'sol' },
  { id: 'ETH',  label: 'Ethereum', symbol: 'ETH',  icon: 'Ξ', color: 'text-blue-400',   chain: 'evm', chainId: sepolia.id },
  { id: 'BNB',  label: 'BNB',      symbol: 'BNB',  icon: '◆', color: 'text-yellow-400', chain: 'evm', chainId: bscTestnet.id },
  { id: 'USDC', label: 'USDC',     symbol: 'USDC', icon: '$', color: 'text-green-400',  chain: 'evm', chainId: sepolia.id,    token: 'USDC' },
  { id: 'USDT', label: 'USDT',     symbol: 'USDT', icon: '₮', color: 'text-teal-400',   chain: 'evm', chainId: bscTestnet.id, token: 'USDT' },
  { id: 'BTC',  label: 'Bitcoin',  symbol: 'BTC',  icon: '₿', color: 'text-orange-400', chain: 'btc' },
];

const BTC_BROWSER_WALLETS = [
  {
    id: 'phantom', name: 'Phantom', icon: '👻',
    desc: 'BTC · SOL · ETH · NFTs',
    openUrl: (url: string) => {
      const encoded = encodeURIComponent(url);
      const ref = encodeURIComponent(new URL(url).origin);
      if (/Android/i.test(navigator.userAgent))
        window.location.href = `intent://browse/${encoded}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=https%3A%2F%2Fphantom.app%2F;end`;
      else window.location.href = `https://phantom.app/ul/browse/${encoded}?ref=${ref}`;
    },
  },
  {
    id: 'xverse', name: 'Xverse', icon: '✦',
    desc: 'BTC · Ordinals · Runes',
    openUrl: (url: string) => {
      const encoded = encodeURIComponent(url);
      if (/Android/i.test(navigator.userAgent))
        window.location.href = `intent://browser?url=${encoded}#Intent;scheme=xverse;package=com.secretkeylabs.xverse;S.browser_fallback_url=https%3A%2F%2Fwww.xverse.app%2F;end`;
      else window.location.href = `https://www.xverse.app/browser?url=${encoded}`;
    },
  },
  {
    id: 'okx', name: 'OKX Wallet', icon: '⭕',
    desc: 'BTC · ETH · BNB · SOL · 100+ chains',
    openUrl: (url: string) => {
      const encoded = encodeURIComponent(url);
      if (/Android/i.test(navigator.userAgent))
        window.location.href = `intent://browser?url=${encoded}#Intent;scheme=okex;package=com.okinc.okex.gp;S.browser_fallback_url=https%3A%2F%2Fwww.okx.com%2Fweb3;end`;
      else window.location.href = `okx://wallet/dapp/url?dappUrl=${encoded}`;
    },
  },
  {
    id: 'unisat', name: 'Unisat', icon: '🟠',
    desc: 'BTC · Ordinals · BRC-20',
    openUrl: (url: string) => {
      const encoded = encodeURIComponent(url);
      window.location.href = `unisat://browser?url=${encoded}`;
      setTimeout(() => window.open('https://unisat.io', '_blank'), 1500);
    },
  },
  {
    id: 'metamask', name: 'MetaMask', icon: '🦊',
    desc: 'BTC · ETH · BNB · 100+ chains',
    openUrl: (url: string) => {
      const clean = url.replace(/^https?:\/\//, '');
      window.location.href = `https://metamask.app.link/dapp/${clean}`;
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════
export function BuySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  const { totalRaised, addRaised, addPurchase } = usePresaleStore();
  const {
    solAddress, btcAddress, solWalletName, btcWalletName,
    setSolWallet, setBtcWallet, disconnectSol, disconnectBtc,
  } = useWalletStore();
  const currentStage = getCurrentStage(totalRaised);

  // EVM (wagmi)
  const { address, isConnected, connector } = useAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
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
  const [liveRates,     setLiveRates]    = useState<Record<string,number>>({ ETH: 3200, BNB: 580, SOL: 170, BTC: 65000, USDC: 1, USDT: 1 });
  const [priceLoading,  setPriceLoading] = useState(false);
  const [priceError,    setPriceError]   = useState(false);

  // SOL/BTC connection booleans
  const solConnected = !!solAddress;
  const btcConnected = !!btcAddress;
  const solAddr      = solAddress;
  const btcAddr      = btcAddress;

  const handleDisconnectSol = () => {
    disconnectSol();
    setActiveWallet(null);
    reset();
  };

  const handleDisconnectBtc = () => {
    localStorage.removeItem('_kleo_btc_address');
    localStorage.removeItem('_kleo_btc_wallet_name');
    disconnectBtc();
    setActiveWallet(null);
    reset();
  };

  // EVM injected state (used when inside a wallet browser, supplements wagmi)
  const [evmInjectedAddr,   setEvmInjectedAddr]  = useState<string>('');
  const [evmInjectedName,   setEvmInjectedName]  = useState<string>('');
  const [showEvmPicker,     setShowEvmPicker]    = useState(false);

  // Picker modals
  const [showInjectedPicker, setShowInjectedPicker] = useState(false);
  const [injectedWallets,    setInjectedWallets]    = useState<DetectedWallet[]>([]);
  const [pickerType,         setPickerType]         = useState<'sol'|'btc'>('sol');
  const [activeWallet,       setActiveWallet]       = useState<DetectedWallet | null>(null);

  // BTC mobile picker modal
  const [showBtcPicker,  setShowBtcPicker]  = useState(false);
  const [showXversePay,  setShowXversePay]  = useState(false);
  const [showSolPay,     setShowSolPay]     = useState(false);

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

      // Always clean the URL after a Phantom redirect (strip query params + hash)
      if (phantomPubKey || errorCode || params.get('errorMessage')) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      // ── Phantom returned an error ────────────────────────────────────────
      if (errorCode) {
        const msg = params.get('errorMessage') || '';
        const isPending = !!localStorage.getItem('_kleo_pending_purchase');
        if (isPending) {
          localStorage.removeItem('_kleo_pending_purchase');
          // Map Phantom error codes to human-readable messages
          const errMap: Record<string, string> = {
            '4001': 'Transaction rejected — nothing was sent.',
            '4100': 'Session expired or cluster mismatch — disconnect and reconnect Phantom (ensure it is set to Devnet).',
            '4900': 'Phantom disconnected from network — check your Phantom network settings.',
          };
          const friendly = errMap[errorCode] || `Phantom error ${errorCode}${msg ? ': ' + msg : ''} — please try again.`;
          setTxError(friendly);
          setTxStatus('error');
        }
        // If it was a connect error (no pending purchase), just silently ignore
        return;
      }

      if (phantomPubKey && data && nonce) {
        try {
          const payload = await decryptPhantomPayload(phantomPubKey, data, nonce);

          if (payload.public_key) {
            // ── CONNECT CALLBACK ──────────────────────────────────────────
            localStorage.setItem('_kleo_phantom_session', payload.session);
            localStorage.setItem('_kleo_phantom_pubkey', phantomPubKey);
            localStorage.setItem('_kleo_sol_address', payload.public_key);
            setSolWallet(payload.public_key, 'Phantom');
                    setCurrency('SOL');

          } else if (payload.signature) {
            // ── TRANSACTION CALLBACK ──────────────────────────────────────
            const pendingStr = localStorage.getItem('_kleo_pending_purchase');
            if (pendingStr) {
              localStorage.removeItem('_kleo_pending_purchase');
              const { usd, tokens, addr, method } = JSON.parse(pendingStr);
              await recordPurchase(payload.signature, usd, tokens, addr, method);
              setTxHash(payload.signature);
              setTxStatus('success');
            }
          } else {
            // Unexpected payload — show raw info for debugging
            const isPending = !!localStorage.getItem('_kleo_pending_purchase');
            if (isPending) {
              setTxError(`Phantom returned an unexpected response. Keys: ${Object.keys(payload).join(', ')}. Please try again.`);
              setTxStatus('error');
            }
          }
        } catch (e) {
          console.error('Phantom callback error:', e);
          const isPending = !!localStorage.getItem('_kleo_pending_purchase');
          if (isPending) {
            setTxError(`Failed to process Phantom response: ${e instanceof Error ? e.message : String(e)}`);
            setTxStatus('error');
          }
        }
      }

      // ── Restore previous deeplink session from localStorage ─────────────
      // Handles case where user connected in a prior visit / tab
      const storedAddr  = localStorage.getItem('_kleo_sol_address');
      const storedSess  = localStorage.getItem('_kleo_phantom_session');
      const storedPubk  = localStorage.getItem('_kleo_phantom_pubkey');
      if (storedAddr && storedSess && storedPubk && !params.get('phantom_encryption_public_key')) {
        setSolWallet(storedAddr, 'Phantom');
          }

      // ── Detect which wallet browser we're inside ────────────────────────
      // Network isolation: only auto-connect the wallet type for this browser.
      // MetaMask browser → EVM only (BTC connect happens on-demand via window.bitcoin)
      // Phantom browser  → SOL + BTC both available
      // Xverse browser   → BTC only
      const ethProvider = (window as any).ethereum;
      const evmBrowserName = isInEvmBrowser();

      // ── BTC: restore saved address (no auto-connect — wait for user to tap BTC tab) ─
      const savedBtcAddr = localStorage.getItem('_kleo_btc_address');
      const savedBtcName = localStorage.getItem('_kleo_btc_wallet_name');
      if (savedBtcAddr && savedBtcName) {
        setBtcWallet(savedBtcAddr, savedBtcName);
        // Restore active wallet object for sends
        const btcWallets = detectBitcoinWallets();
        const w = btcWallets.find(w => w.name === savedBtcName) ?? btcWallets[0];
        if (w) setActiveWallet(w);
      }

      // ── EVM: auto-connect if inside an EVM wallet browser ────────────────
      if (evmBrowserName && ethProvider) {
        try {
          const accounts: string[] = await ethProvider.request({ method: 'eth_requestAccounts' });
          if (accounts[0]) {
            setEvmInjectedAddr(accounts[0]);
            setEvmInjectedName(evmBrowserName);
          }
        } catch {}
      }

      // ── Auto-detect + auto-connect Solana injected wallets ─────────────
      // Covers: Phantom in-app browser, Solflare browser, desktop extension
      const phantom = window.phantom?.solana || window.solana;
      if (phantom) {
        if (phantom.isConnected && phantom.publicKey) {
          // Already authorized — restore connection silently
          const addr = phantom.publicKey.toString();
          const walletName = (window.phantom?.solana) ? 'Phantom' : 'Solflare';
          setSolWallet(addr, walletName);
          // Re-create the activeWallet entry so sendSol works
          const injected = detectSolanaWallets();
          const w = injected.find(w => w.id === 'phantom' || w.id === 'solflare');
          if (w) setActiveWallet(w);
        } else if (!phantom.isConnected) {
          // Inside wallet browser but not yet connected — auto-prompt connect
          phantom.connect()
            .then((resp: { publicKey: { toString: () => string } }) => {
              const addr = resp.publicKey.toString();
              setSolWallet(addr, 'Phantom');
              const injected = detectSolanaWallets();
              const w = injected.find(w => w.id === 'phantom' || w.id === 'solflare');
              if (w) setActiveWallet(w);
            })
            .catch(() => {
              // onlyIfTrusted: true — silently fails if not previously approved
              // User will need to tap Connect Wallet to trigger the approval dialog
            });
        }
      }

      // Phantom Bitcoin
      const phantomBtc = window.phantom?.bitcoin;
      if (phantomBtc) {
        phantomBtc.requestAccounts().then(accs => {
          const addr = accs?.find((a: any) => a.purpose === 'payment')?.address ?? accs?.[0]?.address;
          if (addr) {
            localStorage.setItem('_kleo_btc_address', addr);
            localStorage.setItem('_kleo_btc_wallet_name', 'Phantom');
            setBtcWallet(addr, 'Phantom');
          }
        }).catch(() => {});
      }

      // Xverse — provider is injected asynchronously, poll for up to 3 seconds
      if (!savedBtcAddr) {
        const tryXverseConnect = (attemptsLeft: number) => {
          // Xverse injects under several possible names depending on version
          const xProv = (window as any).XverseProviders?.BitcoinProvider
                     ?? (window as any).BitcoinProvider
                     ?? (window as any).xverse?.bitcoin;
          if (xProv) {
            xProv.request('getAccounts', { purposes: ['payment', 'ordinals'] })
              .then((r: any) => {
                // Xverse response: { result: { addresses: [{address, purpose}] } }
                // or: { addresses: [...] } depending on version
                const addresses = r?.result?.addresses ?? r?.addresses ?? [];
                const paymentAddr = addresses.find((a: any) =>
                  a.purpose === 'payment' || a.addressType === 'p2wpkh' || a.addressType === 'p2sh'
                )?.address ?? addresses[0]?.address;
                if (paymentAddr) {
                  localStorage.setItem('_kleo_btc_address', paymentAddr);
                  localStorage.setItem('_kleo_btc_wallet_name', 'Xverse');
                  setBtcWallet(paymentAddr, 'Xverse');
                  setCurrency('BTC');
                }
              }).catch(() => {});
          } else if (attemptsLeft > 0) {
            // Provider not ready yet — retry after 500ms
            setTimeout(() => tryXverseConnect(attemptsLeft - 1), 500);
          }
        };
        tryXverseConnect(6); // poll up to 3 seconds (6 × 500ms)
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
    // Stablecoins: amount = USD value directly. Others: multiply by live rate.
    const isStable = currency === 'USDC' || currency === 'USDT';
    setUsdEst(!n || n <= 0 ? 0 : isStable ? n : n * (liveRates[currency] || 1));
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

  // ── Connect EVM wallet ─────────────────────────────────────────────────
  const connectEvm = async () => {
    const evmBrowserName = isInEvmBrowser();
    if (evmBrowserName) {
      // Already inside an EVM wallet browser — connect EVM directly
      try {
        const eth = (window as any).ethereum;
        // Switch to the correct EVM chain for selected currency before connecting
        const targetId = (selected as any).chainId as number | undefined;
        if (targetId) {
          const chainHex = await eth.request({ method: 'eth_chainId' });
          if (parseInt(chainHex, 16) !== targetId) {
            await eth.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${targetId.toString(16)}` }],
            }).catch(() => {});
            await new Promise<void>(r => setTimeout(r, 500));
          }
        }
        const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
        if (accounts[0]) { setEvmInjectedAddr(accounts[0]); setEvmInjectedName(evmBrowserName); }
      } catch (e: any) { setTxError(e.message || 'Connection rejected'); setTxStatus('error'); }
      return;
    }
    // External browser — show wallet picker to open in-app browser
    setShowEvmPicker(true);
  };

  const disconnectEvmInjected = () => {
    setEvmInjectedAddr(''); setEvmInjectedName('');
  };

  // ── Connect SOL wallet ─────────────────────────────────────────────────
  const connectSol = async () => {
    const injected = detectSolanaWallets();
    if (injected.length > 0) {
      // Already inside Phantom/Solflare browser OR desktop extension — connect directly
      if (injected.length === 1) {
        const addr = await injected[0].connect();
        setSolWallet(addr, injected[0].name); setActiveWallet(injected[0]);
      } else {
        setInjectedWallets(injected); setPickerType('sol'); setShowInjectedPicker(true);
      }
      return;
    }
    // No injected wallet — open Phantom's in-app browser pointing at this page.
    // This is how NFT sites (Magic Eden, Tensor) handle mobile: the page loads
    // INSIDE Phantom where window.phantom.solana is injected, enabling direct
    // connect() + signAndSendTransaction() without any deeplink workarounds.
    const url = encodeURIComponent(window.location.href);
    const ref = encodeURIComponent(window.location.origin);
    if (isAndroid()) {
      window.location.href = `intent://browse/${url}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=https%3A%2F%2Fphantom.app%2F;end`;
    } else if (isIOS()) {
      window.location.href = `https://phantom.app/ul/browse/${url}?ref=${ref}`;
    } else {
      // Desktop: try phantom:// custom protocol
      window.location.href = `phantom://browse/${url}?ref=${ref}`;
    }
  };

  // ── Connect BTC wallet ─────────────────────────────────────────────────
  const connectBtc = async () => {
    const injected = detectBitcoinWallets();

    // MetaMask: prefer window.bitcoin over window.ethereum for BTC tab
    // window.bitcoin is the Bitcoin Snap API — works independently of EVM network
    const mmBtc = injected.find(w => w.id === 'metamask-btc');
    if (mmBtc) {
      try {
        const addr = await mmBtc.connect();
        if (addr) {
          localStorage.setItem('_kleo_btc_address', addr);
          localStorage.setItem('_kleo_btc_wallet_name', 'MetaMask');
          setBtcWallet(addr, 'MetaMask');
          setActiveWallet(mmBtc);
        }
      } catch (e: any) {
        setTxError(e?.message || 'MetaMask BTC connection failed'); setTxStatus('error');
      }
      return;
    }

    if (injected.length > 0) {
      // Inside Phantom/Xverse/OKX/Unisat browser — connect directly
      if (injected.length === 1) {
        injected[0].connect().then(addr => {
          if (addr) {
            localStorage.setItem('_kleo_btc_address', addr);
            localStorage.setItem('_kleo_btc_wallet_name', injected[0].name);
            setBtcWallet(addr, injected[0].name);
            setActiveWallet(injected[0]);
          }
        }).catch(() => {});
      } else {
        setInjectedWallets(injected); setPickerType('btc'); setShowInjectedPicker(true);
      }
      return;
    }
    // External browser — show wallet picker to open in-app browser
    setShowBtcPicker(true);
  };

  const connectInjected = async (wallet: DetectedWallet, type: 'sol' | 'btc') => {
    setShowInjectedPicker(false);
    try {
      const addr = await wallet.connect();
      if (!addr) return;
      if (type === 'sol') {
        setSolWallet(addr, wallet.name);
      } else {
        // Persist BTC address so it survives switching back from in-app browser to Chrome
        localStorage.setItem('_kleo_btc_address', addr);
        localStorage.setItem('_kleo_btc_wallet_name', wallet.name);
        setBtcWallet(addr, wallet.name);
      }
      setActiveWallet(wallet);
    } catch {}
  };

  // ── Send SOL via Solana Pay URI (industry standard for mobile) ──────────
  // Solana Pay = same concept as bitcoin: URI — universally supported by Phantom, Solflare etc.
  const sendSolViaSolanaPay = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    const label   = encodeURIComponent('Kaleo Presale');
    const message = encodeURIComponent(`Buy KLEO tokens — Stage ${currentStage.stage}`);
    const memo    = encodeURIComponent(`kleo-s${currentStage.stage}-${solAddr.slice(0,8)}`);
    // SPL-compliant Solana Pay URI — Phantom, Solflare, Backpack all handle this natively
    const solanaPayUri = `solana:${PRESALE_SOL_WALLET}?amount=${n}&label=${label}&message=${message}&memo=${memo}`;

    // Store purchase context so we can record it after user pastes tx hash
    localStorage.setItem('_kleo_pending_sol_purchase', JSON.stringify({
      usd: usdEst, tokens: tokensEst, addr: solAddr, method: 'SOL', amount: n
    }));

    window.location.href = solanaPayUri;
    // After 1.5s if still here (no wallet handled it), show manual confirmation modal
    setTimeout(() => { setTxStatus('idle'); setShowSolPay(true); }, 1500);
  };

  // Injected wallet send (desktop extension / in-app browser)
  const sendSol = async (): Promise<string> => {
    if (!activeWallet?.sendSol) throw new Error('Connect a Solana wallet first');
    const { Connection, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
    const conn = new Connection('https://api.devnet.solana.com', 'confirmed'); // ⚠️ TESTNET
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
        if (activeWallet?.sendBtc) {
          // Injected wallet (Phantom/Xverse browser) — direct approval, no paste needed
          hash = await sendBtc();
          await recordPurchase(hash, usdEst, tokensEst, btcAddr, 'BTC');
        } else {
          // No injected send API — fall back to bitcoin: URI
          const label = encodeURIComponent('Kaleo Presale');
          const msg   = encodeURIComponent(`Buy KLEO tokens - Stage ${currentStage.stage}`);
          const uri   = `bitcoin:${PRESALE_BTC_WALLET}?amount=${parseFloat(amount).toFixed(8)}&label=${label}&message=${msg}`;
          window.location.href = uri;
          setTimeout(() => { setTxStatus('idle'); setShowXversePay(true); }, 1500);
          return;
        }
      } else if (!isEvm) {
        if (!solConnected) throw new Error('Connect Solana wallet first');
        if (activeWallet?.sendSol) {
          // Injected wallet available (Phantom/Solflare browser or desktop extension)
          // — same flow as Magic Eden/Tensor: direct signAndSendTransaction
          hash = await sendSol();
          if (hash) await recordPurchase(hash, usdEst, tokensEst, solAddr, 'SOL');
        } else {
          // No injected wallet — use Solana Pay URI as fallback
          // (shows manual confirmation modal to paste tx signature)
          sendSolViaSolanaPay();
          return;
        }
      } else {
        if (!address) throw new Error('Connect wallet first');
        const senderAddress = address;
        const targetChainId = selected.chainId!;
        const tokenKey = (selected as any).token as string | undefined;
        const tokenInfo = tokenKey ? TOKEN_CONTRACTS[tokenKey] : undefined;
        const ethProvider = (window as any).ethereum;

        // Helper: switch chain via injected provider
        const switchToChain = async (chainId: number) => {
          const chainHex = await ethProvider.request({ method: 'eth_chainId' });
          if (parseInt(chainHex, 16) !== chainId) {
            try {
              await ethProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${chainId.toString(16)}` }] });
            } catch (e: any) {
              if (e.code === 4902) {
                const chainData = chainId === 97
                  ? { chainId: '0x61', chainName: 'BSC Testnet', nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 }, rpcUrls: ['https://bsc-testnet-rpc.publicnode.com'], blockExplorerUrls: ['https://testnet.bscscan.com'] }
                  : { chainId: '0xaa36a7', chainName: 'Sepolia', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'], blockExplorerUrls: ['https://sepolia.etherscan.io'] };
                await ethProvider.request({ method: 'wallet_addEthereumChain', params: [chainData] });
              } else throw e;
            }
            await new Promise<void>(resolve => setTimeout(resolve, 600));
          }
        };

        if (ethProvider) {
          await switchToChain(targetChainId);

          if (tokenInfo) {
            // ── ERC-20 token transfer (USDC / USDT) ──────────────────────
            // Amount in token units (USDC=6 decimals, USDT=18 decimals)
            const tokenAmount = BigInt(Math.round(usdEst * 10 ** tokenInfo.decimals));
            const data = encodeERC20Transfer(PRESALE_ETH_WALLET, tokenAmount);
            hash = await ethProvider.request({
              method: 'eth_sendTransaction',
              params: [{ from: senderAddress, to: tokenInfo.address, data, value: '0x0' }],
            });
          } else {
            // ── Native coin transfer (ETH / BNB) ──────────────────────────
            hash = await ethProvider.request({
              method: 'eth_sendTransaction',
              params: [{ from: senderAddress, to: PRESALE_ETH_WALLET, value: `0x${BigInt(parseEther(amount)).toString(16)}` }],
            });
          }
        } else {
          // Desktop / WalletConnect fallback (native only)
          await switchChainAsync({ chainId: targetChainId });
          await new Promise<void>(resolve => setTimeout(resolve, 800));
          hash = await sendTransactionAsync({ to: PRESALE_ETH_WALLET, value: parseEther(amount) });
        }
        await recordPurchase(hash, usdEst, tokensEst, senderAddress, selected.id);
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
    : selected.chainId === bscTestnet.id ? `https://bscscan.com/tx/${txHash}`
    : `https://etherscan.io/tx/${txHash}`
    : null;

  const reset = () => { setTxStatus('idle'); setTxHash(''); setTxError(''); setAmount(''); };
  const presets: Record<string, number[]> = {
    SOL: [0.5, 1, 2, 5], ETH: [0.01, 0.05, 0.1, 0.5],
    BNB: [0.05, 0.2, 0.5, 1], BTC: [0.0005, 0.001, 0.005, 0.01],
  };
  const evmConnected = isConnected || !!evmInjectedAddr;
  const walletReady = isBtc ? btcConnected : isEvm ? evmConnected : solConnected;

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
                <button key={c.id} onClick={() => {
                    setCurrency(c.id);
                    reset();
                    // Network isolation: clear cross-chain state when switching tabs
                    if (c.chain === 'btc') {
                      // Switching to BTC — suppress EVM injected so it doesn't intercept
                      setEvmInjectedAddr(''); setEvmInjectedName('');
                    } else if (c.chain === 'sol') {
                      // Switching to SOL — clear BTC active wallet
                      setActiveWallet(null);
                    }
                    // Note: we don't clear addresses from store — just suppress for this session
                  }}
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
                evmInjectedAddr ? (
                  /* Connected via in-app browser injection */
                  <div className="flex items-center justify-between bg-[#2BFFF1]/5 border border-[#2BFFF1]/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">{evmInjectedAddr.slice(0,6)}...{evmInjectedAddr.slice(-4)}</span>
                      <span className="text-[#2BFFF1] text-xs font-semibold">{evmInjectedName} ✓</span>
                    </div>
                    <button onClick={disconnectEvmInjected}
                      className="text-[#A7B0B7] hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                      Disconnect
                    </button>
                  </div>
                ) : isConnected && address ? (
                  /* Connected via WalletConnect (desktop fallback) */
                  <div className="flex items-center justify-between bg-[#2BFFF1]/5 border border-[#2BFFF1]/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">{address.slice(0,6)}...{address.slice(-4)}</span>
                      {connector?.name && (
                        <span className="text-[#2BFFF1] text-xs font-semibold">{connector.name} ✓</span>
                      )}
                    </div>
                    <button onClick={() => evmDisconnect()}
                      className="text-[#A7B0B7] hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  /* Not connected — show wallet picker */
                  <button onClick={connectEvm}
                    className="w-full flex items-center justify-center gap-3 bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 hover:border-[#2BFFF1]/60 hover:bg-[#2BFFF1]/15 rounded-xl px-4 py-3.5 transition-all">
                    <span className="text-xl">👛</span>
                    <div className="text-left">
                      <p className="text-[#F4F6FA] font-semibold text-sm">Connect {selected.label} Wallet</p>
                      <p className="text-[#A7B0B7] text-xs">MetaMask · Trust · Coinbase</p>
                    </div>
                  </button>
                )
              ) : isBtc ? (
                btcConnected ? (
                  <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">{btcAddr.slice(0,8)}...{btcAddr.slice(-6)}</span>
                      <span className="text-orange-400 text-xs font-medium">{btcWalletName} ✓</span>
                    </div>
                    <button onClick={handleDisconnectBtc}
                      className="text-[#A7B0B7] hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                      Disconnect
                    </button>
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
                      <span className="text-purple-300 text-xs font-medium">{solWalletName} ✓</span>
                    </div>
                    <button onClick={handleDisconnectSol}
                      className="text-[#A7B0B7] hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                      Disconnect
                    </button>
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
            {txStatus === 'pending' && txError && (
              <div className="mb-5 p-4 rounded-xl border border-[#2BFFF1]/30 bg-[#2BFFF1]/5 flex gap-3">
                <div className="w-5 h-5 shrink-0 mt-0.5 border-2 border-[#2BFFF1] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#2BFFF1] text-sm font-medium">{txError}</p>
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
                  {(txStatus as string) === 'pending'
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
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,380px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#F4F6FA] font-bold text-lg">Connect Bitcoin Wallet</h3>
              <button onClick={() => setShowBtcPicker(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <p className="text-[#A7B0B7] text-xs mb-5 leading-relaxed">
              Select your wallet — it will open this site in its browser where it can sign and approve Bitcoin transactions directly.
            </p>
            <div className="flex flex-col gap-3">
              {BTC_BROWSER_WALLETS.map(w => (
                <button key={w.id}
                  onClick={() => { setShowBtcPicker(false); w.openUrl(window.location.href); }}
                  className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/30 rounded-xl px-4 py-3.5 transition-all text-left">
                  <span className="text-3xl leading-none">{w.icon}</span>
                  <div>
                    <p className="text-[#F4F6FA] font-semibold text-sm">{w.name}</p>
                    <p className="text-[#A7B0B7] text-xs">{w.desc}</p>
                  </div>
                  <span className="ml-auto text-[#A7B0B7] text-lg">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── XVERSE / BTC PAYMENT MODAL ── */}
      {/* ── EVM WALLET PICKER MODAL ── */}
      {showEvmPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowEvmPicker(false)}>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,380px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#F4F6FA] font-bold text-lg">Choose Wallet</h3>
              <button onClick={() => setShowEvmPicker(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <p className="text-[#A7B0B7] text-xs mb-5 leading-relaxed">
              Your chosen wallet will open this site in its browser, where it can connect and approve transactions directly.
            </p>
            <div className="flex flex-col gap-3">
              {EVM_WALLETS.map(w => (
                <button key={w.id}
                  onClick={() => { setShowEvmPicker(false); w.openUrl(window.location.href); }}
                  className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#2BFFF1]/30 rounded-xl px-4 py-3.5 transition-all text-left">
                  <span className="text-3xl leading-none">{w.icon}</span>
                  <div>
                    <p className="text-[#F4F6FA] font-semibold text-sm">{w.name}</p>
                    <p className="text-[#A7B0B7] text-xs">Opens in {w.name} browser</p>
                  </div>
                  <span className="ml-auto text-[#A7B0B7] text-lg">›</span>
                </button>
              ))}
            </div>
            <p className="text-[#A7B0B7] text-xs text-center mt-5">
              Don't have a wallet? <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-[#2BFFF1] hover:underline">Download MetaMask</a>
            </p>
          </div>
        </div>
      )}

      {/* ── SOLANA PAY CONFIRMATION MODAL ── */}
      {showSolPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSolPay(false)}>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,380px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">◎</span>
                <h3 className="text-[#F4F6FA] font-bold text-lg">Confirm SOL Payment</h3>
              </div>
              <button onClick={() => setShowSolPay(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <p className="text-[#A7B0B7] text-xs mb-5 leading-relaxed">
              Open Phantom (or any Solana wallet), send the exact amount below to our address, then paste your transaction signature here.
            </p>
            <div className="mb-4">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-2">Step 1 — Copy our SOL address</p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-[#F4F6FA] text-xs font-mono flex-1 truncate">{PRESALE_SOL_WALLET}</span>
                <button onClick={() => { navigator.clipboard.writeText(PRESALE_SOL_WALLET); setManualBtcCopied(true); setTimeout(() => setManualBtcCopied(false), 2000); }}
                  className="text-xs text-[#2BFFF1] hover:text-white font-semibold shrink-0">
                  {manualBtcCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-1">Step 2 — Send exact amount</p>
              <div className="flex items-baseline gap-2">
                <span className="text-purple-400 font-bold text-2xl">{amount || '0'}</span>
                <span className="text-purple-400 font-semibold">SOL</span>
                {usdEst > 0 && <span className="text-[#A7B0B7] text-xs ml-auto">≈ ${usdEst.toFixed(2)}</span>}
              </div>
              <p className="text-[#A7B0B7] text-xs mt-1">Network: Devnet (testnet)</p>
            </div>
            <div className="mb-5">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-2">Step 3 — Paste transaction signature</p>
              <input type="text" value={manualBtcTxHash} onChange={e => setManualBtcTxHash(e.target.value)}
                placeholder="e.g. 5UfDuX3..."
                className="w-full bg-white/5 border border-white/10 focus:border-[#2BFFF1]/50 rounded-xl px-4 py-3 text-[#F4F6FA] text-xs font-mono outline-none transition-colors placeholder:text-[#A7B0B7]/40" />
            </div>
            <button
              onClick={async () => {
                const sig = manualBtcTxHash.trim();
                if (sig.length < 60) return;
                setManualBtcSubmitting(true);
                try {
                  const pending = localStorage.getItem('_kleo_pending_sol_purchase');
                  const { usd, tokens, addr } = pending ? JSON.parse(pending) : { usd: usdEst, tokens: tokensEst, addr: solAddr };
                  localStorage.removeItem('_kleo_pending_sol_purchase');
                  await recordPurchase(sig, usd, tokens, addr, 'SOL');
                  setShowSolPay(false); setManualBtcTxHash('');
                  setTxHash(sig); setTxStatus('success');
                } catch {
                  setTxError('Failed to record — contact support with your tx signature.');
                  setTxStatus('error');
                } finally { setManualBtcSubmitting(false); }
              }}
              disabled={manualBtcTxHash.trim().length < 60 || manualBtcSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-[#A7B0B7] text-white font-bold py-4 rounded-xl transition-all">
              {manualBtcSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
            <p className="text-[#A7B0B7] text-xs text-center mt-4">
              Your KLEO tokens will be reserved once we verify the transaction on-chain.
            </p>
          </div>
        </div>
      )}

      {showXversePay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowXversePay(false)}>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,380px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">₿</span>
                <h3 className="text-[#F4F6FA] font-bold text-lg">Pay with Bitcoin</h3>
              </div>
              <button onClick={() => setShowXversePay(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <p className="text-[#A7B0B7] text-xs mb-5 leading-relaxed">
              Open Xverse (or any Bitcoin wallet), send the exact amount below to our address, then paste your transaction ID here.
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
            <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-1">Step 2 — Send exact amount</p>
              <div className="flex items-baseline gap-2">
                <span className="text-blue-400 font-bold text-2xl">{amount ? parseFloat(amount).toFixed(8) : '0.00000000'}</span>
                <span className="text-blue-400 font-semibold">BTC</span>
                {usdEst > 0 && <span className="text-[#A7B0B7] text-xs ml-auto">≈ ${usdEst.toFixed(2)}</span>}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-[#A7B0B7] text-xs font-semibold uppercase tracking-wider mb-2">Step 3 — Paste transaction ID</p>
              <input type="text" value={manualBtcTxHash} onChange={e => setManualBtcTxHash(e.target.value)}
                placeholder="e.g. 3a1b2c3d4e5f..."
                className="w-full bg-white/5 border border-white/10 focus:border-[#2BFFF1]/50 rounded-xl px-4 py-3 text-[#F4F6FA] text-xs font-mono outline-none transition-colors placeholder:text-[#A7B0B7]/40" />
            </div>
            <button onClick={handleManualBtcSubmit}
              disabled={manualBtcTxHash.trim().length < 60 || manualBtcSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-[#A7B0B7] text-white font-bold py-4 rounded-xl transition-all">
              {manualBtcSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
            <p className="text-[#A7B0B7] text-xs text-center mt-4">
              Your KLEO tokens will be reserved once we verify the transaction on-chain.
            </p>
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
