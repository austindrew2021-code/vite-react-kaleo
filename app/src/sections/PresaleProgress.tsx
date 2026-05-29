import { useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
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

  const stageStartEth = currentStage.cumulativeEth - currentStage.ethTarget;
  const raisedInCurrentStage = Math.max(0, totalRaised - stageStartEth);

  useEffect(() => {
    gsap.fromTo('.progress-container',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  return (
    <section className="fade-in-section min-h-screen flex items-center justify-center bg-gradient-to-b from-[#05060B] to-[#0B0E14] relative overflow-hidden py-16">
      <div className="progress-container w-full max-w-3xl mx-auto px-4 sm:px-6">
        <div className="glass-card rounded-[28px] p-6 sm:p-8 mb-8 shadow-2xl shadow-cyan-900/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-sm font-bold uppercase tracking-wide">
                  Stage {currentStage.stage}/12
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-1">
                  <Circle className="w-3 h-3 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[#F4F6FA] text-2xl sm:text-3xl font-bold">
                {currentStage.priceEth} <span className="text-[#A7B0B7] text-lg font-normal">ETH/KLEO</span>
              </p>
              <p className="text-[#A7B0B7] text-sm mt-1">
                {currentStage.discount}% discount vs listing ({LISTING_PRICE} ETH)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#A7B0B7] text-sm">Total Raised</p>
              <p className="text-[#2BFFF1] text-2xl sm:text-3xl font-bold">
                {totalRaised.toFixed(4)} <span className="text-base font-normal">ETH</span>
              </p>
              <p className="text-[#A7B0B7] text-xs mt-1">
                of {HARD_CAP_ETH.toLocaleString()} ETH hard cap
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#A7B0B7]">Stage {currentStage.stage} Progress</span>
              <span className="text-[#2BFFF1] font-medium">{stageProgress.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#2BFFF1] via-cyan-400 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-[#A7B0B7]">
              <span>{raisedInCurrentStage.toFixed(4)} ETH raised</span>
              <span>{currentStage.ethTarget.toLocaleString()} ETH target</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#A7B0B7]">Overall Presale</span>
              <span className="text-[#A7B0B7] font-medium">{overallProgress.toFixed(2)}%</span>
            </div>
            <div className="h-2 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#2BFFF1]/60 via-cyan-400/40 to-purple-600/40 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[#A7B0B7] text-sm font-medium mb-3">All Stages</p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {PRESALE_STAGES.map((stage) => {
                const isCompleted = totalRaised >= stage.cumulativeEth;
                const isCurrent = stage.stage === currentStage.stage;
                return (
                  <div
                    key={stage.stage}
                    className={`p-1.5 sm:p-2 rounded-lg border text-center transition-all duration-300 ${
                      isCurrent
                        ? 'border-[#2BFFF1]/50 bg-[#2BFFF1]/10 shadow-lg shadow-[#2BFFF1]/10 animate-pulse'
                        : isCompleted
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : isCurrent ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-[#2BFFF1] animate-pulse" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[#A7B0B7]/40" />
                      )}
                    </div>
                    <p className={`text-[9px] sm:text-[10px] font-bold ${
                      isCurrent ? 'text-[#2BFFF1]' : isCompleted ? 'text-green-400' : 'text-[#A7B0B7]'
                    }`}>
                      S{stage.stage}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-[#A7B0B7]">{stage.priceEth}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isConnected && (
          <div className="glass-card rounded-[28px] p-6 mb-8 shadow-2xl shadow-cyan-900/20">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-center sm:text-left">
                <p className="text-[#A7B0B7] text-sm mb-1">Your Purchases</p>
                <p className="text-[#2BFFF1] text-2xl font-bold">
                  {totalKleoPurchased.toLocaleString('en-US', { maximumFractionDigits: 0 })} KLEO
                </p>
                <p className="text-[#A7B0B7] text-xs">
                  {totalEthSpent.toFixed(4)} ETH spent across {purchases.length} transaction{purchases.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[#A7B0B7] text-sm mb-1">Wallet Balance</p>
                <p className="text-[#F4F6FA] text-2xl font-bold">
                  {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0'} ETH
                </p>
              </div>
            </div>

            {purchases.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[#A7B0B7] text-sm font-medium mb-3">Recent Purchases</p>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                  {purchases.slice(-5).reverse().map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white/3 rounded-lg p-3">
                      <span className="text-[#F4F6FA] font-medium">
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

        {!isConnected && (
          <div className="text-center text-[#A7B0B7] mt-6 text-sm">
            Connect your wallet to see your purchases, balance, and stage progress
          </div>
        )}
      </div>
    </section>
  );
}
