import { useEffect, useState } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { polygon } from 'wagmi/chains';

// Replace with your real presale contract address + ABI
const PRESALE_CONTRACT = '0xYourPresaleContractAddressHere';
const PRESALE_ABI = [
  {
    name: 'totalRaised',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'userPurchases',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const STAGES = [
  { min: 0n, max: 10n * 10n ** 18n, price: 0.0042, name: 'Stage 1' },
  { min: 10n * 10n ** 18n, max: 50n * 10n ** 18n, price: 0.0055, name: 'Stage 2' },
  { min: 50n * 10n ** 18n, max: 200n * 10n ** 18n, price: 0.007, name: 'Stage 3' },
];

export function PresaleProgress() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const { data: totalRaisedRaw } = useReadContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'totalRaised',
    chainId: polygon.id,
  });

  const { data: userPurchasesRaw } = useReadContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'userPurchases',
    args: [address!],
    chainId: polygon.id,
    enabled: !!address,
  });

  const totalRaised = totalRaisedRaw ? Number(formatEther(totalRaisedRaw)) : 0;
  const userTokens = userPurchasesRaw ? Number(formatEther(userPurchasesRaw)) : 0;

  const hardCap = 200; // ETH
  const progress = Math.min((totalRaised / hardCap) * 100, 100);

  const currentStage = STAGES.find(
    s => BigInt(totalRaised) * 10n ** 18n >= s.min && BigInt(totalRaised) * 10n ** 18n < s.max
  ) || STAGES[STAGES.length - 1];

  return (
    <section className="pinned-section min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
      <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900/60 rounded-2xl border border-cyan-500/30">
        <div className="flex justify-between mb-4">
          <span className="text-cyan-400 font-bold">{currentStage.name} – {currentStage.price} ETH/KLEO</span>
          <span className="text-white">
            Raised: {totalRaised.toFixed(2)} / {hardCap} ETH
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-4 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isConnected && (
          <div className="text-center text-sm text-gray-300 mt-4">
            Your purchases: {userTokens.toFixed(2)} KLEO
            <br />
            Wallet balance: {balance ? formatEther(balance.value) : '0'} ETH
          </div>
        )}
      </div>
    </section>
  );
}
