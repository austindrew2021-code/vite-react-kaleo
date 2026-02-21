import { gsap } from 'gsap';
import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { ArrowUp, CheckCircle2, Circle, ArrowRight, Zap } from 'lucide-react';
import {
  usePresaleStore,
  getCurrentStage,
  getStageProgress,
  getOverallProgress,
  PRESALE_STAGES,
  HARD_CAP_ETH,
  LISTING_PRICE,
} from '../store/presaleStore';
import { createClient } from '@supabase/supabase-js';

const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = _sbUrl && _sbKey ? createClient(_sbUrl, _sbKey) : null;

interface PresaleProgressProps {
  direction: 'up' | 'down' | 'neutral';
}

export function PresaleProgress({ direction }: PresaleProgressProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { totalRaised, purchases } = usePresaleStore();

  const currentStage = getCurrentStage(totalRaised);
  const stageProgress = getStageProgress(totalRaised);
  const overallProgress = getOverallProgress(totalRaised);

  const totalEthSpent = purchases.reduce((sum, p) => sum + p.ethSpent, 0);
  const storeKleo = purchases.reduce((sum, p) => sum + p.kleoReceived, 0);

  const stageStartEth = currentStage.cumulativeEth - currentStage.ethTarget;
  const raisedInCurrentStage = Math.max(0, totalRaised - stageStartEth);

  const now = Date.now();
  const recentBuys = purchases.filter(p => now - p.timestamp < 15 * 60 * 1000).length;

  const momentumBadge = recentBuys > 2
    ? { text: 'Hot activity', color: 'bg-green-600/20 border-green-500/40 text-green-300 animate-pulse-slow' }
    : recentBuys > 0
    ? { text: 'Active buying', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' }
    : { text: 'Building momentum', color: 'bg-gray-600/20 border-gray-500/30 text-gray-400' };

  const [supabaseTokens, setSupabaseTokens] = useState<number>(0);

  // Use whichever is higher: Supabase total or local store total
  // Handles race condition after Stripe redirect where store has data before Supabase fetch returns
  const displayKleo = Math.max(supabaseTokens, storeKleo);

  useEffect(() => {
    if (!isConnected || !address || !supabase) return;

    const fetchTokens = async () => {
      const { data, error } = await supabase
        .from('presale_purchases')
        .select('tokens')
        .eq('wallet_address', address.toLowerCase());

      if (error) {
        console.error('Supabase balance fetch error:', error);
        return;
      }

      const total = data?.reduce((sum, row) => sum + Number(row.tokens || 0), 0) || 0;
      setSupabaseTokens(total);
    };

    fetchTokens();

    const channel = supabase
      .channel('presale-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presale_purchases' }, (payload) => {
        if (payload.new.wallet_address.toLowerCase() === address.toLowerCase()) {
          setSupabaseTokens(prev => prev + Number(payload.new.tokens || 0));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, isConnected]);

  useEffect(() => {
    gsap.fromTo(
      '.progress-container',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  return (
    <section className="fade-in-section min-h-screen flex items-center justify-center bg-gradient-to-b from-[#05060B] to-[#0B0E14] relative overflow-hidden py-20">
      <div className="progress-container w-full max-w-4xl mx-auto px-6">

        {/* Main Card */}
        <div className="glass-card rounded-[32px] p-8 sm:p-10 mb-10 shadow-2xl shadow-cyan-900/25">

          {/* Header with indicators */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="px-4 py-1.5 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-sm font-bold uppercase tracking-wide">
                  Stage {currentStage.stage}/12
                </span>
                <span className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
                  <Circle className="w-3.5 h-3.5 animate-pulse" />
                  LIVE
                </span>
                <span className={`px-4 py-1.5 rounded-full font-medium flex items-center gap-2 text-sm ${
                  direction === 'up'
                    ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                    : direction === 'down'
                    ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                    : 'bg-gray-500/15 border border-gray-500/30 text-gray-400'
                }`}>
                  <ArrowUp className={`w-4 h-4 transition-transform ${direction === 'down' ? 'rotate-180' : ''}`} />
                  {direction === 'up' ? 'Price rising' : direction === 'down' ? 'Price falling' : 'Price stable'}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${momentumBadge.color}`}>
                  <Zap className="w-4 h-4" />
                  {momentumBadge.text}
                </span>
              </div>

              <p className="text-[#F4F6FA] text-4xl sm:text-5xl font-bold">
                {currentStage.priceEth} <span className="text-[#A7B0B7] text-2xl font-normal">ETH/KLEO</span>
              </p>
              <p className="text-[#A7B0B7] text-base mt-2">
                {currentStage.discount}% discount vs listing ({LISTING_PRICE} ETH)
              </p>
            </div>

            <div className="text-right">
              <p className="text-[#A7B0B7] text-base">Total Raised</p>
              <p className="text-[#2BFFF1] text-4xl sm:text-5xl font-bold">
                {totalRaised.toFixed(4)} <span className="text-xl font-normal">ETH</span>
              </p>
              <p className="text-[#A7B0B7] text-sm mt-2">
                of {HARD_CAP_ETH.toLocaleString()} ETH hard cap
              </p>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="mb-10">
            <div className="flex justify-between text-base mb-3">
              <span className="text-[#A7B0B7]">Current Stage Progress</span>
              <span className="text-[#2BFFF1] font-semibold">{stageProgress.toFixed(1)}%</span>
            </div>
            <div className="h-5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#2BFFF1] via-cyan-400 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-3 text-[#A7B0B7]">
              <span>{raisedInCurrentStage.toFixed(4)} ETH raised</span>
              <span>{currentStage.ethTarget.toLocaleString()} ETH target</span>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-10">
            <div className="flex justify-between text-base mb-3">
              <span className="text-[#A7B0B7]">Overall Presale Progress</span>
              <span className="text-[#A7B0B7] font-semibold">{overallProgress.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#2BFFF1]/70 via-cyan-400/50 to-purple-600/50 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Stage Grid */}
          <div className="mb-8">
            <p className="text-[#A7B0B7] text-base font-medium mb-4">Presale Stages</p>
            <div className="grid grid-cols-12 gap-1">
              {PRESALE_STAGES.map((stage) => {
                const isCompleted = totalRaised >= stage.cumulativeEth;
                const isCurrent = stage.stage === currentStage.stage;
                const priceStr = String(stage.priceEth);
                const dotIdx = priceStr.indexOf('.');
                const decimals = dotIdx >= 0 ? priceStr.slice(dotIdx + 1) : '';
                const sigStart = decimals.search(/[1-9]/);
                const leadPart = '0.' + (sigStart > 0 ? decimals.slice(0, sigStart) : '');
                const sigPart = sigStart >= 0 ? decimals.slice(sigStart) : decimals;
                return (
                  <div
                    key={stage.stage}
                    title={`Stage ${stage.stage}: ${stage.priceEth} ETH/KLEO`}
                    className={`py-1 px-0 rounded-lg border text-center transition-all duration-300 ${
                      isCurrent
                        ? 'border-[#2BFFF1]/60 bg-[#2BFFF1]/15 shadow-lg shadow-[#2BFFF1]/20 animate-pulse'
                        : isCompleted
                        ? 'border-green-500/40 bg-green-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      ) : isCurrent ? (
                        <div className="w-3 h-3 rounded-full bg-[#2BFFF1] animate-pulse" />
                      ) : (
                        <Circle className="w-3 h-3 text-[#A7B0B7]/50" />
                      )}
                    </div>
                    <p className={`text-[8px] font-bold leading-none ${
                      isCurrent ? 'text-[#2BFFF1]' : isCompleted ? 'text-green-400' : 'text-[#A7B0B7]'
                    }`}>S{stage.stage}</p>
                    <p className="text-[7px] text-[#A7B0B7] leading-none mt-px">{leadPart}</p>
                    <p className={`text-[7px] font-semibold leading-none ${
                      isCurrent ? 'text-[#2BFFF1]' : isCompleted ? 'text-green-400' : 'text-[#A7B0B7]'
                    }`}>{sigPart}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Info Card */}
        {isConnected && (
          <div className="glass-card rounded-[32px] p-8 shadow-2xl shadow-cyan-900/25">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="text-center sm:text-left">
                <p className="text-[#A7B0B7] text-base mb-2">Your Presale Allocation</p>
                <p className="text-[#2BFFF1] text-4xl font-bold">
                  {displayKleo.toLocaleString('en-US', { maximumFractionDigits: 0 })} KLEO
                </p>
                <p className="text-[#A7B0B7] text-sm mt-2">
                  {totalEthSpent.toFixed(4)} ETH spent across {purchases.length} purchase{purchases.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="text-center sm:text-right">
                <p className="text-[#A7B0B7] text-base mb-2">Wallet Balance</p>
                <p className="text-[#F4F6FA] text-4xl font-bold">
                  {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0'} ETH
                </p>
              </div>
            </div>

            {purchases.length > 0 && (
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-[#A7B0B7] text-base font-medium mb-4">Recent Purchases</p>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-3">
                  {purchases.slice(-6).reverse().map((p, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-white/3 rounded-xl p-4 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#F4F6FA] font-semibold">
                          {p.kleoReceived.toLocaleString('en-US', { maximumFractionDigits: 0 })} KLEO
                        </span>
                        <span className="text-[#A7B0B7]">
                          @ Stage {p.stage} – {p.ethSpent.toFixed(4)} ETH
                        </span>
                      </div>

                      <a
                        href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2BFFF1] hover:text-white flex items-center gap-2 text-sm"
                      >
                        View Tx <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isConnected && (
          <div className="text-center text-[#A7B0B7] mt-10 text-base">
            Connect your wallet to view your personal allocation, recent purchases, and real-time progress.
          </div>
        )}

      </div>
    </section>
  );
}
