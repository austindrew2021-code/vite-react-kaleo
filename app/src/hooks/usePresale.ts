import { useState } from 'react';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';

export function usePresale() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { sendTransaction, isPending } = useSendTransaction();
  
  // Mock data for demo purposes
  const [presaleData] = useState({
    totalRaised: BigInt(3649000000000000000000), // $3649 raised
    tokenPrice: BigInt(100000000000), // $0.0001 per token (stage 1)
    hardCap: BigInt(5000000000000000000000), // $5000 ETH
  });

  const calculateTokenAmount = (ethAmount: string): string => {
    if (!ethAmount || isNaN(parseFloat(ethAmount))) return '0';
    const eth = parseEther(ethAmount);
    const ethPriceUSD = 3500;
    const usdValue = Number(eth) * ethPriceUSD / 1e18;
    const tokenPrice = 0.0001; // Stage 1 price
    const tokens = usdValue / tokenPrice;
    return tokens.toFixed(0);
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
    sendTransaction,
    isPending,
    calculateTokenAmount,
    progressPercentage,
    raisedETH,
    hardCapETH,
    tokenPriceETH,
  };
}
