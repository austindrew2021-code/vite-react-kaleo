import { useState } from 'react';
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Mock presale contract ABI - in production, replace with actual contract
const PRESALE_ABI = [
  {
    inputs: [],
    name: 'totalRaised',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'hardCap',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'buyTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

const PRESALE_CONTRACT = '0x0000000000000000000000000000000000000000' as const;

export function usePresale() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  
  // Mock data for demo purposes
  const [presaleData] = useState({
    totalRaised: BigInt(2840000000000000000000), // 2840 ETH
    tokenPrice: BigInt(4200000000000000), // 0.0042 ETH per token
    hardCap: BigInt(5000000000000000000000), // 5000 ETH
  });

  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  const buyTokens = async (ethAmount: string) => {
    if (!isConnected || !address) return;
    
    try {
      writeContract({
        address: PRESALE_CONTRACT,
        abi: PRESALE_ABI,
        functionName: 'buyTokens',
        args: [parseEther(ethAmount)],
        value: parseEther(ethAmount),
      });
    } catch (err) {
      console.error('Buy tokens error:', err);
    }
  };

  const calculateTokenAmount = (ethAmount: string): string => {
    if (!ethAmount || isNaN(parseFloat(ethAmount))) return '0';
    const eth = parseEther(ethAmount);
    const tokens = (eth * BigInt(1000000)) / presaleData.tokenPrice;
    return (Number(tokens) / 1000000).toFixed(2);
  };

  const progressPercentage = Number(
    (presaleData.totalRaised * BigInt(100)) / presaleData.hardCap
  );

  const raisedETH = formatEther(presaleData.totalRaised);
  const hardCapETH = formatEther(presaleData.hardCap);
  const tokenPriceETH = formatEther(presaleData.tokenPrice);

  return {
    isConnected,
    address,
    ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',
    buyTokens,
    isPending,
    isSuccess,
    isError,
    error,
    calculateTokenAmount,
    progressPercentage,
    raisedETH,
    hardCapETH,
    tokenPriceETH,
  };
}
