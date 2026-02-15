import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

const STAGES = [
  { min: 0, max: 10, price: 0.0042, name: 'Stage 1' },
  { min: 10, max: 50, price: 0.0055, name: 'Stage 2' },
  { min: 50, max: 200, price: 0.007, name: 'Stage 3' },
  // ... add more stages
];

export function PresaleProgress() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const [raised, setRaised] = useState(0); // in ETH
  const hardCap = 200; // total ETH cap
  const progress = Math.min((raised / hardCap) * 100, 100);

  // Simulate / fetch real raised amount (replace with your backend or contract call)
  useEffect(() => {
    // Example: poll every 10s
    const interval = setInterval(() => {
      // Replace with real fetch from your contract or API
      setRaised((prev) => prev + Math.random() * 0.1); // demo only
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentStage = STAGES.find(
    (s) => raised >= s.min && raised < s.max
  ) || STAGES[STAGES.length - 1];

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900/60 rounded-2xl border border-cyan-500/30">
      <div className="flex justify-between mb-4">
        <span className="text-cyan-400 font-bold">{currentStage.name}</span>
        <span className="text-white">
          Raised: {raised.toFixed(2)} / {hardCap} ETH
        </span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-4 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-cyan-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {isConnected && balance && (
        <div className="text-center text-sm text-gray-400">
          Connected wallet balance: {formatEther(balance.value)} ETH
        </div>
      )}
    </div>
  );
}
