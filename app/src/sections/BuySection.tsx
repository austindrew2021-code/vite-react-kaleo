import React, { useEffect, useRef, useState, useCallback } from 'react';
// Buffer is injected automatically by @rollup/plugin-inject via vite.config.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, CreditCard, TrendingUp,
  ExternalLink, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useSendTransaction, useDisconnect, useSwitchChain, useWriteContract, useConnect, useChainId, useConnections } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseEther } from 'viem';
import { sepolia, bscTestnet, arbitrumSepolia, baseSepolia, polygonAmoy } from 'wagmi/chains';
import { usePresaleStore, getCurrentStage, LISTING_PRICE_USD, useWalletStore } from '../store/presaleStore';
import { BtcDiagnostic } from '../components/BtcDiagnostic';
import { SolWalletPicker } from '../components/SolWalletPicker';

gsap.registerPlugin(ScrollTrigger);

const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = _sbUrl && _sbKey ? createClient(_sbUrl, _sbKey) : null;

// ── Receiving wallet addresses ────────────────────────────────────────────
// ⚠️ TESTNET — swap back to mainnet address before going live
const PRESALE_ETH_WALLET = '0x0722Ef1DCfa7849B3BF0DB375793bFAcc52b8e39' as `0x${string}`; // mainnet ETH presale wallet
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



// ── Solana RPC ────────────────────────────────────────────────────────────
//
// Priority order:
//  1. VITE_SOLANA_RPC env var  — set this to your Alchemy endpoint in Vercel
//  2. VITE_SOLANA_DEVNET_RPC   — separate devnet endpoint (Alchemy devnet or Helius devnet)
//  3. Built-in fallback list   — browser-safe public RPCs (no 403)
//
// WHY NOT api.mainnet-beta.solana.com / api.devnet.solana.com:
//   Solana Foundation blocks direct browser requests with 403.
//   These only work server-side or from official Solana tooling.
//
// Alchemy Solana endpoints (set in Vercel env vars):
//   Mainnet: https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
//   Devnet:  https://solana-devnet.g.alchemy.com/v2/YOUR_KEY
//
// Fallback RPCs (no key, browser CORS allowed, production-grade):
//   Helius public:  https://mainnet.helius-rpc.com/?api-key=YOUR_KEY (free tier = 1M req/month)
//   QuickNode free: https://solana-mainnet.core.chainstack.com (100 req/s)

// These are tested browser-safe RPCs — all allow CORS from browser fetch.
// Ordered best→worst. Your Alchemy key (env var) always takes priority over these.
const SOL_RPC_FALLBACK_MAINNET = [
  'https://solana-mainnet.g.alchemy.com/v2/demo',          // Alchemy demo (rate-limited)
  'https://go.getblock.io/solana-mainnet',                  // GetBlock free — browser CORS ok
  'https://api.mainnet-beta.solana.com',                    // Solana public — last resort
];
const SOL_RPC_FALLBACK_DEVNET = [
  'https://solana-devnet.g.alchemy.com/v2/demo',            // Alchemy demo devnet
  'https://api.devnet.solana.com',                          // Solana devnet — last resort
];

async function detectSolanaNetwork(): Promise<'devnet' | 'mainnet'> {
  try {
    const phantomSol = (window as any).phantom?.solana || (window as any).solana;
    const net = phantomSol?.network || phantomSol?._network || '';
    if (typeof net === 'string' && net.toLowerCase().includes('devnet')) return 'devnet';
    // Genesis hash is most reliable — works regardless of wallet version
    const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
    const gh = await phantomSol?.request?.({ method: 'getGenesisHash' }).catch(() => null);
    if (gh === DEVNET_GENESIS) return 'devnet';
  } catch { /* fall through */ }
  return 'mainnet';
}

async function getSolanaConnection(envRpc?: string): Promise<any> {
  const { Connection } = await import('@solana/web3.js');

  // 1. Explicit env var always wins (your Alchemy key)
  if (envRpc) return new Connection(envRpc, 'confirmed');

  const network = await detectSolanaNetwork();

  // 2. Network-specific env var
  const devnetEnv  = (import.meta as any).env?.VITE_SOLANA_DEVNET_RPC  || '';
  const mainnetEnv = (import.meta as any).env?.VITE_SOLANA_RPC         || '';
  if (network === 'devnet'  && devnetEnv)  return new Connection(devnetEnv,  'confirmed');
  if (network === 'mainnet' && mainnetEnv) return new Connection(mainnetEnv, 'confirmed');

  // 3. Try fallback RPCs one by one — first that succeeds wins
  const rpcs = network === 'devnet' ? SOL_RPC_FALLBACK_DEVNET : SOL_RPC_FALLBACK_MAINNET;
  for (const rpc of rpcs) {
    try {
      const conn = new Connection(rpc, 'confirmed');
      // Quick liveness check — getSlot is the lightest RPC call
      await Promise.race([
        conn.getSlot(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
      ]);
      return conn;
    } catch { continue; }
  }

  // 4. Last resort — throw a helpful message pointing to the fix
  throw new Error(
    'No working Solana RPC found. Add VITE_SOLANA_RPC (Alchemy mainnet) and ' +
    'VITE_SOLANA_DEVNET_RPC (Alchemy devnet) to your Vercel environment variables.'
  );
}

// ── Mobile detection ──────────────────────────────────────────────────────
// isAndroid/isMobile live in SolWalletPicker — only isInEvmBrowser needed here
function isInEvmBrowser(): string | null {
  const eth = (window as any).ethereum;
  if (!eth) return null;
  // Phantom browser injects window.ethereum BUT it is a Solana-primary browser —
  // treat it as NOT an EVM browser so SOL auto-connect takes priority
  if (eth.isPhantom || (window as any).phantom?.solana) return null;
  // Check specific wallets first (some also set isMetaMask, so order matters)
  if (eth.isOKExWallet || eth.isOkxWallet)  return 'OKX Wallet';
  if (eth.isBitKeep || eth.isBitget)         return 'Bitget Wallet';
  if (eth.isSafePal)                         return 'SafePal';
  if (eth.isBybit)                           return 'Bybit Wallet';
  if (eth.isBinance || eth.isBinanceSmartWallet) return 'Binance Web3';
  if (eth.isGate || eth.isGateWallet)        return 'Gate Wallet';
  if (eth.isZerion)                          return 'Zerion';
  if (eth.isRabby)                           return 'Rabby';
  if (eth.isOneInch)                         return '1inch Wallet';
  if (eth.isKraken)                          return 'Kraken Wallet';
  if (eth.isOneKey)                          return 'OneKey';
  if (eth.isTokenPocket)                     return 'TokenPocket';
  if (eth.isImToken)                         return 'imToken';
  if (eth.isFrontier)                        return 'Frontier';
  if (eth.isRainbow)                         return 'Rainbow';
  if (eth.isBraveWallet)                     return 'Brave Wallet';
  if (eth.isCoinbaseWallet)                  return 'Coinbase Wallet';
  if (eth.isTrust || eth.isTrustWallet)      return 'Trust Wallet';
  if (eth.isMetaMask)                        return 'MetaMask';
  return 'Wallet';
}

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

  }
}

// ── Injected wallet registry (desktop / in-app browser fallback) ──────────
interface DetectedWallet {
  id: string; name: string; icon: React.ReactNode | string; color?: string;
  connect: () => Promise<string>;
  sendSol?: (to: string, lamports: number, conn: unknown) => Promise<string>;
  sendBtc?: (to: string, satoshis: number) => Promise<string>;
}

function detectBitcoinWallets(): DetectedWallet[] {
  const list: DetectedWallet[] = [];
  if (window.phantom?.bitcoin) list.push({
    id: 'phantom-btc', name: 'Phantom', icon: '👻', color: 'text-purple-400',
    connect: async (): Promise<string> => {
      const accs = await window.phantom!.bitcoin!.requestAccounts();
      return accs.find(a => a.purpose === 'payment')?.address ?? accs[0]?.address ?? '';
    },
    sendBtc: async (to, sat) => {
      // Phantom: PSBT → signPSBT → broadcast — fromAddr stored via localStorage
      const fromAddr = localStorage.getItem('_kleo_btc_address') ?? '';
      const { phantomSendBitcoin } = await import('../components/BtcDiagnostic');
      return phantomSendBitcoin(fromAddr, to, sat);
    },
  });
  const xverseProvider = (window as any).XverseProviders?.BitcoinProvider ?? (window as any).BitcoinProvider;
  if (xverseProvider) list.push({
    id: 'xverse', name: 'Xverse', icon: '✦', color: 'text-blue-400',
    connect: async (): Promise<string> => {
      // Use proper getAccounts params — null params may skip the payment address on some Xverse versions
      const r = await xverseProvider.request('getAccounts', {
        purposes: ['payment', 'ordinals'],
        message: 'Connect to Xenia Presale',
      });
      if (r?.status === 'error') throw new Error(r.error?.message || 'Xverse refused connection');
      const addrs: any[] = r?.result ?? [];
      return addrs.find((a: any) => a.purpose === 'payment')?.address
          ?? addrs.find((a: any) => a.addressType === 'p2wpkh' || a.addressType === 'p2sh')?.address
          ?? addrs[0]?.address ?? '';
    },
    sendBtc: async (to, sat) => {
      const r = await xverseProvider.request('sendTransfer', { recipients: [{ address: to, amount: sat }] });
      if (r?.status === 'error') throw new Error(r.error?.message || 'Xverse send failed');
      return r?.result?.txid ?? r?.txid ?? '';
    },
  });
  if (window.okxwallet?.bitcoin) list.push({
    id: 'okx-btc', name: 'OKX Wallet', icon: '⭕', color: 'text-gray-300',
    connect: async (): Promise<string> => {
      const accs = await window.okxwallet!.bitcoin!.requestAccounts();
      return accs[0]?.address ?? '';
    },
    sendBtc: async (to, sat) => {
      const result = await window.okxwallet!.bitcoin!.sendBitcoin(to, sat);
      // OKX has returned both plain txid string and {txid:string} object across versions
      return typeof result === 'string' ? result : (result as any)?.txid ?? String(result);
    },
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
// ── Stable chain options (shown as picker when USDC/USDT selected) ──────────
// ⚠️  TESTNET contracts — swap all addresses + chainIds before mainnet launch
// Mainnet addresses commented next to each entry
const STABLE_CHAINS: Record<string, {
  id: string; label: string; icon: string;
  chainId: number; chainName: string; chainHex: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[]; blockExplorer: string;
  usdc?: { address: string; decimals: number };
  usdt?: { address: string; decimals: number };
}[]> = {
  USDC: [
    {
      id: 'sol', label: 'Solana', icon: '◎',
      chainId: 0, chainName: 'Solana', chainHex: '0x0', // sentinel — not EVM
      nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
      rpcUrls: ['https://rpc.ankr.com/solana'],
      blockExplorer: 'https://solscan.io',
      usdc: { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 }, // devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
    },
    {
      id: 'eth', label: 'Ethereum', icon: 'Ξ',
      chainId: sepolia.id, chainName: 'Sepolia Testnet', chainHex: '0xaa36a7',  // mainnet: 1 / 0x1
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],                   // mainnet: https://eth.llamarpc.com
      blockExplorer: 'https://sepolia.etherscan.io',
      usdc: { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 }, // mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    },
    {
      id: 'bnb', label: 'BNB Chain', icon: '◆',
      chainId: bscTestnet.id, chainName: 'BSC Testnet', chainHex: '0x61',        // mainnet: 56 / 0x38
      nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
      rpcUrls: ['https://bsc-testnet-rpc.publicnode.com'],                        // mainnet: https://bsc-dataseed.binance.org
      blockExplorer: 'https://testnet.bscscan.com',
      usdc: { address: '0x64544969ed7EBf5f083679233325356EbE738930', decimals: 18 }, // mainnet: 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
    },
    {
      id: 'polygon', label: 'Polygon Amoy', icon: '⬡',
      chainId: polygonAmoy.id, chainName: 'Polygon Amoy Testnet', chainHex: '0x13882',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://rpc-amoy.polygon.technology'],
      blockExplorer: 'https://www.oklink.com/amoy',
      usdc: { address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', decimals: 6 }, // mainnet: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
    },
    {
      id: 'arbitrum', label: 'Arbitrum', icon: '🔵',
      chainId: arbitrumSepolia.id, chainName: 'Arbitrum Sepolia', chainHex: '0x66eee',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
      blockExplorer: 'https://sepolia.arbiscan.io',
      usdc: { address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', decimals: 6 }, // mainnet: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
    },
    {
      id: 'base', label: 'Base', icon: '🔷',
      chainId: baseSepolia.id, chainName: 'Base Sepolia', chainHex: '0x14a34',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorer: 'https://sepolia.basescan.org',
      usdc: { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 }, // mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    },
  ],
  USDT: [
    {
      id: 'eth', label: 'Ethereum', icon: 'Ξ',
      chainId: sepolia.id, chainName: 'Sepolia Testnet', chainHex: '0xaa36a7',  // mainnet: 1
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
      blockExplorer: 'https://sepolia.etherscan.io',
      usdt: { address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', decimals: 6 }, // mainnet: 0xdAC17F958D2ee523a2206206994597C13D831ec7
    },
    {
      id: 'bnb', label: 'BNB Chain', icon: '◆',
      chainId: bscTestnet.id, chainName: 'BSC Testnet', chainHex: '0x61',        // mainnet: 56
      nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
      rpcUrls: ['https://bsc-testnet-rpc.publicnode.com'],
      blockExplorer: 'https://testnet.bscscan.com',
      usdt: { address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', decimals: 18 }, // mainnet: 0x55d398326f99059fF775485246999027B3197955
    },
    {
      id: 'polygon', label: 'Polygon Amoy', icon: '⬡',
      chainId: polygonAmoy.id, chainName: 'Polygon Amoy Testnet', chainHex: '0x13882',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://rpc-amoy.polygon.technology'],
      blockExplorer: 'https://www.oklink.com/amoy',
      usdt: { address: '0xAcDe43b9E5F72A4F554D4346E69e8e7Ac8BE9dc8', decimals: 6 }, // mainnet: 0xc2132D05D31c914a87C6611C10748AEb04B58e8F
    },
    {
      id: 'arbitrum', label: 'Arbitrum', icon: '🔵',
      chainId: arbitrumSepolia.id, chainName: 'Arbitrum Sepolia', chainHex: '0x66eee',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
      blockExplorer: 'https://sepolia.arbiscan.io',
      usdt: { address: '0x4d7d2eA3E72533e62cA0e7c31A0a82E0bDC0CAb8', decimals: 6 }, // mainnet: 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
    },
    {
      id: 'base', label: 'Base', icon: '🔷',
      chainId: baseSepolia.id, chainName: 'Base Sepolia', chainHex: '0x14a34',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorer: 'https://sepolia.basescan.org',
      usdt: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 6 }, // Base mainnet: no official USDT — use USDC instead
    },
  ],
};

// Legacy flat map used by WalletConnect writeContractAsync path — resolved dynamically
type TokenInfo = { address: string; decimals: number; chainId: number };
function getTokenInfo(token: string, stableChainId: string): TokenInfo | undefined {
  const chains = STABLE_CHAINS[token];
  if (!chains) return undefined;
  const chain = chains.find(c => c.id === stableChainId) ?? chains[0];
  const info = token === 'USDC' ? chain.usdc : chain.usdt;
  if (!info) return undefined;
  return { ...info, chainId: chain.chainId };
}

const CURRENCIES = [
  { id: 'SOL',  label: 'Solana',   symbol: 'SOL',  icon: '◎', color: 'text-purple-400', chain: 'sol' },
  { id: 'ETH',  label: 'Ethereum', symbol: 'ETH',  icon: 'Ξ', color: 'text-blue-400',   chain: 'evm', chainId: sepolia.id },
  { id: 'BNB',  label: 'BNB',      symbol: 'BNB',  icon: '◆', color: 'text-yellow-400', chain: 'evm', chainId: bscTestnet.id },
  { id: 'USDC', label: 'USDC',     symbol: 'USDC', icon: '$', color: 'text-green-400',  chain: 'evm', token: 'USDC' },
  { id: 'USDT', label: 'USDT',     symbol: 'USDT', icon: '₮', color: 'text-teal-400',   chain: 'evm', token: 'USDT' },
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
      if (/Android/i.test(navigator.userAgent)) {
        // Android: Intent URL with Play Store fallback
        window.location.href = `intent://browser?url=${encoded}#Intent;scheme=unisat;package=io.unisat.app;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dio.unisat.app;end`;
      } else {
        // iOS has no Unisat app — send to download page. Desktop: custom scheme then fallback.
        window.location.href = `unisat://browser?url=${encoded}`;
        setTimeout(() => { window.location.href = 'https://unisat.io/download'; }, 1500);
      }
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
    setSolWallet, setBtcWallet, disconnectSol, disconnectBtc, setShowEvmPicker, setShowSolPicker,
  } = useWalletStore();
  const currentStage = getCurrentStage(totalRaised);

  // EVM (wagmi)
  const { address, isConnected, connector } = useAccount();
  const { disconnect: evmDisconnect }       = useDisconnect();
  const evmConnections                       = useConnections(); // track ALL active wagmi connections
  const { sendTransactionAsync }            = useSendTransaction();
  const { writeContractAsync }              = useWriteContract();
  const { switchChainAsync }               = useSwitchChain();
  const { connectAsync }                   = useConnect();
  const currentChainId                     = useChainId();

  // Sync connector name for display. wagmi's address/isConnected are the single source of truth.
  // evmInjectedAddr state is no longer used — all reads use wagmi's address directly.
  useEffect(() => {
    if (isConnected && address) {
      // Prefer the name we saved at connect time (e.g. 'MetaMask') over wagmi's connector.name
      // which can be 'Magic Eden' if that extension is also installed and uses EIP-6963.
      const savedName = localStorage.getItem('_kleo_evm_wallet_name');
      const browserName = isInEvmBrowser();
      const name = savedName || browserName || connector?.name || 'Wallet';
      setEvmInjectedName(name);
      localStorage.setItem('_kleo_evm_address', address);
      localStorage.setItem('_kleo_evm_wallet_name', name);
    }
    if (!isConnected) {
      setEvmInjectedName('');
      localStorage.removeItem('_kleo_evm_address');
      localStorage.removeItem('_kleo_evm_wallet_name');
    }
  }, [isConnected, address, connector?.name]);  // eslint-disable-line react-hooks/exhaustive-deps

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
  const [cardError,     setCardError]     = useState('');
  const [cardSuccess,   setCardSuccess]   = useState<{tokens: number; usd: number} | null>(null);
  const [liveRates,     setLiveRates]    = useState<Record<string,number>>({ ETH: 3200, BNB: 580, SOL: 170, BTC: 65000, USDC: 1, USDT: 1 });
  const [stableChainId, setStableChainId] = useState<string>('bnb'); // selected chain for USDC/USDT
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

  // ── Cross-chain exclusivity helpers ───────────────────────────────────
  // Only one chain type should be connected at a time. Connecting SOL/BTC
  // drops any EVM session, and connecting EVM drops SOL/BTC.
  const dropEvmConnection = () => {
    if (evmConnections.length > 0) {
      evmConnections.forEach(conn => evmDisconnect({ connector: conn.connector }));
    } else if (isConnected) {
      evmDisconnect();
    }
    setEvmInjectedAddr('');
    setEvmInjectedName('');
    localStorage.removeItem('_kleo_evm_address');
    localStorage.removeItem('_kleo_evm_wallet_name');
  };

  const dropSolBtcConnections = () => {
    if (solAddress) { disconnectSol(); setActiveWallet(null); }
    if (btcAddress) {
      localStorage.removeItem('_kleo_btc_address');
      localStorage.removeItem('_kleo_btc_wallet_name');
      disconnectBtc();
      setActiveWallet(null);
    }
  };

  // EVM injected state (used when inside a wallet browser, supplements wagmi)
  // evmInjectedAddr removed — wagmi's address is single source of truth. Setter kept for legacy mount paths.
  const [, setEvmInjectedAddr]  = useState<string>('');
  const [evmInjectedName,   setEvmInjectedName]  = useState<string>('');
  // showEvmPicker is now global (walletStore) — shared with Navigation and any other CTA

  // BTC multi-wallet picker (when user has >1 BTC wallet installed)
  const [showBtcInjectedPicker, setShowBtcInjectedPicker] = useState(false);
  const [injectedBtcWallets,    setInjectedBtcWallets]    = useState<DetectedWallet[]>([]);
  const [activeWallet,          setActiveWallet]           = useState<DetectedWallet | null>(null);

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
  const isEvm      = selected.chain === 'evm';
  const isBtc      = selected.chain === 'btc';
  // USDC on Solana: currency tab is 'evm' but chain picker selects 'sol' → treat as Solana
  const isSolUsdc  = isEvm && (selected as any).token === 'USDC' && stableChainId === 'sol';
  const isSolUsdcActive = isSolUsdc; // alias for readability in JSX

  // ── Record purchase ────────────────────────────────────────────────────
  const recordPurchase = useCallback(async (
    hash: string, usd: number, tokens: number, wallet: string, method: string
  ) => {
    // 1. Update local state immediately — this persists to localStorage via Zustand
    addRaised(usd);
    addPurchase({ usdSpent: usd, xenReceived: tokens, stage: currentStage.stage, priceUsd: currentStage.priceUsd, txHash: hash, timestamp: Date.now(), cryptoType: method });

    // 2. Save to localStorage as backup in case Supabase fails
    const pendingKey = `_xen_pending_${hash.slice(0, 16)}`;
    const pendingRecord = { hash, usd, tokens, wallet, method, stage: currentStage.stage, ts: Date.now() };
    try { localStorage.setItem(pendingKey, JSON.stringify(pendingRecord)); } catch { /* ignore */ }

    // 3. Insert to Supabase — upsert on tx_hash so retries are safe
    if (supabase) {
      // EVM: lowercase. SOL/BTC: keep original case (base58 is case-sensitive).
      const normalizedWallet = wallet.startsWith('0x') ? wallet.toLowerCase() : wallet;
      const row = {
        wallet_address: normalizedWallet, tokens, eth_spent: 0,
        usd_amount: usd, stage: currentStage.stage, price_eth: currentStage.priceUsd,
        tx_hash: hash, payment_method: method.toLowerCase(),
      };

      // Try up to 3 times with exponential backoff
      let lastError: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 1500));
        const { error } = await supabase
          .from('presale_purchases')
          .upsert(row, { onConflict: 'tx_hash', ignoreDuplicates: true });
        if (!error) {
          // Success — clear the localStorage backup
          try { localStorage.removeItem(pendingKey); } catch { /* ignore */ }
          return;
        }
        lastError = error;
        if (error.code === '23505') return; // duplicate — already recorded, fine
      }
      console.error('Supabase upsert failed after 3 attempts:', lastError?.message, lastError?.code);
      // Record stays in localStorage — can be replayed later if needed
    }
  }, [addRaised, addPurchase, currentStage]);

  // ── On mount: ONLY handle callbacks + restore saved addresses ─────────
  // No auto-connect. Each currency tab connects its own wallet on demand.
  // This prevents EVM/BTC/SOL fighting for connection inside wallet browsers.
  useEffect(() => {
    const init = async () => {
      // ── Recover any purchases that were signed but failed to reach Supabase ──
      // This handles: page refreshed mid-confirmation, network blip, Supabase timeout.
      // Runs silently on every load — upsert is idempotent so safe to retry.
      if (supabase) {
        try {
          const allKeys = Object.keys(localStorage).filter(k => k.startsWith('_xen_pending_'));
          for (const key of allKeys) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const rec = JSON.parse(raw);
            const normalizedWallet = rec.wallet?.startsWith('0x') ? rec.wallet.toLowerCase() : rec.wallet;
            const { error } = await supabase.from('presale_purchases').upsert({
              wallet_address: normalizedWallet, tokens: rec.tokens, eth_spent: 0,
              usd_amount: rec.usd, stage: rec.stage, price_eth: 0,
              tx_hash: rec.hash, payment_method: rec.method?.toLowerCase(),
            }, { onConflict: 'tx_hash', ignoreDuplicates: true });
            if (!error || error.code === '23505') {
              localStorage.removeItem(key); // successfully synced
            }
          }
        } catch { /* recovery is best-effort */ }
      }

      const params = new URLSearchParams(window.location.search);
      const phantomPubKey = params.get('phantom_encryption_public_key');
      const data          = params.get('data');
      const nonce         = params.get('nonce');
      const errorCode     = params.get('errorCode');

      if (phantomPubKey || errorCode || params.get('errorMessage')) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (errorCode) {
        const msg = params.get('errorMessage') || '';
        if (localStorage.getItem('_kleo_pending_purchase')) {
          localStorage.removeItem('_kleo_pending_purchase');
          const errMap: Record<string, string> = {
            '4001': 'Transaction rejected — nothing was sent.',
            '4100': 'Session expired — reconnect Phantom.',
            '4900': 'Phantom disconnected — check network settings.',
          };
          setTxError(errMap[errorCode] || `Phantom error ${errorCode}${msg ? ': ' + msg : ''}`);
          setTxStatus('error');
        }
        return;
      }

      if (phantomPubKey && data && nonce) {
        try {
          const payload = await decryptPhantomPayload(phantomPubKey, data, nonce);
          if (payload.public_key) {
            localStorage.setItem('_kleo_phantom_session', payload.session);
            localStorage.setItem('_kleo_phantom_pubkey', phantomPubKey);
            localStorage.setItem('_kleo_sol_address', payload.public_key);
            setSolWallet(payload.public_key, 'Phantom');
            setCurrency('SOL');
          } else if (payload.signature) {
            const pendingStr = localStorage.getItem('_kleo_pending_purchase');
            if (pendingStr) {
              localStorage.removeItem('_kleo_pending_purchase');
              const { usd, tokens, addr, method } = JSON.parse(pendingStr);
              await recordPurchase(payload.signature, usd, tokens, addr, method);
              setTxHash(payload.signature);
              setTxStatus('success');
            }
          }
        } catch (e) {
          if (localStorage.getItem('_kleo_pending_purchase')) {
            setTxError(`Phantom error: ${e instanceof Error ? e.message : String(e)}`);
            setTxStatus('error');
          }
        }
      }

      // ── Restore saved addresses from previous sessions (no new prompts) ──
      const storedSol     = localStorage.getItem('_kleo_sol_address');
      const storedSolName = localStorage.getItem('_kleo_sol_wallet_name') || 'Phantom';
      if (storedSol && localStorage.getItem('_kleo_phantom_session')) {
        setSolWallet(storedSol, storedSolName);
        // Critically: also restore activeWallet so sendSol() works without re-connecting.
        // Without this, activeWallet is null → falls to SolanaPay path → no Supabase record.
        try {
          const { buildSolWallets } = await import('../components/SolWalletPicker');
          const wallets = buildSolWallets();
          // Match by name first, fall back to any wallet with sendSol that's detected
          const w = wallets.find(x => x.name === storedSolName && x.sendSol)
                 ?? wallets.find(x => x.sendSol);
          if (w) setActiveWallet(w as any);
        } catch { /* wallet not installed — user will reconnect manually */ }
      }

      const storedBtc     = localStorage.getItem('_kleo_btc_address');
      const storedBtcName = localStorage.getItem('_kleo_btc_wallet_name') || 'Bitcoin Wallet';
      const btcConnecting = localStorage.getItem('_kleo_btc_connecting');

      if (storedBtc) {
        setBtcWallet(storedBtc, storedBtcName);
        const btcWallets = detectBitcoinWallets();
        const w = btcWallets.find(w => w.name === storedBtcName) ?? btcWallets[0];
        if (w) setActiveWallet(w);
      } else if (btcConnecting && (window as any).bitcoin) {
        // ── Page reloaded mid-connection (MetaMask behaviour) ──────────────
        // User already approved — requestAccounts() returns silently with address
        localStorage.removeItem('_kleo_btc_connecting');
        try {
          const raw = await ((window as any).bitcoin as any).requestAccounts();
          const accs = Array.isArray(raw) ? raw : (raw?.result ?? raw?.accounts ?? []);
          const addr = typeof accs[0] === 'string'
            ? accs[0]
            : accs.find((a: any) => a.purpose === 'payment')?.address
           ?? accs.find((a: any) => a.address?.startsWith('bc1'))?.address
           ?? accs[0]?.address ?? '';
          if (addr) {
            const mmWallet: DetectedWallet = {
              id: 'metamask-btc', name: btcConnecting, icon: '🦊', color: 'text-orange-400',
              connect: async () => addr,
              sendBtc: async (to: string, sat: number) => {
                const r = await ((window as any).bitcoin as any).sendBitcoin(to, sat);
                return typeof r === 'string' ? r : r?.txid ?? String(r);
              },
            };
            localStorage.setItem('_kleo_btc_address', addr);
            localStorage.setItem('_kleo_btc_wallet_name', btcConnecting);
            setBtcWallet(addr, btcConnecting);
            setActiveWallet(mmWallet);
            setCurrency('BTC');
          }
        } catch { /* already approved so silently ignore any error */ }
      }

      // ── Restore saved EVM address if inside a wallet browser ─────────────
      const storedEvm = localStorage.getItem('_kleo_evm_address');
      const storedEvmName = localStorage.getItem('_kleo_evm_wallet_name');
      if (storedEvm && storedEvmName && isInEvmBrowser()) {
        setEvmInjectedAddr(storedEvm);
        setEvmInjectedName(storedEvmName);
      }

      // ── Smart auto-connect based on detected wallet browser ───────────────
      // Each wallet browser gets exactly one connection type — no cross-chain fights.
      //
      // CRITICAL: window.phantom.solana exists on BOTH:
      //   a) Desktop Chrome with Phantom extension installed
      //   b) Phantom mobile app's built-in browser
      //
      // We only want to auto-connect in case (b). The reliable signal for (b) is:
      //   - window.phantom.solana exists AND
      //   - window.ethereum is injected by Phantom itself (eth.isPhantom = true)
      //   - OR there is NO window.ethereum at all (Phantom mobile often omits it on SOL tab)
      // On desktop (case a), Phantom injects eth.isPhantom too — but the user has
      // a real browser, so we MUST check navigator.userAgent for mobile as well.

      const eth = (window as any).ethereum;
      const ua = navigator.userAgent;
      const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);

      // isPhantomBrowser: inside Phantom mobile in-app browser
      // window.phantom.solana is the only reliable signal — Phantom also sets
      // eth.isMetaMask=true for MetaMask compatibility, so we CANNOT use !eth.isMetaMask
      const isPhantomBrowser = !!(window as any).phantom?.solana && isMobileUA;
      const isXverseBrowser  = !!(window as any).XverseProviders?.BitcoinProvider && !eth;
      const isUnisatBrowser  = !!(window as any).unisat && !eth;
      const isOkxBrowser     = !!(window as any).okxwallet && !eth?.isMetaMask && !isPhantomBrowser;
      // Real MetaMask browser: has isMetaMask but is NOT Phantom
      const isMetaMaskBrowser = !!eth?.isMetaMask && !eth?.isPhantom && !isPhantomBrowser;
      const isEvmBrowser     = !!eth && !isPhantomBrowser;

      if (isPhantomBrowser) {
        // ── Phantom browser: auto-connect SOL only, drop any EVM session ──
        const phantom = window.phantom!.solana!;
        try {
          const resp = await phantom.connect();
          const addr = resp.publicKey.toString();
          dropEvmConnection();
          setSolWallet(addr, 'Phantom');
          localStorage.setItem('_kleo_sol_address', addr);
          localStorage.setItem('_kleo_sol_wallet_name', 'Phantom');
          setCurrency('SOL');
          const { buildSolWallets } = await import('../components/SolWalletPicker');
          const w = buildSolWallets().find(x => x.id === 'phantom');
          if (w) setActiveWallet(w as unknown as DetectedWallet);
        } catch {}

      } else if (isXverseBrowser || isUnisatBrowser) {
        // ── Xverse / Unisat browser: auto-connect BTC only, drop any EVM ──
        const btcWallets = detectBitcoinWallets();
        if (btcWallets.length > 0) {
          try {
            const addr = await btcWallets[0].connect();
            if (addr) {
              dropEvmConnection();
              localStorage.setItem('_kleo_btc_address', addr);
              localStorage.setItem('_kleo_btc_wallet_name', btcWallets[0].name);
              setBtcWallet(addr, btcWallets[0].name);
              setActiveWallet(btcWallets[0]);
              setCurrency('BTC');
            }
          } catch {}
        }

      } else if (isMetaMaskBrowser || isEvmBrowser) {
        // Restore last used currency
        const walletName = isInEvmBrowser() || 'Wallet';
        const savedCurrency = localStorage.getItem('_kleo_active_currency');
        if (savedCurrency && CURRENCIES.find(c => c.id === savedCurrency)) {
          setCurrency(savedCurrency);
        } else {
          setCurrency('BNB');
        }

        // ── Guard: wagmi reconnectOnMount may have already connected before this
        // useEffect runs. Calling connectAsync again throws ConnectorAlreadyConnectedError
        // and leaves isConnected in an inconsistent state. Skip it — the sync useEffect
        // (~line 398) will set evmInjectedName from wagmi state automatically.
        if (isConnected && address) {
          setEvmInjectedName(localStorage.getItem('_kleo_evm_wallet_name') || walletName);
          return;
        }

        try {
          // eth_accounts is silent — returns already-approved accounts with no popup
          const existing = await eth.request({ method: 'eth_accounts' });
          if (existing && existing[0]) {
            dropSolBtcConnections();
            setEvmInjectedAddr(existing[0]);
            setEvmInjectedName(walletName);
            localStorage.setItem('_kleo_evm_address', existing[0]);
            localStorage.setItem('_kleo_evm_wallet_name', walletName);
            try { await connectAsync({ connector: injected() }); } catch {}
          } else {
            // First visit — connectAsync shows approval popup once (expected)
            const result = await connectAsync({ connector: injected() });
            const acct = result.accounts[0];
            if (acct) {
              dropSolBtcConnections();
              setEvmInjectedAddr(acct);
              setEvmInjectedName(walletName);
              localStorage.setItem('_kleo_evm_address', acct);
              localStorage.setItem('_kleo_evm_wallet_name', walletName);
            }
          }
        } catch {}

      } else if (isOkxBrowser) {
        const savedCurrency = localStorage.getItem('_kleo_active_currency') || 'BNB';
        setCurrency(savedCurrency);
        if (eth) {
          if (isConnected && address) {
            setEvmInjectedName('OKX Wallet');
            return;
          }
          try {
            const result = await connectAsync({ connector: injected() });
            const acct = result.accounts[0];
            if (acct) {
              setEvmInjectedAddr(acct);
              setEvmInjectedName('OKX Wallet');
              localStorage.setItem('_kleo_evm_address', acct);
              localStorage.setItem('_kleo_evm_wallet_name', 'OKX Wallet');
            }
          } catch {
            try {
              const existing = await eth.request({ method: 'eth_accounts' });
              if (existing[0]) {
                setEvmInjectedAddr(existing[0]);
                setEvmInjectedName('OKX Wallet');
              }
            } catch {}
          }
        }
      }

      // ── Final: restore last active currency if no browser-specific override ──
      if (!isPhantomBrowser && !isXverseBrowser && !isUnisatBrowser && !isMetaMaskBrowser && !isEvmBrowser && !isOkxBrowser) {
        const savedCurrency = localStorage.getItem('_kleo_active_currency');
        if (savedCurrency && CURRENCIES.find(c => c.id === savedCurrency)) {
          setCurrency(savedCurrency);
        }
      }
    };
    init();
  }, [recordPurchase]);

  // ── Live prices — refresh every 60s ──────────────────────────────────
  useEffect(() => {
    // ── Restore cached prices immediately (no loading flash) ─────────────
    try {
      const cached = localStorage.getItem('_kleo_price_cache');
      if (cached) {
        const { rates, ts } = JSON.parse(cached);
        // Accept cache up to 10 minutes old — better than showing stale defaults
        if (Date.now() - ts < 10 * 60_000 && rates) {
          setLiveRates(p => ({ ...p, ...rates }));
        }
      }
    } catch {}

    const fetchPrices = () => {
      const ids = Object.values(COINGECKO_IDS).join(',');
      setPriceLoading(true);
      // 2.5s timeout — fail fast so UI is never blocked waiting for CoinGecko free tier
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, {
        signal: controller.signal,
      })
        .then(r => r.json())
        .then(data => {
          clearTimeout(timer);
          const rates: Record<string, number> = {};
          for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
            if (data[id]?.usd) rates[sym] = data[id].usd;
          }
          if (Object.keys(rates).length) {
            setLiveRates(p => ({ ...p, ...rates }));
            setPriceError(false);
            // Cache for instant display on next load
            try { localStorage.setItem('_kleo_price_cache', JSON.stringify({ rates, ts: Date.now() })); } catch {}
          }
        })
        .catch(() => { clearTimeout(timer); setPriceError(true); })
        .finally(() => setPriceLoading(false));
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
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
  // ── Single connect function driven by selected currency tab ─────────────
  // This is the ONLY place connections are initiated. No cross-chain interference.
  const connectWallet = async () => {
    // SOL USDC: currency tab is EVM but Solana chain is selected — route to SOL connect
    const chain = (isSolUsdc) ? 'sol' : selected.chain;

    if (chain === 'evm') {
      // ── EVM connect — mirrors Solana/Phantom deeplink pattern ─────────────
      //
      // FLOW (same as Solana tab):
      //   External browser → tap Connect → picker appears → user picks wallet
      //   → redirect into wallet's built-in browser (MetaMask, Trust, OKX, etc.)
      //   → page reloads → mount auto-connect fires → connected in 1 tap
      //
      // We ONLY skip the picker and connect directly when we're already INSIDE
      // a wallet browser (isInEvmBrowser() returns the wallet name). This includes:
      //   • MetaMask mobile in-app browser
      //   • Trust Wallet browser
      //   • Coinbase Wallet browser
      //   • OKX, Bitget, Bybit, Phantom EVM browser, etc.
      //
      // Desktop MetaMask extension also sets window.ethereum, but isInEvmBrowser()
      // detects that too, so desktop extension users also get direct connect (fast path).
      //
      // The picker is shown ONLY when there's no injected provider at all — i.e. the
      // user is on plain Safari/Chrome with no wallet installed as an extension.

      if (isConnected && address) {
        // Already connected via wagmi (WalletConnect or injected) — just sync UI
        setEvmInjectedAddr(address);
        setEvmInjectedName(connector?.name || 'Connected');
        return;
      }

      const walletBrowserName = isInEvmBrowser();

      if (walletBrowserName) {
        // ── Inside a wallet browser (or extension) — connect directly ─────
        // Single wagmi call, no popup on repeat visits since user already approved.
        try {
          const _tokenKey = (selected as any).token as string | undefined;
          const _activeStable = _tokenKey
            ? (STABLE_CHAINS[_tokenKey]?.find((c: any) => c.id === stableChainId) ?? STABLE_CHAINS[_tokenKey]?.[0])
            : null;
          const _targetChainId: number | undefined = _activeStable?.chainId ?? (selected as any).chainId;

          const result = await connectAsync({
            connector: injected(),
            ...(_targetChainId ? { chainId: _targetChainId } : {}),
          });
          const acct = result.accounts[0];
          if (acct) {
            dropSolBtcConnections();
            setEvmInjectedAddr(acct);
            setEvmInjectedName(walletBrowserName);
            localStorage.setItem('_kleo_evm_address', acct);
            localStorage.setItem('_kleo_evm_wallet_name', walletBrowserName);
          }
        } catch (e: any) {
          if (address) {
            setEvmInjectedAddr(address);
            setEvmInjectedName(connector?.name || walletBrowserName);
          } else if (!e?.message?.includes('rejected') && !e?.message?.includes('User')) {
            setTxError(e?.message || 'Connection failed');
          }
        }
      } else {
        // ── No wallet browser / extension — show deeplink picker ───────────
        // User picks wallet → redirected into its built-in browser.
        // When the page reloads inside the wallet, mount auto-connect fires
        // and connects silently (see useEffect below) — zero extra taps needed.
        setShowEvmPicker(true);
      }

    } else if (chain === 'sol') {
      // ── Solana — always open the picker, which detects installed wallets
      // and shows mobile deeplinks. Never hardcode to Phantom alone.
      setShowSolPicker(true);

    } else if (chain === 'btc') {
      // Helper: extract bc1... address from any wallet response format
      const extractBtcAddr = (accs: any[]): string => {
        if (!Array.isArray(accs) || accs.length === 0) return '';
        if (typeof accs[0] === 'string') return accs[0];
        return accs.find((a: any) => a.purpose === 'payment')?.address
            ?? accs.find((a: any) => a.addressType === 'p2wpkh')?.address
            ?? accs.find((a: any) => a.address?.startsWith('bc1'))?.address
            ?? accs[0]?.address ?? '';
      };

      // 1. (window as any).bitcoin — MetaMask Bitcoin Snap (works regardless of EVM chain)
      if ((window as any).bitcoin) {
        // Save flag BEFORE calling — MetaMask may reload the page on approval.
        // On next mount we'll see the flag and silently re-fetch the now-approved address.
        localStorage.setItem('_kleo_btc_connecting', 'MetaMask');
        setTxStatus('pending'); setTxError('Connecting Bitcoin wallet...');
        try {
          const raw = await ((window as any).bitcoin as any).requestAccounts();
          const accs = Array.isArray(raw) ? raw : (raw?.result ?? raw?.accounts ?? []);
          const addr = extractBtcAddr(accs);
          if (addr) {
            const mmWallet: DetectedWallet = {
              id: 'metamask-btc', name: 'MetaMask', icon: '🦊', color: 'text-orange-400',
              connect: async () => addr,
              sendBtc: async (to: string, sat: number) => {
                const result = await ((window as any).bitcoin as any).sendBitcoin(to, sat);
                return typeof result === 'string' ? result : result?.txid ?? String(result);
              },
            };
            localStorage.removeItem('_kleo_btc_connecting');
            localStorage.setItem('_kleo_btc_address', addr);
            localStorage.setItem('_kleo_btc_wallet_name', 'MetaMask');
            setBtcWallet(addr, 'MetaMask');
            setActiveWallet(mmWallet);
            setTxStatus('idle'); setTxError('');
          } else {
            localStorage.removeItem('_kleo_btc_connecting');
            // Show raw response in error so we can debug the exact format
            const rawStr = JSON.stringify(raw ?? null).slice(0, 200);
            setTxError(`No BTC address found. Raw response: ${rawStr}`);
            setTxStatus('error');
          }
        } catch (e: any) {
          localStorage.removeItem('_kleo_btc_connecting');
          setTxError(e?.message || 'MetaMask BTC connection failed');
          setTxStatus('error');
        }
        return;
      }

      // 2. Other injected wallets (Phantom, Xverse, OKX, Unisat)
      const injected = detectBitcoinWallets();
      if (injected.length === 1) {
        localStorage.setItem('_kleo_btc_connecting', injected[0].name);
        setTxStatus('pending'); setTxError('Connecting...');
        try {
          const addr = await injected[0].connect();
          if (addr) {
            localStorage.removeItem('_kleo_btc_connecting');
            localStorage.setItem('_kleo_btc_address', addr);
            localStorage.setItem('_kleo_btc_wallet_name', injected[0].name);
            dropEvmConnection();
            setBtcWallet(addr, injected[0].name);
            setActiveWallet(injected[0]);
            setTxStatus('idle'); setTxError('');
          }
        } catch (e: any) {
          localStorage.removeItem('_kleo_btc_connecting');
          setTxError(e?.message || 'Connection failed'); setTxStatus('error');
        }
      } else if (injected.length > 1) {
        setInjectedBtcWallets(injected); setShowBtcInjectedPicker(true);
      } else {
        setShowBtcPicker(true);
      }
    }
    localStorage.setItem('_kleo_active_currency', selected.id);
  };

  const disconnectEvmInjected = () => {
    // Disconnect ALL active wagmi connections in one shot.
    // With multiInjectedProviderDiscovery + EIP-6963, multiple wallets (e.g. MetaMask +
    // a Solana wallet like Phantom-EVM) can register as separate connectors simultaneously.
    // useDisconnect() alone only kills the primary — this kills every connection at once.
    if (evmConnections.length > 0) {
      evmConnections.forEach(conn => evmDisconnect({ connector: conn.connector }));
    } else {
      evmDisconnect();
    }
    setEvmInjectedAddr('');
    setEvmInjectedName('');
    localStorage.removeItem('_kleo_evm_address');
    localStorage.removeItem('_kleo_evm_wallet_name');
  };

  const connectInjected = async (wallet: DetectedWallet) => {
    setShowBtcInjectedPicker(false);
    try {
      const addr = await wallet.connect();
      if (!addr) return;
      dropEvmConnection();
      localStorage.setItem('_kleo_btc_address', addr);
      localStorage.setItem('_kleo_btc_wallet_name', wallet.name);
      setBtcWallet(addr, wallet.name);
      setActiveWallet(wallet);
    } catch {}
  };

  // ── Send SOL via Solana Pay URI (industry standard for mobile) ──────────
  // Solana Pay = same concept as bitcoin: URI — universally supported by Phantom, Solflare etc.
  const sendSolViaSolanaPay = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    const label   = encodeURIComponent('Xenia Presale');
    const message = encodeURIComponent(`Buy XEN tokens — Stage ${currentStage.stage}`);
    const memo    = encodeURIComponent(`xen-s${currentStage.stage}-${solAddr.slice(0,8)}`);
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
  const MIN_USD = 10;
  const handleBuy = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    if (usdEst < MIN_USD) {
      setTxError(`Minimum purchase is $${MIN_USD}. Enter a larger amount.`);
      setTxStatus('error');
      return;
    }
    setTxStatus('pending'); setTxError('');
    try {
      let hash = '';
      if (isBtc) {
        if (!btcConnected) throw new Error('Connect Bitcoin wallet first');
        if (activeWallet?.sendBtc) {
          // All wallets return txid directly:
          // Phantom → signPSBT + broadcast via mempool.space
          // Xverse  → sendTransfer API
          // OKX     → sendBitcoin API
          // Unisat  → sendBitcoin API
          hash = await sendBtc();
          if (hash) {
            try { await recordPurchase(hash, usdEst, tokensEst, btcAddr, 'BTC'); } catch { /* already retried internally */ }
          }
        } else {
          throw new Error('Bitcoin wallet not properly connected — please reconnect');
        }
      } else if (!isEvm) {
        if (!solConnected) throw new Error('Connect Solana wallet first');

        // Safety: if activeWallet was lost (page refresh), re-detect it now
        let solWallet = activeWallet;
        if (!solWallet?.sendSol) {
          try {
            const { buildSolWallets } = await import('../components/SolWalletPicker');
            const walletName = localStorage.getItem('_kleo_sol_wallet_name') || '';
            const wallets = buildSolWallets();
            solWallet = (wallets.find(x => x.name === walletName && x.sendSol)
                     ?? wallets.find(x => x.sendSol)) as any;
            if (solWallet) setActiveWallet(solWallet as any); // restore for future buys
          } catch { /* ignore */ }
        }

        if (solWallet?.sendSol) {
          // Injected wallet available — direct signAndSendTransaction
          hash = await (solWallet as any).sendSol(
            PRESALE_SOL_WALLET,
            Math.round(parseFloat(amount) * 1_000_000_000),
            await getSolanaConnection()
          );
          if (hash) {
            try { await recordPurchase(hash, usdEst, tokensEst, solAddr, 'SOL'); } catch { /* already retried internally */ }
          }
        } else {
          // No injected wallet detected — fall back to Solana Pay URI
          sendSolViaSolanaPay();
          return;
        }
      } else {
        // ── EVM send (ETH · BNB · USDC · USDT) ───────────────────────────────
        // Single unified path: wagmi handles BOTH injected wallets AND WalletConnect.
        // No window.ethereum calls for tx — wagmi's connector abstraction routes correctly.
        const senderAddress = address; // wagmi is the single source of truth for EVM address

        // Resolve target chain + token contract
        const tokenKey = (selected as any).token as string | undefined;
        const activeStableChain = tokenKey
          ? (STABLE_CHAINS[tokenKey]?.find((c: any) => c.id === stableChainId) ?? STABLE_CHAINS[tokenKey]?.[0])
          : null;
        const targetChainId = (activeStableChain?.chainId ?? selected.chainId) as number;

        // ── SOL USDC intercept (chainId=0 sentinel = Solana SPL path) ────────
        // Uses @solana/spl-token for reliable instruction building.
        // Buffer is imported explicitly at the top of this file — no polyfill needed.
        if (tokenKey === 'USDC' && stableChainId === 'sol') {
          if (!solConnected) {
            throw new Error('Connect your Solana wallet (Phantom or Solflare) first to send USDC on Solana');
          }

          const { PublicKey, Transaction }    = await import('@solana/web3.js');
          const {
            getAssociatedTokenAddress,
            createAssociatedTokenAccountInstruction,
            createTransferInstruction,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          } = await import('@solana/spl-token');

          // Browser-safe RPC — auto-detects devnet vs mainnet via Phantom network property
          const conn     = await getSolanaConnection();
          const rpcUrl   = (conn as any)._rpcEndpoint as string ?? '';
          const isDevnet = rpcUrl.includes('devnet');

          // USDC mint address
          const USDC_MINT = new PublicKey(
            isDevnet
              ? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'  // devnet Circle USDC
              : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // mainnet USDC
          );

          const senderPk  = new PublicKey(solAddr);
          const recipPk   = new PublicKey(PRESALE_SOL_WALLET);

          // Derive associated token accounts (ATAs)
          const senderATA = await getAssociatedTokenAddress(USDC_MINT, senderPk,  false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
          const recipATA  = await getAssociatedTokenAddress(USDC_MINT, recipPk,   false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

          // Amount in USDC base units (6 decimals)
          const usdcAmount = BigInt(Math.round(usdEst * 1_000_000));

          const tx = new Transaction();

          // Create recipient ATA if it doesn't exist yet (first time anyone sends USDC to this wallet)
          const recipATAInfo = await conn.getAccountInfo(recipATA);
          if (!recipATAInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                senderPk,   // payer (sender pays for ATA creation — ~0.002 SOL)
                recipATA,   // new ATA address
                recipPk,    // owner of the new ATA
                USDC_MINT,  // token mint
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )
            );
          }

          // SPL transfer instruction — battle-tested via @solana/spl-token
          tx.add(
            createTransferInstruction(
              senderATA,   // source ATA
              recipATA,    // destination ATA
              senderPk,    // authority (must sign)
              usdcAmount,  // amount in base units
              [],          // multisig signers (none)
              TOKEN_PROGRAM_ID
            )
          );

          const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
          tx.recentBlockhash = blockhash;
          tx.feePayer = senderPk;

          // Sign and broadcast via the connected Solana wallet
          const w = window as any;
          let splHash: string | undefined;

          // skipPreflight: true — bypasses local simulation so second attempts don't
          // silently fail when Phantom thinks the tx is duplicate or blockhash stale.
          // The validator will reject invalid txs on-chain with a clear error.
          if (w.phantom?.solana?.signAndSendTransaction) {
            const result = await w.phantom.solana.signAndSendTransaction(tx, { skipPreflight: true });
            splHash = result.signature;
          } else if (w.solflare?.signAndSendTransaction) {
            const result = await w.solflare.signAndSendTransaction(tx);
            splHash = result.signature ?? result;
          } else if (w.backpack?.solana?.signAndSendTransaction) {
            const result = await w.backpack.solana.signAndSendTransaction(tx);
            splHash = result.signature ?? result;
          } else if (w.okxwallet?.solana?.signAndSendTransaction) {
            const result = await w.okxwallet.solana.signAndSendTransaction(tx);
            splHash = result.signature ?? result;
          } else if (w.solana?.signAndSendTransaction) {
            // Generic injected Solana wallet (Coin98, Bitget, etc.)
            const result = await w.solana.signAndSendTransaction(tx);
            splHash = result.signature ?? result;
          } else {
            throw new Error('No compatible Solana wallet found. Please use Phantom, Solflare, Backpack, or OKX Wallet.');
          }

          // Record immediately on signature — do NOT wait for confirmTransaction.
          // confirmTransaction can timeout if RPC is slow, which would falsely
          // look like a failure even though the tx landed. Record first, confirm in background.
          hash = splHash ?? '';
          if (hash) {
            await recordPurchase(hash, usdEst, tokensEst, solAddr, 'USDC');
            setTxHash(hash);
            setTxStatus('success');
            // Confirm in background — only used to update explorer link
            conn.confirmTransaction({ signature: hash, blockhash, lastValidBlockHeight }, 'confirmed')
              .catch(() => { /* timeout is fine — tx is already recorded */ });
          }
          return;
        }

        if (!senderAddress) throw new Error('Connect an EVM wallet first');
        const tokenInfo = tokenKey ? getTokenInfo(tokenKey, stableChainId) : undefined;

        // ── Step 1: Switch chain if needed ────────────────────────────────────
        // switchChainAsync is fully async and resolves only after the wallet confirms.
        // It works for both injected AND WalletConnect connectors.
        // The returned chain object confirms the switch succeeded — no polling needed.
        if (currentChainId !== targetChainId) {
          const allChains = [...(STABLE_CHAINS.USDC ?? []), ...(STABLE_CHAINS.USDT ?? [])];
          const chainMeta = allChains.find(c => c.chainId === targetChainId);

          try {
            await switchChainAsync({ chainId: targetChainId });
          } catch (switchErr: any) {
            // Error 4902 = chain not added to wallet yet — add it first then switch
            const isUnknownChain = switchErr?.code === 4902 ||
              switchErr?.message?.includes('Unrecognized chain') ||
              switchErr?.message?.includes('does not support');

            if (isUnknownChain && chainMeta && (window as any).ethereum) {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{ chainId: chainMeta.chainHex, chainName: chainMeta.chainName,
                  nativeCurrency: chainMeta.nativeCurrency, rpcUrls: chainMeta.rpcUrls,
                  blockExplorerUrls: [chainMeta.blockExplorer] }],
              });
              // Retry switch after adding
              await switchChainAsync({ chainId: targetChainId });
            } else {
              throw new Error(
                chainMeta
                  ? `Switch to ${chainMeta.chainName} in your wallet, then try again.`
                  : `Please switch your wallet to chain ID ${targetChainId}.`
              );
            }
          }
          // Brief settle — wagmi needs one tick to update its internal chainId state
          // after switchChainAsync resolves, otherwise writeContractAsync sees chain: undefined
          await new Promise<void>(r => setTimeout(r, 300));
        }

        // ── Step 2: Send transaction ────────────────────────────────────────
        if (tokenInfo) {
          // ── ERC-20 (USDC / USDT) ────────────────────────────────────────
          // Precision-safe: multiply in BigInt to avoid float overflow at 18 decimals
          const centsAmount = BigInt(Math.round(usdEst * 100));
          const tokenAmount = centsAmount * (10n ** BigInt(tokenInfo.decimals)) / 100n;

          // Fetch live gas price — dual strategy to handle CORS + fast-moving L2 base fees
          // Strategy 1: eth_gasPrice (simpler, better CORS support than eth_getBlockByNumber)
          // Strategy 2: fixed high fallback (testnets — cost is irrelevant)
          let maxFeePerGas: bigint | undefined;
          let maxPriorityFeePerGas: bigint | undefined;
          try {
            const rpcUrl = activeStableChain?.rpcUrls?.[0];
            if (rpcUrl) {
              // Try eth_gasPrice first — wider RPC compatibility than eth_getBlockByNumber
              let fetched = false;
              try {
                const resp = await fetch(rpcUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }),
                });
                const rpcData = await resp.json();
                const gasPriceHex: string | undefined = rpcData?.result;
                if (gasPriceHex && gasPriceHex !== '0x0') {
                  const gasPrice = BigInt(gasPriceHex);
                  const tip = 10_000_000n; // 0.01 gwei priority fee
                  maxPriorityFeePerGas = tip;
                  maxFeePerGas = gasPrice * 5n + tip; // 5x buffer — safe for fast L2 base fees
                  fetched = true;
                }
              } catch { /* CORS or network error — try fallback */ }

              if (!fetched) {
                // Fallback: conservative fixed gas for testnet (50 gwei — always clears)
                const tip = 10_000_000n;
                maxPriorityFeePerGas = tip;
                maxFeePerGas = 50_000_000_000n + tip; // 50 gwei + tip
              }
            }
          } catch { /* silently fall back — wallet will estimate */ }

          // Standard ERC-20 ABI — MetaMask recognises this and shows "Transfer X USDC to 0x..."
          hash = await writeContractAsync({
            chainId: targetChainId,
            address: tokenInfo.address as `0x${string}`,
            abi: [{
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'recipient', type: 'address' },
                { name: 'amount',    type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            }] as const,
            functionName: 'transfer',
            args: [PRESALE_ETH_WALLET as `0x${string}`, tokenAmount],
            ...(maxFeePerGas ? { maxFeePerGas, maxPriorityFeePerGas } : {}),
          });
        } else {
          // ── Native (ETH / BNB) ──────────────────────────────────────────
          hash = await sendTransactionAsync({
            chainId: targetChainId,
            to: PRESALE_ETH_WALLET,
            value: parseEther(amount),
          });
        }
        try { await recordPurchase(hash, usdEst, tokensEst, senderAddress, selected.id); } catch { /* already retried internally */ }
      }
      if (hash) { setTxHash(hash); setTxStatus('success'); }
    } catch (err: any) {
      // Surface the real error — wallet errors often have message nested in err.error.message
      const msg: string =
        err?.error?.message ||   // Phantom wraps errors in err.error.message
        err?.message ||
        (typeof err === 'string' ? err : 'Transaction failed');

      console.error('[Xenia buy error]', err); // full error logged for debugging

      const friendlyMsg =
        (msg.includes('reject') || msg.includes('User') || msg.includes('cancel') || msg.includes('denied'))
          ? 'Transaction rejected — nothing was sent.'
          : msg.includes('insufficient funds') || msg.includes('Insufficient') || msg.includes('not enough')
            ? 'Insufficient balance — you need enough SOL/ETH for the amount plus gas fees.'
            : msg.includes('nonce') || msg.includes('underpriced')
              ? 'Transaction stuck — try resetting your wallet nonce or try again.'
              : msg.includes('timeout') || msg.includes('Timeout')
                ? 'Network timeout — check your wallet tx history before retrying.'
                : msg.includes('network') || msg.includes('Network') || msg.includes('fetch')
                  ? 'Network error — check your connection and try again.'
                  : msg.includes('TokenAccountNotFound') || msg.includes('token account')
                    ? 'USDC token account not found — make sure you have USDC in your wallet.'
                    : msg.includes('0x1') || msg.includes('custom program error')
                      ? 'Transaction simulation failed — check you have enough USDC and SOL for fees.'
                      : msg.length > 150 ? msg.slice(0, 150) + '…' : msg;

      setTxError(friendlyMsg);
      setTxStatus('error');
    }
  };

  const buyWithCard = async () => {
    const usd = parseFloat(cardUsd);
    if (!usd || usd < 10) return;

    // Use whichever wallet is connected — card payment just needs an address
    // to deliver tokens to. If none connected, we still proceed (user can
    // provide wallet after payment via the success page / email).
    const wallet = isBtc ? btcAddr : (isSolUsdc || !isEvm) ? solAddr : (address || '');

    setStripeLoading(true);
    setCardError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usdAmount: usd,
          tokens: tokensFor(usd),
          wallet: wallet || '0x0000000000000000000000000000000000000000',
          stage: currentStage.stage,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCardError(data.error || 'Could not start checkout — please try again.');
      }
    } catch (e: any) {
      console.error('Stripe:', e);
      setCardError('Network error — please check your connection and try again.');
    } finally {
      setStripeLoading(false);
    }
  };

  // Map every chain ID to its correct block explorer
  const EXPLORER: Record<number, string> = {
    [sepolia.id]:         'https://sepolia.etherscan.io/tx/',
    [bscTestnet.id]:      'https://testnet.bscscan.com/tx/',
    [arbitrumSepolia.id]: 'https://sepolia.arbiscan.io/tx/',
    [baseSepolia.id]:     'https://sepolia.basescan.org/tx/',
    [polygonAmoy.id]:     'https://www.oklink.com/amoy/tx/',
    // mainnet fallbacks (for when users are already on mainnet)
    1:     'https://etherscan.io/tx/',
    56:    'https://bscscan.com/tx/',
    137:   'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    8453:  'https://basescan.org/tx/',
  };
  const evmExplorerBase = EXPLORER[currentChainId ?? 0] ?? 'https://etherscan.io/tx/';
  const explorerUrl = txHash
    ? isBtc  ? `https://mempool.space/tx/${txHash}`
    : !isEvm ? `https://solscan.io/tx/${txHash}`
    : evmExplorerBase + txHash
    : null;

  const reset = () => { setTxStatus('idle'); setTxHash(''); setTxError(''); setAmount(''); };
  const presets: Record<string, number[]> = {
    SOL: [0.5, 1, 2, 5], ETH: [0.01, 0.05, 0.1, 0.5],
    BNB: [0.05, 0.2, 0.5, 1], BTC: [0.0005, 0.001, 0.005, 0.01],
    USDC: [10, 25, 50, 100], USDT: [10, 25, 50, 100],
  };
  const evmConnected = isConnected; // wagmi is the only truth; evmInjectedAddr no longer used as fallback
  const walletReady = isBtc ? btcConnected : isSolUsdc ? solConnected : isEvm ? evmConnected : solConnected;

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
            <h2 className="text-4xl font-bold text-[#F4F6FA]">Buy Xenia</h2>
          </div>
          <p className="text-[#2BFFF1] text-xl font-semibold">
            Stage {currentStage.stage} &mdash; ${currentStage.priceUsd.toFixed(4)} / XEN
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
                    localStorage.setItem('_kleo_active_currency', c.id);
                    // Auto-select Solana chain when SOL wallet connected + USDC picked
                    if (c.id === 'USDC' && solConnected) setStableChainId('sol');
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

            {/* Chain picker — shown when USDC or USDT selected */}
            {(currency === 'USDC' || currency === 'USDT') && (
              <div className="mb-4">
                <p className="text-[#A7B0B7] text-xs mb-2 font-medium">
                  Select network to send {currency} from:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(STABLE_CHAINS[currency] ?? []).map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => setStableChainId(sc.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${stableChainId === sc.id
                          ? 'bg-[#2BFFF1]/15 border-[#2BFFF1]/60 text-[#2BFFF1]'
                          : 'bg-white/5 border-white/10 text-[#A7B0B7] hover:border-white/25 hover:text-white'
                        }`}
                    >
                      <span className="text-sm leading-none">{sc.icon}</span>
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet connect section */}
            <div className="mb-5">
              {isEvm && !isSolUsdcActive ? (
                isConnected && address ? (
                  /* Single unified connected state — wagmi is the only source of truth */
                  <div className="flex items-center justify-between bg-[#2BFFF1]/5 border border-[#2BFFF1]/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[#F4F6FA] text-sm font-medium">{address.slice(0,6)}...{address.slice(-4)}</span>
                      <span className="text-[#2BFFF1] text-xs font-semibold">{evmInjectedName || connector?.name || 'Connected'} ✓</span>
                    </div>
                    <button onClick={disconnectEvmInjected}
                      className="text-[#A7B0B7] hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  /* Not connected — show wallet picker */
                  <button onClick={connectWallet}
                    className="w-full flex items-center justify-center gap-3 bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 hover:border-[#2BFFF1]/60 hover:bg-[#2BFFF1]/15 rounded-xl px-4 py-3.5 transition-all">
                    <span className="text-xl">👛</span>
                    <div className="text-left">
                      <p className="text-[#F4F6FA] font-semibold text-sm">Connect {selected.label} Wallet</p>
                      <p className="text-[#A7B0B7] text-xs">{isInEvmBrowser() ? 'Tap to connect instantly' : 'Opens in your wallet — 1 tap'}</p>
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
                  <BtcDiagnostic
                    onConnect={(addr, wallet) => {
                      localStorage.setItem('_kleo_btc_address', addr);
                      localStorage.setItem('_kleo_btc_wallet_name', wallet.name);
                      setBtcWallet(addr, wallet.name);
                      setActiveWallet(wallet);
                    }}
                    onError={(msg) => { setTxError(msg); setTxStatus('error'); }}
                    onPicker={() => setShowBtcPicker(true)}
                  />
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
                  <button onClick={connectWallet}
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
                <p className="text-[#A7B0B7] text-sm mb-3">{tokensEst.toLocaleString()} XEN reserved at Stage {currentStage.stage}</p>
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
                    {(presets[currency] ?? []).map(a => (
                      <button key={a} onClick={() => setAmount(String(a))}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#2BFFF1]/40 text-xs text-[#A7B0B7] transition-colors">
                        {(currency === 'USDC' || currency === 'USDT') ? `$${a}` : a}
                      </button>
                    ))}
                  </div>
                  {usdEst > 0 && (
                    <div className="mt-3 p-4 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/20 text-center">
                      <p className="text-[#A7B0B7] text-xs mb-1">You will receive approximately</p>
                      <p className="text-[#2BFFF1] text-2xl font-bold">
                        {tokensEst.toLocaleString()} <span className="text-base font-normal">XEN</span>
                      </p>
                      <p className="text-[#A7B0B7] text-xs mt-1">
                        {(currency === 'USDC' || currency === 'USDT')
                          ? `Sending ${amount} ${currency} directly`
                          : `~$${usdEst.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD`
                        }
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBuy}
                  disabled={!amount || parseFloat(amount) <= 0 || (txStatus as string) === 'pending' || usdEst < 10}
                  className="neon-button w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
                  {(txStatus as string) === 'pending'
                    ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Processing...</>
                    : usdEst > 0 && usdEst < 10
                      ? <>Min. $10 required</>
                      : <>Buy XEN with {selected.symbol} <ArrowRight className="w-5 h-5" /></>}
                </button>
              </>
            )}
            {txStatus === 'idle' && !walletReady && (
              <p className="text-center text-[#A7B0B7] text-sm mt-2">Connect your wallet above to continue</p>
            )}
          </>
        )}

        {/* ── CARD TAB ── */}
        {tab === 'card' && (() => {
          // Determine if any wallet is connected for token delivery
          const cardWalletAddr = solConnected ? solAddr
            : evmConnected ? (address || '')
            : btcConnected ? btcAddr
            : '';
          const cardWalletLabel = solConnected ? `SOL: ${solAddr.slice(0,6)}...${solAddr.slice(-4)}`
            : evmConnected ? `EVM: ${(address||'').slice(0,6)}...${(address||'').slice(-4)}`
            : btcConnected ? `BTC: ${btcAddr.slice(0,8)}...${btcAddr.slice(-6)}`
            : '';

          return (
          <div>
            {/* ── Card success state ── */}
            {cardSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-bold text-xl mb-1">Payment Confirmed!</p>
                <p className="text-[#A7B0B7] text-sm mb-1">
                  {cardSuccess.tokens.toLocaleString()} XEN reserved
                </p>
                <p className="text-[#A7B0B7] text-xs mb-5">
                  You'll receive your tokens at launch. Check your email for a receipt.
                </p>
                <button onClick={() => setCardSuccess(null)}
                  className="text-[#2BFFF1] text-sm hover:underline">
                  Buy More
                </button>
              </div>

            ) : !cardWalletAddr ? (
              /* ── Step 1: Wallet required ── */
              <div>
                <div className="mb-5 p-5 rounded-2xl border border-[#2BFFF1]/20 bg-[#2BFFF1]/5 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#2BFFF1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6m18 0v3M3 6v3" />
                    </svg>
                  </div>
                  <p className="text-[#F4F6FA] font-semibold mb-1">Connect a wallet first</p>
                  <p className="text-[#A7B0B7] text-sm">
                    We need your wallet address to deliver your XEN tokens at launch.
                  </p>
                </div>

                <div className="space-y-2 mb-5">
                  {/* SOL */}
                  <button onClick={() => { setTab('crypto'); setCurrency('SOL'); setTimeout(connectWallet, 100); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#2BFFF1]/40 hover:bg-[#2BFFF1]/5 transition-all">
                    <span className="text-2xl">◎</span>
                    <div className="text-left">
                      <p className="text-[#F4F6FA] text-sm font-semibold">Solana Wallet</p>
                      <p className="text-[#A7B0B7] text-xs">Phantom, Solflare, Backpack…</p>
                    </div>
                    <svg className="w-4 h-4 text-[#A7B0B7] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>

                  {/* EVM */}
                  <button onClick={() => { setTab('crypto'); setCurrency('ETH'); setTimeout(connectWallet, 100); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#2BFFF1]/40 hover:bg-[#2BFFF1]/5 transition-all">
                    <span className="text-2xl">⬡</span>
                    <div className="text-left">
                      <p className="text-[#F4F6FA] text-sm font-semibold">EVM Wallet</p>
                      <p className="text-[#A7B0B7] text-xs">MetaMask, Coinbase, WalletConnect…</p>
                    </div>
                    <svg className="w-4 h-4 text-[#A7B0B7] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>

                  {/* BTC */}
                  <button onClick={() => { setTab('crypto'); setCurrency('BTC'); setTimeout(connectWallet, 100); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#2BFFF1]/40 hover:bg-[#2BFFF1]/5 transition-all">
                    <span className="text-2xl">₿</span>
                    <div className="text-left">
                      <p className="text-[#F4F6FA] text-sm font-semibold">Bitcoin Wallet</p>
                      <p className="text-[#A7B0B7] text-xs">Phantom, Xverse, OKX…</p>
                    </div>
                    <svg className="w-4 h-4 text-[#A7B0B7] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <p className="text-center text-[#A7B0B7]/60 text-xs">
                  Your wallet address is only used to deliver tokens — we never request funds from it here.
                </p>
              </div>

            ) : (
              /* ── Step 2: Amount + Pay ── */
              <>
                {/* Error banner */}
                {cardError && (
                  <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm">{cardError}</p>
                      <button onClick={() => setCardError('')} className="text-[#2BFFF1] text-xs hover:underline mt-1">Dismiss</button>
                    </div>
                  </div>
                )}

                {/* Connected wallet — delivery address */}
                <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/20 bg-green-500/5">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-green-400 text-xs font-semibold mb-0.5">Delivery wallet connected</p>
                    <p className="text-[#F4F6FA] text-xs font-mono truncate">{cardWalletLabel}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-[#A7B0B7] mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7B0B7] font-medium">$</span>
                    <input type="number" value={cardUsd} onChange={e => { setCardUsd(e.target.value); setCardError(''); }}
                      placeholder="100" min="10"
                      className="input-glass w-full pl-8 pr-5 py-5 text-2xl font-semibold" />
                  </div>
                  {cardUsd && parseFloat(cardUsd) > 0 && (
                    <p className="text-[#2BFFF1] text-sm mt-2 text-center">
                      ~{tokensFor(parseFloat(cardUsd)).toLocaleString()} XEN at ${currentStage.priceUsd.toFixed(4)}
                    </p>
                  )}
                  {cardUsd && parseFloat(cardUsd) > 0 && parseFloat(cardUsd) < 10 && (
                    <p className="text-red-400 text-xs mt-1 text-center">Minimum purchase is $10</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {[50, 100, 250, 500].map(a => (
                      <button key={a} onClick={() => { setCardUsd(String(a)); setCardError(''); }}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#2BFFF1]/40 text-sm text-[#A7B0B7] transition-colors">
                        ${a}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={buyWithCard} disabled={stripeLoading || !cardUsd || parseFloat(cardUsd) < 10}
                  className="neon-button w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
                  {stripeLoading
                    ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirecting to Stripe...</>
                    : <>Pay with Card <ExternalLink className="w-5 h-5" /></>}
                </button>
                <p className="text-center text-[#A7B0B7] text-xs mt-3">Min $10 &middot; Secured by Stripe &middot; XEN delivered at launch</p>
              </>
            )}
          </div>
          );
        })()}
      </div>

      {/* ── INJECTED WALLET PICKER MODAL (desktop / in-app browser) ── */}
      {/* ── SOL WALLET PICKER ── */}
      <SolWalletPicker
        onConnect={(addr, wallet) => {
          dropEvmConnection();
          setSolWallet(addr, wallet.name);
          setActiveWallet(wallet as unknown as DetectedWallet);
          // Persist wallet name so we can restore activeWallet on page reload
          localStorage.setItem('_kleo_sol_wallet_name', wallet.name);
          localStorage.setItem('_kleo_sol_address', addr);
        }}
      />

      {/* ── BTC INJECTED MULTI-WALLET PICKER (>1 BTC wallet installed) ── */}
      {showBtcInjectedPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowBtcInjectedPicker(false)}>
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,340px)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#F4F6FA] font-bold text-lg">Choose Bitcoin Wallet</h3>
              <button onClick={() => setShowBtcInjectedPicker(false)} className="text-[#A7B0B7] hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              {injectedBtcWallets.map(w => (
                <button key={w.id} onClick={() => connectInjected(w)}
                  className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/30 rounded-xl px-4 py-4 transition-all">
                  <span className="text-2xl">{String(w.icon)}</span>
                  <span className="font-semibold text-[#F4F6FA]">{w.name}</span>
                  <span className="ml-auto text-orange-400 text-xs font-semibold">Detected</span>
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
      {/* EVM picker moved to global <EvmWalletPicker> in App.tsx — triggered via walletStore.showEvmPicker */}

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
              <p className="text-[#A7B0B7] text-xs mt-1">Network: Solana Mainnet</p>
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
              Your XEN tokens will be reserved once we verify the transaction on-chain.
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
              Your XEN tokens will be reserved once we verify the transaction on-chain.
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
              Your XEN tokens will be reserved once we verify the transaction on-chain.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
