import { useState } from 'react';

interface DetectedWallet {
  id: string; name: string; icon: string; color: string;
  connect: () => Promise<string>;
  sendBtc?: (to: string, satoshis: number) => Promise<string>;
}

interface Props {
  onConnect: (addr: string, wallet: DetectedWallet) => void;
  onError: (msg: string) => void;
  onPicker: () => void;
}

// ── Scan every known Bitcoin-related key on window ─────────────────────────
function scanWindow(): Record<string, string> {
  const w = window as any;
  const result: Record<string, string> = {};

  // Top-level keys that might be BTC-related
  const keysToCheck = [
    'bitcoin', 'Bitcoin', 'btc', 'BTC',
    'ethereum', 'web3',
    'phantom', 'solana',
    'okxwallet', 'unisat',
    'XverseProviders', 'BitcoinProvider',
    'xverse', 'leather', 'hiro',
  ];

  for (const key of keysToCheck) {
    if (w[key] !== undefined) {
      try {
        const val = w[key];
        const type = typeof val;
        if (type === 'object' && val !== null) {
          const keys = Object.keys(val).slice(0, 15).join(', ');
          result[key] = `{object} keys: [${keys}]`;
          // Go one level deeper for nested bitcoin
          if (val.bitcoin) result[`${key}.bitcoin`] = `{object} keys: [${Object.keys(val.bitcoin).slice(0,10).join(', ')}]`;
          if (val.solana) result[`${key}.solana`] = `{object}`;
        } else {
          result[key] = `${type}: ${String(val).slice(0, 60)}`;
        }
      } catch (e) {
        result[key] = `[error reading: ${e}]`;
      }
    }
  }

  // Check window.ethereum details
  if (w.ethereum) {
    result['ethereum.isMetaMask'] = String(w.ethereum.isMetaMask);
    result['ethereum.chainId'] = String(w.ethereum.chainId);
    result['ethereum.isTrust'] = String(w.ethereum.isTrust);
  }

  return result;
}

// ── Try every known BTC requestAccounts variant ────────────────────────────
async function tryAllBtcApis(): Promise<{ method: string; result: any; error?: string }[]> {
  const w = window as any;
  const results: { method: string; result: any; error?: string }[] = [];

  const tryMethod = async (label: string, fn: () => Promise<any>) => {
    try {
      const r = await fn();
      results.push({ method: label, result: r });
    } catch (e: any) {
      results.push({ method: label, result: null, error: e?.message || String(e) });
    }
  };

  // Direct window.bitcoin
  if (w.bitcoin) {
    await tryMethod('window.bitcoin.requestAccounts()', () => w.bitcoin.requestAccounts());
    await tryMethod('window.bitcoin.request({method:"requestAccounts"})', () =>
      w.bitcoin.request({ method: 'requestAccounts' }));
    await tryMethod('window.bitcoin.request({method:"btc_requestAccounts"})', () =>
      w.bitcoin.request({ method: 'btc_requestAccounts' }));
    await tryMethod('window.bitcoin.request({method:"getAccounts"})', () =>
      w.bitcoin.request({ method: 'getAccounts' }));
  }

  // window.ethereum Bitcoin methods
  if (w.ethereum) {
    await tryMethod('ethereum.request({method:"btc_requestAccounts"})', () =>
      w.ethereum.request({ method: 'btc_requestAccounts' }));
    await tryMethod('ethereum.request({method:"wallet_getPermissions"})', () =>
      w.ethereum.request({ method: 'wallet_getPermissions' }));
    await tryMethod('ethereum.request({method:"wallet_requestPermissions",bitcoin_requestAccounts})', () =>
      w.ethereum.request({ method: 'wallet_requestPermissions', params: [{ bitcoin_requestAccounts: {} }] }));
  }

  // Phantom bitcoin
  if (w.phantom?.bitcoin) {
    await tryMethod('phantom.bitcoin.requestAccounts()', () => w.phantom.bitcoin.requestAccounts());
  }

  return results;
}

export function BtcDiagnostic({ onConnect, onError, onPicker }: Props) {
  const [scanning, setScanning]     = useState(false);
  const [scan, setScan]             = useState<Record<string, string> | null>(null);
  const [apiResults, setApiResults] = useState<{ method: string; result: any; error?: string }[] | null>(null);
  const [connecting, setConnecting] = useState(false);

  const runScan = () => {
    const result = scanWindow();
    setScan(result);
  };

  const runApiTest = async () => {
    setScanning(true);
    try {
      const results = await tryAllBtcApis();
      setApiResults(results);
    } finally {
      setScanning(false);
    }
  };

  // Try to extract an address from any successful API result
  const tryConnect = async () => {
    setConnecting(true);
    const w = window as any;
    try {
      // Try every provider in priority order
      const providers: Array<{ label: string; fn: () => Promise<string | null> }> = [
        {
          label: 'window.bitcoin.requestAccounts()',
          fn: async () => {
            if (!w.bitcoin) return null;
            const raw = await w.bitcoin.requestAccounts();
            return extractAddr(raw);
          }
        },
        {
          label: 'window.bitcoin.request(requestAccounts)',
          fn: async () => {
            if (!w.bitcoin?.request) return null;
            const raw = await w.bitcoin.request({ method: 'requestAccounts' });
            return extractAddr(raw);
          }
        },
        {
          label: 'ethereum btc_requestAccounts',
          fn: async () => {
            if (!w.ethereum) return null;
            const raw = await w.ethereum.request({ method: 'btc_requestAccounts' });
            return extractAddr(raw);
          }
        },
        {
          label: 'phantom.bitcoin.requestAccounts()',
          fn: async () => {
            if (!w.phantom?.bitcoin) return null;
            const raw = await w.phantom.bitcoin.requestAccounts();
            return extractAddr(raw);
          }
        },
        {
          label: 'XverseProviders.BitcoinProvider getAccounts',
          fn: async () => {
            const xp = w.XverseProviders?.BitcoinProvider ?? w.BitcoinProvider;
            if (!xp) return null;
            const r = await xp.request('getAccounts', { purposes: ['payment'] });
            return r?.result?.addresses?.[0]?.address ?? null;
          }
        },
        {
          label: 'unisat.requestAccounts()',
          fn: async () => {
            if (!w.unisat) return null;
            const raw = await w.unisat.requestAccounts();
            return Array.isArray(raw) ? raw[0] : null;
          }
        },
      ];

      for (const p of providers) {
        try {
          const addr = await p.fn();
          if (addr && addr.startsWith('bc1')) {
            // Found it — build wallet object
            const wallet: DetectedWallet = {
              id: 'btc-detected', name: p.label.split('.')[0].replace('window.', ''),
              icon: '₿', color: 'text-orange-400',
              connect: async () => addr,
              sendBtc: buildSendFn(p.label),
            };
            onConnect(addr, wallet);
            return;
          }
        } catch {}
      }

      onError('No Bitcoin provider found. Screenshot the scan results below and share.');
    } finally {
      setConnecting(false);
    }
  };

  function extractAddr(raw: any): string | null {
    if (!raw) return null;
    if (typeof raw === 'string' && raw.startsWith('bc1')) return raw;
    if (Array.isArray(raw)) {
      if (typeof raw[0] === 'string') return raw[0];
      return raw.find((a: any) => a.purpose === 'payment')?.address
          ?? raw.find((a: any) => a.address?.startsWith('bc1'))?.address
          ?? raw[0]?.address ?? null;
    }
    const list = raw?.result ?? raw?.accounts ?? raw?.addresses ?? [];
    return extractAddr(list);
  }

  function buildSendFn(providerLabel: string): (to: string, sat: number) => Promise<string> {
    const w = window as any;
    if (providerLabel.includes('phantom')) {
      return (to, sat) => w.phantom.bitcoin.sendBitcoin(to, sat);
    }
    if (providerLabel.includes('unisat')) {
      return (to, sat) => w.unisat.sendBitcoin(to, sat);
    }
    if (providerLabel.includes('Xverse')) {
      const xp = w.XverseProviders?.BitcoinProvider ?? w.BitcoinProvider;
      return async (to, sat) => {
        const r = await xp.request('sendTransfer', { recipients: [{ address: to, amount: sat }] });
        return r?.result?.txid ?? '';
      };
    }
    // Default: window.bitcoin
    return async (to, sat) => {
      const r = await w.bitcoin.sendBitcoin(to, sat);
      return typeof r === 'string' ? r : r?.txid ?? String(r);
    };
  }

  const hasAnyBtc = !!(
    (window as any).bitcoin ||
    (window as any).phantom?.bitcoin ||
    (window as any).XverseProviders?.BitcoinProvider ||
    (window as any).unisat
  );

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Primary connect attempt */}
      <button
        onClick={tryConnect}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-3 bg-orange-600/20 border border-orange-500/40 hover:border-orange-400/70 hover:bg-orange-600/30 rounded-xl px-4 py-3.5 transition-all disabled:opacity-50"
      >
        {connecting ? (
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-2xl leading-none text-orange-400">₿</span>
        )}
        <span className="text-orange-300 font-semibold">
          {connecting ? 'Connecting...' : 'Connect Bitcoin Wallet'}
        </span>
      </button>

      {/* Debug tools */}
      <div className="flex gap-2">
        <button
          onClick={runScan}
          className="flex-1 text-xs text-yellow-400 border border-yellow-500/30 rounded-lg py-1.5 hover:bg-yellow-500/10"
        >
          🔍 Scan Providers
        </button>
        <button
          onClick={runApiTest}
          disabled={scanning}
          className="flex-1 text-xs text-yellow-400 border border-yellow-500/30 rounded-lg py-1.5 hover:bg-yellow-500/10 disabled:opacity-50"
        >
          {scanning ? '...' : '🧪 Test All APIs'}
        </button>
        {!hasAnyBtc && (
          <button
            onClick={onPicker}
            className="flex-1 text-xs text-orange-400 border border-orange-500/30 rounded-lg py-1.5 hover:bg-orange-500/10"
          >
            📱 Open Wallet
          </button>
        )}
      </div>

      {/* Scan results */}
      {scan && (
        <div className="p-3 rounded-lg bg-black/70 border border-yellow-500/30 text-left max-h-60 overflow-auto">
          <p className="text-yellow-400 text-xs font-bold mb-2">Window Providers Detected:</p>
          {Object.entries(scan).length === 0 ? (
            <p className="text-red-400 text-xs">None detected — window.bitcoin is undefined</p>
          ) : (
            Object.entries(scan).map(([k, v]) => (
              <div key={k} className="text-xs mb-1">
                <span className="text-yellow-300 font-mono">{k}</span>
                <span className="text-gray-400"> → </span>
                <span className="text-white break-all">{v}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* API test results */}
      {apiResults && (
        <div className="p-3 rounded-lg bg-black/70 border border-blue-500/30 text-left max-h-60 overflow-auto">
          <p className="text-blue-400 text-xs font-bold mb-2">API Test Results:</p>
          {apiResults.map((r, i) => (
            <div key={i} className="text-xs mb-2 border-b border-white/10 pb-1">
              <p className="text-blue-300 font-mono break-all">{r.method}</p>
              {r.error ? (
                <p className="text-red-400">❌ {r.error}</p>
              ) : (
                <p className="text-green-400 break-all">✅ {JSON.stringify(r.result).slice(0, 200)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  }
