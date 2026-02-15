import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Replace with your real presale contract address + ABI when ready
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

  // Real contract data (uncomment when contract is live)
  // const { data: totalRaisedRaw } = useReadContract({
  //   address: PRESALE_CONTRACT,
  //   abi: PRESALE_ABI,
  //   functionName: 'totalRaised',
  // });
  // const { data: userPurchasesRaw } = useReadContract({
  //   address: PRESALE_CONTRACT,
  //   abi: PRESALE_ABI,
  //   functionName: 'userPurchases',
  //   args: address ? [address] : undefined,
  // });

  const [raised, setRaised] = useState(0); // fallback + demo simulation
  const hardCap = 200;
  const progress = Math.min((raised / hardCap) * 100, 100);

  // Demo simulation – replace with contract polling or event listener in production
  useEffect(() => {
    const interval = setInterval(() => {
      setRaised((prev) => prev + Math.random() * 0.1); // demo only
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Quick fade-in on load
  useEffect(() => {
    gsap.fromTo('.progress-container', 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  const currentStage = STAGES.find(
    (s) => raised >= s.min && raised < s.max
  ) || STAGES[STAGES.length - 1];

  const totalRaisedDisplay = raised.toFixed(2);
  const userTokensDisplay = '0.00'; // Replace with real: userPurchasesRaw ? Number(formatEther(userPurchasesRaw)).toFixed(2) : '0.00'

  return (
    <section className="pinned-section fade-in-section min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      <div className="progress-container w-full max-w-2xl mx-auto p-6 bg-gray-900/70 rounded-2xl border border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
        {/* Stage & Raised */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <span className="text-cyan-400 font-bold text-xl tracking-wide">
            {currentStage.name} – {currentStage.price} ETH/KLEO
          </span>
          <span className="text-white font-medium text-lg">
            Raised: <span className="text-cyan-300">{totalRaisedDisplay}</span> / {hardCap} ETH
          </span>
        </div>

        {/* Progress Bar – animated fill */}
        <div className="w-full bg-gray-800/80 rounded-full h-6 mb-8 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-cyan-500 via-cyan-400 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Connected Wallet Info */}
        {isConnected && (
          <div className="text-center text-base text-gray-300 space-y-3 bg-gray-800/40 rounded-xl p-5 border border-cyan-500/20">
            <div className="flex justify-center items-center gap-3">
              <span>Your purchases:</span>
              <span className="text-cyan-400 font-bold text-xl">{userTokensDisplay} KLEO</span>
            </div>
            <div className="flex justify-center items-center gap-3">
              <span>Wallet balance:</span>
              <span className="text-cyan-400 font-bold text-xl">
                {balance ? formatEther(balance.value) : '0'} ETH
              </span>
            </div>
          </div>
        )}

        {/* Call to action if not connected */}
        {!isConnected && (
          <div className="text-center text-gray-400 mt-6 text-sm">
            Connect your wallet to see your purchases and balance
          </div>
        )}
      </div>
    </section>
  );
}
