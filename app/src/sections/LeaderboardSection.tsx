import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TOTAL_PRESALE_TOKENS, LISTING_PRICE_USD } from '../store/presaleStore';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase        = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface LeaderEntry {
  wallet:    string;
  tokens:    number;
  usd_spent: number;
  rank:      number;
}

function maskWallet(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 5)}••••••${addr.slice(-4)}`;
}

// Gold / Silver / Copper
const MEDALS = [
  {
    label: '1st',
    crown: true,
    ringColor:  '#F59E0B',
    glowColor:  'rgba(245,158,11,0.25)',
    cardBg:     'linear-gradient(160deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)',
    border:     'rgba(245,158,11,0.35)',
    textColor:  '#FCD34D',
    badgeBg:    'rgba(245,158,11,0.15)',
    badgeBorder:'rgba(245,158,11,0.35)',
    numColor:   '#F59E0B',
    podiumH:    'h-20',
    podiumBg:   'from-yellow-500/40 to-yellow-700/20',
  },
  {
    label: '2nd',
    crown: false,
    ringColor:  '#9CA3AF',
    glowColor:  'rgba(156,163,175,0.2)',
    cardBg:     'linear-gradient(160deg, rgba(156,163,175,0.1) 0%, rgba(156,163,175,0.03) 100%)',
    border:     'rgba(156,163,175,0.3)',
    textColor:  '#D1D5DB',
    badgeBg:    'rgba(156,163,175,0.12)',
    badgeBorder:'rgba(156,163,175,0.3)',
    numColor:   '#9CA3AF',
    podiumH:    'h-14',
    podiumBg:   'from-gray-400/30 to-gray-600/15',
  },
  {
    label: '3rd',
    crown: false,
    ringColor:  '#CD7F32',
    glowColor:  'rgba(205,127,50,0.2)',
    cardBg:     'linear-gradient(160deg, rgba(205,127,50,0.1) 0%, rgba(205,127,50,0.03) 100%)',
    border:     'rgba(205,127,50,0.3)',
    textColor:  '#D97706',
    badgeBg:    'rgba(205,127,50,0.12)',
    badgeBorder:'rgba(205,127,50,0.3)',
    numColor:   '#CD7F32',
    podiumH:    'h-10',
    podiumBg:   'from-orange-700/30 to-orange-900/15',
  },
];

// Podium order: 2nd left, 1st centre, 3rd right
const PODIUM_ORDER = [1, 0, 2];

interface Props { onBack: () => void; }

export function LeaderboardSection({ onBack }: Props) {
  const [entries,    setEntries]    = useState<LeaderEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('presale_purchases')
      .select('wallet_address, tokens, usd_amount');

    if (error) { console.error('Leaderboard fetch:', error); setLoading(false); return; }

    const map = new Map<string, { tokens: number; usd: number }>();
    for (const row of data ?? []) {
      const key = (row.wallet_address || '').toLowerCase();
      if (!key) continue;
      const ex = map.get(key) || { tokens: 0, usd: 0 };
      map.set(key, {
        tokens: ex.tokens + Number(row.tokens     || 0),
        usd:    ex.usd    + Number(row.usd_amount || 0),
      });
    }

    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1].tokens - a[1].tokens)
      .slice(0, 50)
      .map(([wallet, v], i) => ({
        wallet,
        tokens:    v.tokens,
        usd_spent: v.usd,
        rank:      i + 1,
      }));

    setEntries(sorted);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const iv = setInterval(fetchLeaderboard, 15_000);
    return () => clearInterval(iv);
  }, [fetchLeaderboard]);

  const top3  = entries.slice(0, 3);
  const rest  = entries.slice(3);
  const pctOf = (t: number) => ((t / TOTAL_PRESALE_TOKENS) * 100).toFixed(3);
  const valAt = (t: number) => (t * LISTING_PRICE_USD).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-[#05060B] text-[#F4F6FA]">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-50 bg-[#05060B]/95 backdrop-blur-sm border-b border-white/[0.06] px-4 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="h-4 w-px bg-white/10"/>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2BFFF1] to-[#00D4FF] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#05060B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-5v5m4-9v9"/>
            </svg>
          </div>
          <span className="font-bold text-[#F4F6FA] text-base">Presale Leaderboard</span>
        </div>
        {lastUpdate && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-[10px] text-[#4B5563]">Live · {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Title ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/25 text-[#2BFFF1] text-xs font-semibold uppercase tracking-widest mb-3">
            Live Rankings
          </div>
          <h1 className="text-3xl font-bold text-[#F4F6FA] mb-2">Top XEN Holders</h1>
          <p className="text-[#A7B0B7] text-sm max-w-md mx-auto">
            Rankings refresh every 15 seconds. Values shown at listing price of ${LISTING_PRICE_USD}/XEN.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-[#2BFFF1]/30 border-t-[#2BFFF1] rounded-full animate-spin"/>
            <p className="text-[#4B5563] text-sm">Loading leaderboard…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-[#4B5563] text-sm">No purchases yet — be the first on the board!</p>
          </div>
        ) : (
          <>
            {/* ── Podium — 2nd · 1st · 3rd ── */}
            {top3.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-3 gap-3 items-end mb-0">
                  {PODIUM_ORDER.map((idx) => {
                    const entry = top3[idx];
                    if (!entry) return <div key={idx} />;
                    const m = MEDALS[idx];
                    const isFirst = idx === 0;
                    return (
                      <div key={entry.wallet} className="flex flex-col items-center">

                        {/* Crown for 1st */}
                        {isFirst && (
                          <div className="mb-1">
                            <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                              <path d="M2 18L6 6l6 7 6-10 6 10 4-7v12H2z" fill="#F59E0B" opacity=".9"/>
                              <circle cx="2"  cy="6"  r="2" fill="#FCD34D"/>
                              <circle cx="14" cy="3"  r="2" fill="#FCD34D"/>
                              <circle cx="26" cy="6"  r="2" fill="#FCD34D"/>
                            </svg>
                          </div>
                        )}

                        {/* Card */}
                        <div
                          className={`w-full rounded-2xl p-4 flex flex-col items-center text-center ${isFirst ? 'py-5' : 'py-4'}`}
                          style={{
                            background: m.cardBg,
                            border: `1px solid ${m.border}`,
                            boxShadow: `0 0 24px ${m.glowColor}`,
                          }}
                        >
                          {/* Rank badge */}
                          <div
                            className="text-xs font-bold uppercase tracking-widest px-3 py-0.5 rounded-full mb-3"
                            style={{ background: m.badgeBg, border: `1px solid ${m.badgeBorder}`, color: m.textColor }}
                          >
                            {m.label}
                          </div>

                          {/* Wallet */}
                          <div className="font-mono text-[11px] text-[#A7B0B7] bg-white/[0.05] px-2.5 py-1 rounded-lg mb-3 w-full truncate">
                            {maskWallet(entry.wallet)}
                          </div>

                          {/* Token amount */}
                          <div className={`font-bold mb-0.5 ${isFirst ? 'text-2xl' : 'text-xl'}`} style={{ color: m.textColor }}>
                            {entry.tokens.toLocaleString()}
                          </div>
                          <div className="text-[#6B7280] text-[10px] mb-3">XEN</div>

                          {/* Stats */}
                          <div className="w-full border-t border-white/[0.06] pt-2.5 grid grid-cols-2 gap-1 text-center">
                            <div>
                              <p className="text-[9px] text-[#4B5563] uppercase tracking-wide">% Supply</p>
                              <p className="text-[11px] font-semibold text-[#A7B0B7]">{pctOf(entry.tokens)}%</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[#4B5563] uppercase tracking-wide">At Launch</p>
                              <p className="text-[11px] font-semibold" style={{ color: m.textColor }}>${valAt(entry.tokens)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Podium block */}
                        <div
                          className={`w-full ${m.podiumH} rounded-b-xl bg-gradient-to-b ${m.podiumBg} flex items-center justify-center`}
                          style={{ borderLeft: `1px solid ${m.border}`, borderRight: `1px solid ${m.border}`, borderBottom: `1px solid ${m.border}` }}
                        >
                          <span className="text-2xl font-black" style={{ color: m.numColor }}>{idx + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Ranks 4–50 ── */}
            {rest.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
                  <div className="col-span-1 text-[10px] font-semibold uppercase tracking-widest text-[#4B5563]">#</div>
                  <div className="col-span-4 text-[10px] font-semibold uppercase tracking-widest text-[#4B5563]">Wallet</div>
                  <div className="col-span-3 text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] text-right">XEN</div>
                  <div className="col-span-2 text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] text-right">% Supply</div>
                  <div className="col-span-2 text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] text-right">At Launch</div>
                </div>
                {rest.map((entry, i) => (
                  <div
                    key={entry.wallet}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.025] transition-colors ${i < rest.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                  >
                    <div className="col-span-1">
                      <span className="text-xs font-bold text-[#4B5563]">{entry.rank}</span>
                    </div>
                    <div className="col-span-4">
                      <span className="font-mono text-xs text-[#A7B0B7]">{maskWallet(entry.wallet)}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-xs font-semibold text-[#F4F6FA]">{entry.tokens.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-[#6B7280]">{pctOf(entry.tokens)}%</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs text-[#2BFFF1]/80">${valAt(entry.tokens)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[10px] text-[#374151] mt-6">
              Top 50 holders shown · Wallet addresses partially masked for privacy · Values at ${LISTING_PRICE_USD}/XEN listing price
            </p>
          </>
        )}
      </div>
    </div>
  );
}
