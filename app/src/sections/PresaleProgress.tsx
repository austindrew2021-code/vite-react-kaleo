import { useEffect, useState } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatEther } from 'viem';

// Replace with your real presale contract address + ABI
const PRESALE_CONTRACT = '0xYourPresaleContractAddressHere' as const;
const PRESALE_ABI = [
  {
    name: 'totalRaised',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  } as const,
  {
    name: 'userPurchases',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  } as const,
] as const;

const STAGES = [
  { min: 0, max: 10, price: 0.0042, name: 'Stage 1' },
  { min: 10, max: 50, price: 0.0055, name: 'Stage 2' },
  { min: 50, max: 200, price: 0.007, name: 'Stage 3' },
];

export function PresaleProgress() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Real raised amount from contract
  const { data: totalRaisedRaw } = useReadContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'totalRaised',
  });

  // User's personal purchases (only if connected)
  const { data: userPurchasesRaw } = useReadContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'userPurchases',
    args: address ? [address] : undefined,
  });

  const [raised, setRaised] = useState(0); // fallback + simulation

  const totalRaised = totalRaisedRaw ? Number(formatEther(totalRaisedRaw)) : raised;
  const userTokens = userPurchasesRaw ? Number(formatEther(userPurchasesRaw)) : 0;

  const hardCap = 200;
  const progress = Math.min((totalRaised / hardCap) * 100, 100);

  // Optional: simulate updates if no contract data yet (remove in production)
  useEffect(() => {
    const interval = setInterval(() => {
      setRaised((prev: number) => prev + Math.random() * 0.1); // demo only
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentStage = STAGES.find(
    (s) => totalRaised >= s.min && totalRaised < s.max
  ) || STAGES[STAGES.length - 1];

  return (
    <section className="pinned-section fade-in-section min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
      <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900/60 rounded-2xl border border-cyan-500/30">
        <div className="flex justify-between mb-4 text-lg">
          <span className="text-cyan-400 font-bold">{currentStage.name}</span>
          <span className="text-white font-medium">
            Raised: {totalRaised.toFixed(2)} / {hardCap} ETH
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-5 mb-6 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-cyan-500 via-cyan-400 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isConnected && (
          <div className="text-center text-base text-gray-300 mt-6 space-y-2">
            <div>Your purchases: <span className="text-cyan-400 font-bold">{userTokens.toFixed(2)} KLEO</span></div>
            <div>Wallet balance: <span className="text-cyan-400 font-bold">
              {balance ? formatEther(balance.value) : '0'} ETH
            </span></div>
          </div>
        )}
      </div>
    </section>
  );
}
