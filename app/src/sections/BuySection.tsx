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

// ── YOUR RECEIVING WALLET ADDRESSES — replace before going live ──────────
const PRESALE_ETH_WALLET = '0x0722ef1dcfa7849b3bf0db375793bfacc52b8e39' as `0x${string}`;
const PRESALE_SOL_WALLET = 'HAEC8fjg9Wpg1wpL8j5EQFRmrq4dj8BqYQVKgZZdKmRM'; // ← replace this
const PRESALE_BTC_WALLET = 'bc1q3rdjpm36lcy30amzfkaqpvvm5xu8n8y665ajlx';

// SOL via window.phantom – Phantom injects this automatically when installed
type PhantomProvider = {
  isConnected: boolean;
  publicKey: { toString: () => string } | null;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
};
// Bitcoin wallet API (Phantom, MetaMask BTC account, etc.)
type BitcoinProvider = {
  connect: () => Promise<{ address: string; publicKey: string }[]>;
  sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
  disconnect?: () => Promise<void>;
};
declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider; bitcoin?: BitcoinProvider };
    solana?: PhantomProvider;
  }
}

// CoinGecko IDs for live price fetching
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  BTC: 'bitcoin',
};

const CURRENCIES = [
  { id: 'SOL', label: 'Solana',   symbol: 'SOL', icon: '◎', color: 'text-purple-400',  chain: 'sol' },
  { id: 'ETH', label: 'Ethereum', symbol: 'ETH', icon: 'Ξ', color: 'text-blue-400',    chain: 'evm', chainId: mainnet.id },
  { id: 'BNB', label: 'BNB',      symbol: 'BNB', icon: '◆', color: 'text-yellow-400',  chain: 'evm', chainId: bsc.id },
  { id: 'BTC', label: 'Bitcoin',  symbol: 'BTC', icon: '₿', color: 'text-orange-400',  chain: 'btc' },
];

export function BuySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  const { totalRaised, addRaised, addPurchase } = usePresaleStore();
  const currentStage = getCurrentStage(totalRaised);

  // Wagmi hooks for EVM
  const { address, isConnected, chain } = useAccount();
  const { data: evmBalance }            = useBalance({ address });
  const { sendTransactionAsync }        = useSendTransaction();
  const { switchChainAsync }            = useSwitchChain();

  // Local state
  const [tab,           setTab]          = useState<'crypto' | 'card'>('crypto');
  const [currency,      setCurrency]     = useState('SOL');
  const [amount,        setAmount]       = useState('');
  const [usdEst,        setUsdEst]       = useState(0);
  const [txStatus,      setTxStatus]     = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash,        setTxHash]       = useState('');
  const [txError,       setTxError]      = useState('');
  const [cardUsd,       setCardUsd]      = useState('100');
  const [stripeLoading, setStripeLoading] = useState(false);

  // Phantom Solana state (separate from EVM)
  const [solAddr,       setSolAddr]      = useState('');
  const [solConnected,  setSolConnected] = useState(false);

  // Bitcoin wallet state
  const [btcAddr,       setBtcAddr]      = useState('');
  const [btcConnected,  setBtcConnected] = useState(false);

  // Live crypto prices from CoinGecko
  const [liveRates,     setLiveRates]    = useState<Record<string, number>>({ ETH: 3200, BNB: 580, SOL: 170, BTC: 65000 });
  const [priceLoading,  setPriceLoading] = useState(false);
  const [priceError,    setPriceError]   = useState(false);

  const selected  = CURRENCIES.find(c => c.id === currency)!;
  const isEvm     = selected.chain === 'evm';
  const isBtc     = selected.chain === 'btc';

  // ── Detect Phantom Solana + Bitcoin on mount ────────────────────────────
  useEffect(() => {
    const phantom = window.phantom?.solana || window.solana;
    if (phantom?.isConnected && phantom.publicKey) {
      setSolAddr(phantom.publicKey.toString());
      setSolConnected(true);
    }
    // Bitcoin wallet auto-detect (Phantom BTC, MetaMask BTC account)
    const btcProvider = window.phantom?.bitcoin;
    if (btcProvider) {
      btcProvider.connect().then(accounts => {
        if (accounts?.[0]?.address) {
          setBtcAddr(accounts[0].address);
          setBtcConnected(true);
        }
      }).catch(() => {});
    }
  }, []);

  // ── Fetch live prices from CoinGecko ────────────────────────────────────
  useEffect(() => {
    const ids = Object.values(COINGECKO_IDS).join(',');
    setPriceLoading(true);
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
      .then(r => r.json())
      .then(data => {
        const rates: Record<string, number> = {};
        for (const [sym, geckoId] of Object.entries(COINGECKO_IDS)) {
          if (data[geckoId]?.usd) rates[sym] = data[geckoId].usd;
        }
        if (Object.keys(rates).length > 0) {
          setLiveRates(prev => ({ ...prev, ...rates }));
          setPriceError(false);
        }
      })
      .catch(() => setPriceError(true))
      .finally(() => setPriceLoading(false));
  }, []);

  // ── USD estimate using live price ────────────────────────────────────────
  useEffect(() => {
    const n = parseFloat(amount);
    if (!n || n <= 0) { setUsdEst(0); return; }
    setUsdEst(n * (liveRates[currency] || 1));
  }, [amount, currency, liveRates]);

  const tokensFor = (usd: number) => Math.floor(usd / currentStage.priceUsd);
  const tokensEst = tokensFor(usdEst);

  // ── GSAP entrance ───────────────────────────────────────────────────────
  useEffect(() => {
    if (sectionRef.current && cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true } }
      );
    }
  }, []);

  // ── Record purchase to Supabase + store ─────────────────────────────────
  const recordPurchase = useCallback(async (
    hash: string, usd: number, tokens: number, wallet: string, method: string
  ) => {
    addRaised(usd);
    addPurchase({ usdSpent: usd, kleoReceived: tokens, stage: currentStage.stage, priceUsd: currentStage.priceUsd, txHash: hash, timestamp: Date.now(), cryptoType: method });
    if (supabase) {
      const { error } = await supabase.from('presale_purchases').insert({
        wallet_address: wallet.toLowerCase(),
        tokens,
        eth_spent: 0,
        usd_amount: usd,
        stage: currentStage.stage,
        price_eth: currentStage.priceUsd,
        tx_hash: hash,
        payment_method: method.toLowerCase(),
      });
      if (error) console.error('Supabase insert:', error.message);
    }
  }, [addRaised, addPurchase, currentStage]);

  // ── Connect Phantom Solana ───────────────────────────────────────────────
  const connectSolana = async () => {
    const phantom = window.phantom?.solana || window.solana;
    if (!phantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      const resp = await phantom.connect();
      setSolAddr(resp.publicKey.toString());
      setSolConnected(true);
    } catch {
      // user rejected
    }
  };

  // ── Connect Bitcoin wallet (Phantom BTC / MetaMask BTC) ─────────────────
  const connectBtc = async () => {
    const btcProvider = window.phantom?.bitcoin;
    if (!btcProvider) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      const accounts = await btcProvider.connect();
      if (accounts?.[0]?.address) {
        setBtcAddr(accounts[0].address);
        setBtcConnected(true);
      }
    } catch {
      // user rejected
    }
  };

  // ── Send BTC transaction via Phantom/MetaMask Bitcoin ────────────────────
  const sendBtc = async (): Promise<string> => {
    const btcProvider = window.phantom?.bitcoin;
    if (!btcProvider) throw new Error('No Bitcoin wallet detected. Install Phantom.');
    const n = parseFloat(amount);
    if (!n || n <= 0) throw new Error('Invalid amount');
    const satoshis = Math.round(n * 100_000_000); // 1 BTC = 100,000,000 satoshis
    const txid = await btcProvider.sendBitcoin(PRESALE_BTC_WALLET, satoshis);
    return txid;
  };

  // ── Send SOL transaction via Phantom ────────────────────────────────────
  const sendSol = async () => {
    const phantom = window.phantom?.solana || window.solana;
    if (!phantom?.isConnected || !phantom.publicKey) throw new Error('Phantom not connected');

    // Dynamic import to avoid bundling Solana web3 if not needed
    const { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } =
      await import('@solana/web3.js');

    const conn = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(phantom.publicKey.toString()),
        toPubkey:   new PublicKey(PRESALE_SOL_WALLET),
        lamports:   Math.round(parseFloat(amount) * LAMPORTS_PER_SOL),
      })
    );
    const { blockhash } = await conn.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = new PublicKey(phantom.publicKey.toString());

    const { signature } = await phantom.signAndSendTransaction(tx);
    return signature;
  };

  // ── Main buy handler ────────────────────────────────────────────────────
  const handleBuy = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setTxStatus('pending');
    setTxError('');

    try {
      let hash = '';

      if (isBtc) {
        // Bitcoin
        if (!btcConnected) throw new Error('Connect Bitcoin wallet first');
        hash = await sendBtc();
        await recordPurchase(hash, usdEst, tokensEst, btcAddr, 'BTC');
      } else if (!isEvm) {
        // SOL
        if (!solConnected) throw new Error('Connect Phantom first');
        hash = (await sendSol()) || '';
        await recordPurchase(hash, usdEst, tokensEst, solAddr, 'SOL');
      } else {
        // ETH or BNB
        if (!address) throw new Error('Connect wallet first');
        if (chain?.id !== selected.chainId) {
          await switchChainAsync({ chainId: selected.chainId! });
        }
        hash = await sendTransactionAsync({
          to: PRESALE_ETH_WALLET,
          value: parseEther(amount),
        });
        await recordPurchase(hash, usdEst, tokensEst, address, selected.id);
      }

      setTxHash(hash);
      setTxStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setTxError(
        msg.includes('reject') || msg.includes('User') || msg.includes('cancel')
          ? 'Transaction rejected — nothing was sent'
          : msg
      );
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
    } catch (err) {
      console.error('Stripe error:', err);
    } finally {
      setStripeLoading(false);
    }
  };

  const explorerUrl = txHash
    ? isBtc
      ? `https://mempool.space/tx/${txHash}`
      : !isEvm
        ? `https://solscan.io/tx/${txHash}`
        : selected.chainId === bsc.id
          ? `https://bscscan.com/tx/${txHash}`
          : `https://etherscan.io/tx/${txHash}`
    : null;

  const reset = () => { setTxStatus('idle'); setTxHash(''); setTxError(''); setAmount(''); };

  // Quick amount presets per currency
  const presets: Record<string, number[]> = {
    SOL: [0.5, 1, 2, 5],
    ETH: [0.01, 0.05, 0.1, 0.5],
    BNB: [0.05, 0.2, 0.5, 1],
    BTC: [0.0005, 0.001, 0.005, 0.01],
  };

  // Balance display
  const balanceDisplay = isEvm && evmBalance
    ? `${parseFloat(evmBalance.formatted).toFixed(4)} ${evmBalance.symbol}`
    : null;

  // Is wallet ready to transact?
  const walletReady = isBtc ? btcConnected : isEvm ? isConnected : solConnected;

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
          <button onClick={() => setTab('crypto')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${tab === 'crypto' ? 'bg-[#2BFFF1] text-[#05060B] shadow-lg' : 'text-[#A7B0B7] hover:text-white'}`}>
            Crypto
          </button>
          <button onClick={() => setTab('card')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${tab === 'card' ? 'bg-[#2BFFF1] text-[#05060B] shadow-lg' : 'text-[#A7B0B7] hover:text-white'}`}>
            <CreditCard className="w-4 h-4" /> Card
          </button>
        </div>

        {/* ── CRYPTO TAB ────────────────────────────────────────────────── */}
        {tab === 'crypto' && (
          <>
            {/* Currency selector */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {CURRENCIES.map((c) => (
                <button key={c.id}
                  onClick={() => { setCurrency(c.id); reset(); }}
                  className={`py-3 px-2 rounded-xl border text-center transition-all duration-200 ${
                    currency === c.id
                      ? 'border-[#2BFFF1]/60 bg-[#2BFFF1]/10 scale-[1.03]'
                      : 'border-white/10 bg-white/5 hover:border-white/25'
                  }`}>
                  <div className={`text-2xl font-bold ${c.color}`}>{c.icon}</div>
                  <div className="text-xs text-[#A7B0B7] mt-1 font-semibold">{c.symbol}</div>
                  <div className="text-[10px] text-[#A7B0B7]/50">{c.label}</div>
                </button>
              ))}
            </div>

            {/* Wallet connect — EVM: RainbowKit | SOL: Phantom | BTC: Phantom Bitcoin */}
            {isEvm ? (
              <div className="mb-5">
                {isConnected && evmBalance ? (
                  <div className="flex items-center justify-between bg-[#2BFFF1]/5 border border-[#2BFFF1]/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
                    <span className="text-[#2BFFF1] font-semibold text-sm">{balanceDisplay}</span>
                  </div>
                ) : (
                  <div className="[&>div]:w-full [&_button]:!w-full [&_button]:!py-3.5 [&_button]:!rounded-xl [&_button]:!font-semibold [&_button]:!text-sm">
                    <ConnectButton label={`Connect wallet for ${selected.label}`} />
                  </div>
                )}
              </div>
            ) : isBtc ? (
              <div className="mb-5">
                {btcConnected ? (
                  <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">
                        {btcAddr.slice(0, 8)}...{btcAddr.slice(-6)}
                      </span>
                    </div>
                    <span className="text-orange-400 font-semibold text-sm">Bitcoin</span>
                  </div>
                ) : (
                  <button onClick={connectBtc}
                    className="w-full flex items-center justify-center gap-3 bg-orange-600/20 border border-orange-500/40 hover:border-orange-400/70 hover:bg-orange-600/30 rounded-xl px-4 py-3.5 transition-all">
                    <span className="text-2xl leading-none text-orange-400">₿</span>
                    <span className="text-orange-300 font-semibold">Connect Bitcoin Wallet</span>
                    <span className="text-[#A7B0B7] text-xs">(Phantom / MetaMask)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="mb-5">
                {solConnected ? (
                  <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[#F4F6FA] text-sm font-medium">
                        {solAddr.slice(0, 6)}...{solAddr.slice(-4)}
                      </span>
                    </div>
                    <span className="text-purple-300 font-semibold text-sm">Phantom</span>
                  </div>
                ) : (
                  <button onClick={connectSolana}
                    className="w-full flex items-center justify-center gap-3 bg-purple-600/20 border border-purple-500/40 hover:border-purple-400/70 hover:bg-purple-600/30 rounded-xl px-4 py-3.5 transition-all">
                    <span className="text-2xl leading-none">◎</span>
                    <span className="text-purple-300 font-semibold">Connect Phantom / Solflare</span>
                  </button>
                )}
              </div>
            )}

            {/* TX result states */}
            {txStatus === 'success' && (
              <div className="mb-5 p-5 rounded-xl border border-green-500/30 bg-green-500/5 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-bold text-lg mb-1">Transaction Confirmed!</p>
                <p className="text-[#A7B0B7] text-sm mb-3">
                  {tokensEst.toLocaleString()} KLEO reserved at Stage {currentStage.stage}
                </p>
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

            {/* Amount input — only show when wallet connected and not in success/error */}
            {txStatus === 'idle' && walletReady && (
              <>
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#A7B0B7] text-sm">Amount to spend</label>
                    <span className="text-xs text-[#A7B0B7]/70 flex items-center gap-1">
                      {priceLoading
                        ? <span className="text-[#2BFFF1]/50">Fetching price...</span>
                        : priceError
                        ? <span className="text-yellow-500/70">Using cached price</span>
                        : <span className="text-green-400/80">1 {selected.symbol} = ${liveRates[currency]?.toLocaleString('en-US', {maximumFractionDigits: 2})}</span>
                      }
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      min="0"
                      step="any"
                      className="input-glass w-full px-5 py-5 text-2xl font-semibold pr-20"
                    />
                    <span className={`absolute right-5 top-1/2 -translate-y-1/2 font-bold text-lg ${selected.color}`}>
                      {selected.symbol}
                    </span>
                  </div>

                  {/* Preset amounts */}
                  <div className="flex gap-2 mt-3">
                    {presets[currency].map(a => (
                      <button key={a} onClick={() => setAmount(String(a))}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#2BFFF1]/40 text-xs text-[#A7B0B7] transition-colors">
                        {a}
                      </button>
                    ))}
                  </div>

                  {/* KLEO estimate */}
                  {usdEst > 0 && (
                    <div className="mt-3 p-4 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/20 text-center">
                      <p className="text-[#A7B0B7] text-xs mb-1">You will receive approximately</p>
                      <p className="text-[#2BFFF1] text-2xl font-bold">
                        {tokensEst.toLocaleString()} <span className="text-base font-normal">KLEO</span>
                      </p>
                      <p className="text-[#A7B0B7] text-xs mt-1">
                        ~${usdEst.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBuy}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="neon-button w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <>Buy KLEO with {selected.symbol} <ArrowRight className="w-5 h-5" /></>
                </button>
              </>
            )}

            {txStatus === 'idle' && !walletReady && (
              <p className="text-center text-[#A7B0B7] text-sm mt-2">
                Connect your wallet above to continue
              </p>
            )}
          </>
        )}

        {/* ── CARD TAB ──────────────────────────────────────────────────── */}
        {tab === 'card' && (
          <div>
            <div className="mb-5">
              <label className="block text-[#A7B0B7] mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7B0B7] font-medium">$</span>
                <input
                  type="number"
                  value={cardUsd}
                  onChange={(e) => setCardUsd(e.target.value)}
                  placeholder="100"
                  min="10"
                  className="input-glass w-full pl-8 pr-5 py-5 text-2xl font-semibold"
                />
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

            <button
              onClick={buyWithCard}
              disabled={stripeLoading || !cardUsd || parseFloat(cardUsd) < 10}
              className="neon-button w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {stripeLoading ? (
                <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirecting...</>
              ) : (
                <>Pay with Card <ExternalLink className="w-5 h-5" /></>
              )}
            </button>
            <p className="text-center text-[#A7B0B7] text-xs mt-3">
              Min $10 &middot; Secured by Stripe &middot; KLEO delivered at launch
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
