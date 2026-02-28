/**
 * BtcConnect — Bitcoin wallet connection component
 *
 * All wallets (Phantom, Xverse, OKX, Unisat) auto-record to Supabase.
 * Phantom uses signPSBT → broadcast via mempool.space (no redirect needed).
 * Xverse, OKX, Unisat use their native sendBitcoin/sendTransfer APIs.
 */

import { useState } from 'react';

// ── PSBT-based send for Phantom Bitcoin ───────────────────────────────────
// Phantom exposes signPSBT but not sendBitcoin, so we:
// 1. Fetch UTXOs from mempool.space
// 2. Build a PSBT with @scure/btc-signer
// 3. Phantom signs in-app (approval popup, no redirect)
// 4. We finalize + broadcast → get txid back → auto-records to Supabase
export async function phantomSendBitcoin(
  fromAddress: string,
  toAddress: string,
  satoshis: number,
): Promise<string> {
  const { Address, NETWORK, OutScript, selectUTXO, Transaction } =
    await import('@scure/btc-signer');

  // 1. Fetch confirmed UTXOs
  const utxoRes = await fetch(
    `https://mempool.space/api/address/${fromAddress}/utxo`
  );
  if (!utxoRes.ok) throw new Error('Failed to fetch UTXOs from mempool.space');
  const rawUtxos: { txid: string; vout: number; value: number; status: { confirmed: boolean } }[] =
    await utxoRes.json();

  const utxos = rawUtxos
    .filter(u => u.status.confirmed)
    .map(u => {
      const addrDecoded = Address(NETWORK).decode(fromAddress);
      const script = OutScript.encode(addrDecoded);
      return {
        txid: u.txid,
        index: u.vout,
        value: BigInt(u.value),
        witnessUtxo: { script, amount: BigInt(u.value) },
      };
    });

  if (utxos.length === 0)
    throw new Error('No confirmed BTC found — funds may still be pending confirmation');

  // 2. Get fee rate
  let feePerByte = 10n;
  try {
    const feeRes = await fetch('https://mempool.space/api/v1/fees/recommended');
    const fees = await feeRes.json();
    feePerByte = BigInt(fees.halfHourFee ?? 10);
  } catch {}

  // 3. Select UTXOs + build unsigned transaction
  const selected = selectUTXO(
    utxos,
    [{ address: toAddress, amount: BigInt(satoshis) }],
    'default',
    {
      changeAddress: fromAddress,
      feePerByte,
      network: NETWORK,
      bip69: false,
      createTx: true,
      dust: 546,
    }
  );
  if (!selected?.tx)
    throw new Error('Insufficient BTC balance (including network fee)');

  // 4. Export as base64 PSBT
  const psbtBytes = selected.tx.toPSBT();
  const psbtBase64 = btoa(String.fromCharCode(...psbtBytes));

  // 5. Ask Phantom to sign — shows native approval popup
  const phantom = (window as any).phantom.bitcoin;
  const inputCount = selected.tx.inputsLength;
  const inputsToSign = Array.from({ length: inputCount }, (_, i) => ({
    index: i,
    address: fromAddress,
  }));

  const signedResult = await phantom.signPSBT(psbtBase64, {
    inputsToSign,
    broadcast: false, // we broadcast ourselves to get the txid
  });

  // signedResult is base64 string or { psbtBase64 } depending on Phantom version
  const signedB64: string =
    typeof signedResult === 'string'
      ? signedResult
      : signedResult?.psbtBase64 ?? signedResult;

  // 6. Finalize and extract raw tx
  const signedBytes = Uint8Array.from(atob(signedB64), c => c.charCodeAt(0));
  const finalTx = Transaction.fromPSBT(signedBytes);
  finalTx.finalize();
  const rawBytes = finalTx.extract();
  const rawHex = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // 7. Broadcast
  const broadcastRes = await fetch('https://mempool.space/api/tx', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: rawHex,
  });
  if (!broadcastRes.ok) {
    const err = await broadcastRes.text();
    throw new Error('Broadcast failed: ' + err.slice(0, 200));
  }
  return await broadcastRes.text(); // txid
}

// ── DetectedWallet interface ───────────────────────────────────────────────
interface DetectedWallet {
  id: string; name: string; icon: string; color: string;
  connect: () => Promise<string>;
  sendBtc?: (to: string, satoshis: number) => Promise<string>;
}

interface Props {
  onConnect: (addr: string, wallet: DetectedWallet) => void;
  onError:   (msg: string) => void;
  onPicker:  () => void;
}

// ── Detect all injected Bitcoin providers ──────────────────────────────────
function detectInjectedBtc(): DetectedWallet[] {
  const w = window as any;
  const list: DetectedWallet[] = [];

  if (w.phantom?.bitcoin) {
    list.push({
      id: 'phantom-btc', name: 'Phantom', icon: '👻', color: 'text-purple-400',
      connect: async () => {
        const accs = await w.phantom.bitcoin.requestAccounts();
        return accs.find((a: any) => a.purpose === 'payment')?.address
            ?? accs[0]?.address ?? '';
      },
      // Uses signPSBT flow — auto-records txid, no redirect
      sendBtc: (to, sat) => {
        // fromAddress captured at call time via btcAddr in BuySection
        // We need the sender address — it's passed as the first arg by sendBtc wrapper
        return phantomSendBitcoin('__FROM__', to, sat);
      },
    });
  }

  const xp = w.XverseProviders?.BitcoinProvider ?? w.BitcoinProvider;
  if (xp) {
    list.push({
      id: 'xverse', name: 'Xverse', icon: '✦', color: 'text-blue-400',
      connect: async () => {
        const r = await xp.request('getAccounts', {
          purposes: ['payment'],
          message: 'Connect to Kaleo presale',
        });
        return r?.result?.addresses?.[0]?.address ?? r?.addresses?.[0]?.address ?? '';
      },
      sendBtc: async (to, sat) => {
        const r = await xp.request('sendTransfer', {
          recipients: [{ address: to, amount: sat }],
        });
        return r?.result?.txid ?? r?.txid ?? '';
      },
    });
  }

  if (w.okxwallet?.bitcoin) {
    list.push({
      id: 'okx-btc', name: 'OKX Wallet', icon: '⭕', color: 'text-gray-300',
      connect: async () => {
        const accs = await w.okxwallet.bitcoin.requestAccounts();
        return accs[0]?.address ?? accs[0] ?? '';
      },
      sendBtc: (to, sat) => w.okxwallet.bitcoin.sendBitcoin(to, sat),
    });
  }

  if (w.unisat) {
    list.push({
      id: 'unisat', name: 'Unisat', icon: '🟠', color: 'text-orange-400',
      connect: async () => {
        const accs = await w.unisat.requestAccounts();
        return accs[0] ?? '';
      },
      sendBtc: (to, sat) => w.unisat.sendBitcoin(to, sat),
    });
  }

  return list;
}

// ── Browser deep-link openers ──────────────────────────────────────────────
const BTC_BROWSER_WALLETS = [
  {
    id: 'phantom', name: 'Phantom', icon: '👻', desc: 'BTC · SOL · ETH',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      const ref = encodeURIComponent(new URL(url).origin);
      if (/Android/i.test(navigator.userAgent))
        window.location.href = `intent://browse/${enc}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=https%3A%2F%2Fphantom.app;end`;
      else
        window.location.href = `https://phantom.app/ul/browse/${enc}?ref=${ref}`;
    },
  },
  {
    id: 'xverse', name: 'Xverse', icon: '✦', desc: 'BTC · Ordinals · Runes',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      if (/Android/i.test(navigator.userAgent))
        window.location.href = `intent://browser?url=${enc}#Intent;scheme=xverse;package=com.secretkeylabs.xverse;S.browser_fallback_url=https%3A%2F%2Fwww.xverse.app;end`;
      else
        window.location.href = `https://www.xverse.app/browser?url=${enc}`;
    },
  },
  {
    id: 'okx', name: 'OKX Wallet', icon: '⭕', desc: 'BTC · ETH · BNB · SOL',
    openUrl: (url: string) => {
      const enc = encodeURIComponent(url);
      if (/Android/i.test(navigator.userAgent))
        window.location.href = `intent://browser?url=${enc}#Intent;scheme=okex;package=com.okinc.okex.gp;S.browser_fallback_url=https%3A%2F%2Fwww.okx.com%2Fweb3;end`;
      else
        window.location.href = `okx://wallet/dapp/url?dappUrl=${enc}`;
    },
  },
  {
    id: 'unisat', name: 'Unisat', icon: '🟠', desc: 'BTC · Ordinals · BRC-20',
    openUrl: (url: string) => {
      window.location.href = `unisat://browser?url=${encodeURIComponent(url)}`;
      setTimeout(() => window.open('https://unisat.io', '_blank'), 1500);
    },
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export function BtcDiagnostic({ onConnect, onError }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const injected = detectInjectedBtc();

  const connectDirect = async (wallet: DetectedWallet) => {
    setConnecting(true);
    try {
      const addr = await wallet.connect();
      if (addr) {
        // Patch Phantom's sendBtc to capture the from-address at connect time
        if (wallet.id === 'phantom-btc') {
          wallet = {
            ...wallet,
            sendBtc: (to, sat) => phantomSendBitcoin(addr, to, sat),
          };
        }
        onConnect(addr, wallet);
      } else {
        onError('No Bitcoin address returned from ' + wallet.name);
      }
    } catch (e: any) {
      onError(e?.message || wallet.name + ' connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = () => {
    if (injected.length === 1) {
      connectDirect(injected[0]);
    } else {
      setShowPicker(true);
    }
  };

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-3 bg-orange-600/20 border border-orange-500/40 hover:border-orange-400/70 hover:bg-orange-600/30 rounded-xl px-4 py-3.5 transition-all disabled:opacity-50"
      >
        {connecting
          ? <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          : <span className="text-2xl leading-none text-orange-400">₿</span>
        }
        <span className="text-orange-300 font-semibold">
          {connecting ? 'Connecting...' : 'Connect Bitcoin Wallet'}
        </span>
      </button>

      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-[min(92vw,380px)] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#F4F6FA] font-bold text-lg">Connect Bitcoin Wallet</h3>
              <button onClick={() => setShowPicker(false)} className="text-[#A7B0B7] hover:text-white text-xl leading-none">×</button>
            </div>

            {injected.length > 1 ? (
              <>
                <p className="text-[#A7B0B7] text-xs mb-4">Multiple wallets detected — choose one:</p>
                <div className="flex flex-col gap-3">
                  {injected.map(w => (
                    <button key={w.id}
                      onClick={() => { setShowPicker(false); connectDirect(w); }}
                      className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/30 rounded-xl px-4 py-3 transition-all text-left"
                    >
                      <span className="text-2xl">{w.icon}</span>
                      <span className="text-[#F4F6FA] font-semibold text-sm">{w.name}</span>
                      <span className="ml-auto text-[#A7B0B7] text-lg">›</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-[#A7B0B7] text-xs mb-4 leading-relaxed">
                  Open this site in a BTC wallet browser — it will connect and approve transactions directly.
                </p>
                <div className="flex flex-col gap-3">
                  {BTC_BROWSER_WALLETS.map(w => (
                    <button key={w.id}
                      onClick={() => { setShowPicker(false); w.openUrl(window.location.href); }}
                      className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/30 rounded-xl px-4 py-3.5 transition-all text-left"
                    >
                      <span className="text-2xl leading-none">{w.icon}</span>
                      <div>
                        <p className="text-[#F4F6FA] font-semibold text-sm">{w.name}</p>
                        <p className="text-[#A7B0B7] text-xs">{w.desc}</p>
                      </div>
                      <span className="ml-auto text-[#A7B0B7] text-lg">›</span>
                    </button>
                  ))}
                </div>
                <p className="text-[#A7B0B7] text-xs text-center mt-4">
                  Already inside a wallet browser? Tap Connect above.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
