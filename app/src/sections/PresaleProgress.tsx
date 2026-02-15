import { useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { gsap } from 'gsap';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import {
  usePresaleStore,
  getCurrentStage,
  getStageProgress,
  getOverallProgress,
  PRESALE_STAGES,
  HARD_CAP_ETH,
  LISTING_PRICE,
} from '../store/presaleStore';

export function PresaleProgress() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { totalRaised, purchases } = usePresaleStore();

  const currentStage = getCurrentStage(totalRaised);
  const stageProgress = getStageProgress(totalRaised);
  const overallProgress = getOverallProgress(totalRaised);

  const totalKleoPurchased = purchases.reduce((sum, p) => sum + p.kleoReceived, 0);
  const totalEthSpent = purchases.reduce((sum, p) => sum + p.ethSpent, 0);

  // Stage start ETH for the current stage
  const stageStartEth = currentStage.cumulativeEth - currentStage.ethTarget;
  const raisedInCurrentStage = Math.max(0, totalRaised - stageStartEth);

  useEffect(() => {
    gsap.fromTo('.progress-container',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  return (
    <section className="pinned-section fade-in-section min-h-screen flex items-center justify-center bg-gradient-to-b from-[#05060B] to-[#0B0E14] relative overflow-hidden">
      <div className="progress-container w-full max-w-3xl mx-auto p-6 sm:p-8">
        {/* Main Progress Card */}
        <div className="glass-card rounded-[28px] p-6 sm:p-8 mb-6">
          {/* Stage Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-sm font-bold">
                  Stage {currentStage.stage}/12
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
                  LIVE
                </span>
              </div>
              <p className="text-[#F4F6FA] text-2xl font-bold mt-2">
                {currentStage.priceEth} <span className="text-[#A7B0B7] text-base font-normal">ETH/KLEO</span>
              </p>
              <p className="text-[#A7B0B7] text-sm mt-1">
                {currentStage.discount}% discount vs listing ({LISTING_PRICE} ETH)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#A7B0B7] text-sm">Total Raised</p>
              <p className="text-[#2BFFF1] text-2xl font-bold">
                {totalRaised.toFixed(4)} <span className="text-base">ETH</span>
              </p>
              <p className="text-[#A7B0B7] text-xs mt-1">
                of {HARD_CAP_ETH.toLocaleString()} ETH hard cap
              </p>
            </div>
          </div>

          {/* Current Stage Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#A7B0B7]">Stage {currentStage.stage} Progress</span>
              <span className="text-[#2BFFF1] font-medium">{stageProgress.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#2BFFF1] to-[#1DD8CC] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-[#A7B0B7]">
              <span>{raisedInCurrentStage.toFixed(4)} ETH raised</span>
              <span>{currentStage.ethTarget.toLocaleString()} ETH target</span>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#A7B0B7]">Overall Presale</span>
              <span className="text-[#A7B0B7] font-medium">{overallProgress.toFixed(2)}%</span>
            </div>
            <div className="h-2 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#2BFFF1]/60 to-[#1DD8CC]/40 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Stage Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-[#A7B0B7] text-xs mb-1">Tokens Left</p>
              <p className="text-[#F4F6FA] text-sm font-bold">
                {currentStage.tokenAllocation.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-[#A7B0B7] text-xs mb-1">Stage Target</p>
              <p className="text-[#F4F6FA] text-sm font-bold">
                {currentStage.ethTarget.toLocaleString()} ETH
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-[#A7B0B7] text-xs mb-1">Next Price</p>
              <p className="text-[#F4F6FA] text-sm font-bold">
                {currentStage.stage < 12
                  ? PRESALE_STAGES[currentStage.stage].priceEth
                  : LISTING_PRICE}{' '}
                ETH
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-[#A7B0B7] text-xs mb-1">Price Increase</p>
              <p className="text-[#2BFFF1] text-sm font-bold">
                {currentStage.stage < 12
                  ? `+${(
                      ((PRESALE_STAGES[currentStage.stage].priceEth - currentStage.priceEth) /
                        currentStage.priceEth) *
                      100
                    ).toFixed(0)}%`
                  : 'Final'}
              </p>
            </div>
          </div>

          {/* 12-Stage Timeline */}
          <div className="mb-2">
            <p className="text-[#A7B0B7] text-sm font-medium mb-3">All Stages</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {PRESALE_STAGES.map((stage) => {
                const isCompleted = totalRaised >= stage.cumulativeEth;
                const isCurrent = stage.stage === currentStage.stage;
                return (
                  <div
                    key={stage.stage}
                    className={`p-2 rounded-lg border text-center transition-all duration-300 ${
                      isCurrent
                        ? 'border-[#2BFFF1]/50 bg-[#2BFFF1]/10 shadow-lg shadow-[#2BFFF1]/10'
                        : isCompleted
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : isCurrent ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-[#2BFFF1] animate-pulse" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[#A7B0B7]/40" />
                      )}
                    </div>
                    <p className={`text-[10px] font-bold ${
                      isCurrent ? 'text-[#2BFFF1]' : isCompleted ? 'text-green-400' : 'text-[#A7B0B7]'
                    }`}>
                      S{stage.stage}
                    </p>
                    <p className="text-[9px] text-[#A7B0B7]">{stage.priceEth}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Connected Wallet Card */}
        {isConnected && (
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-[#A7B0B7] text-sm mb-1">Your Purchases</p>
                <p className="text-[#2BFFF1] text-xl font-bold">
                  {totalKleoPurchased.toLocaleString('en-US', { maximumFractionDigits: 0 })} KLEO
                </p>
                <p className="text-[#A7B0B7] text-xs">
                  {totalEthSpent.toFixed(4)} ETH spent across {purchases.length} transaction{purchases.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[#A7B0B7] text-sm mb-1">Wallet Balance</p>
                <p className="text-[#F4F6FA] text-xl font-bold">
                  {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0'} ETH
                </p>
              </div>
            </div>

            {/* Recent purchases */}
            {purchases.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[#A7B0B7] text-xs mb-2">Recent Purchases</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {purchases.slice(-3).reverse().map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#F4F6FA]">
                        {p.kleoReceived.toLocaleString('en-US', { maximumFractionDigits: 0 })} KLEO
                      </span>
                      <span className="text-[#A7B0B7]">
                        {p.ethSpent.toFixed(4)} ETH @ Stage {p.stage}
                      </span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2BFFF1] hover:underline flex items-center gap-1"
                      >
                        Tx <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Not connected message */}
        {!isConnected && (
          <div className="text-center text-[#A7B0B7] mt-4 text-sm">
            Connect your wallet to see your purchases and balance
          </div>
        )}
      </div>
    </section>
  );
}
