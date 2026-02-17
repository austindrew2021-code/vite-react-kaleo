import { useCallback, useEffect, useMemo } from 'react';
import {
  useAccount,
  useBalance,
  useChainId,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import {
  usePresaleStore,
  getCurrentStage,
  getStageProgress,
  getOverallProgress,
  getPriceDirection,
  PRESALE_WALLET,
  PRESALE_STAGES,
  HARD_CAP_ETH,
  LISTING_PRICE,
  PurchaseRecord,
} from '../store/presaleStore';
import { SEPOLIA_CHAIN_ID } from '../wagmi';

const MIN_ETH = 0.001;
const MAX_ETH = 100; // reasonable per-tx limit for testnet / UX

export function usePresale() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: ethBalance, refetch: refetchBalance } = useBalance({ address });
  const { switchChainAsync } = useSwitchChain();

  const {
    ethAmount,
    totalRaised,
    purchases,
    txHash,
    txStatus,
    txError,
    setTxHash,
    setTxStatus,
    setTxError,
    resetTx,
    addRaised,
    addPurchase,
  } = usePresaleStore();

  const {
    sendTransaction,
    data: sendTxHash,
    isPending: isSending,
    isError: isSendError,
    error: sendError,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: sendTxHash,
  });

  // ── Transaction flow updates ─────────────────────────────────────────────
  useEffect(() => {
    if (sendTxHash) {
      setTxHash(sendTxHash);
      setTxStatus('confirming');
    }
  }, [sendTxHash, setTxHash, setTxStatus]);

  useEffect(() => {
    if (isSendError && sendError) {
      let msg = 'Transaction failed. Please try again.';
      if (sendError.message?.includes('User rejected')) msg = 'Transaction rejected by user';
      else if (sendError.message?.includes('insufficient funds')) msg = 'Insufficient Sepolia ETH';
      else if (sendError.message?.includes('wrong chain')) msg = 'Switch to Sepolia network';
      else if (sendError.shortMessage) msg = sendError.shortMessage;
      setTxStatus('error');
      setTxError(msg);
    }
  }, [isSendError, sendError, setTxStatus, setTxError]);

  useEffect(() => {
    if (isConfirmed && sendTxHash && ethAmount) {
      const eth = parseFloat(ethAmount);
      if (!isNaN(eth) && eth > 0) {
        const stage = getCurrentStage(totalRaised);
        const kleoReceived = eth / stage.priceEth;

        // Update global state
        addRaised(eth);
        addPurchase({
          ethSpent: eth,
          kleoReceived,
          stage: stage.stage,
          priceEth: stage.priceEth,
          txHash: sendTxHash,
          timestamp: Date.now(),
        });

        setTxStatus('success');
        refetchBalance();
      }
    }
  }, [isConfirmed, sendTxHash, ethAmount, totalRaised, addRaised, addPurchase, refetchBalance, setTxStatus]);

  // ── Derived values ───────────────────────────────────────────────────────
  const currentStage = useMemo(() => getCurrentStage(totalRaised), [totalRaised]);
  const stageProgress = useMemo(() => getStageProgress(totalRaised), [totalRaised]);
  const overallProgress = useMemo(() => getOverallProgress(totalRaised), [totalRaised]);
  const priceDirection = useMemo(() => getPriceDirection(currentStage), [currentStage]);

  const priceChangePercent = useMemo(() => {
    const prev = PRESALE_STAGES.find(s => s.stage === currentStage.stage - 1);
    if (!prev) return 0;
    return ((currentStage.priceEth - prev.priceEth) / prev.priceEth) * 100;
  }, [currentStage]);

  // ── Momentum / Direction indicator ───────────────────────────────────────
  // Combines price trend + recent activity velocity (last 8 tx ≈ last few minutes/hours)
  const momentumScore = useMemo(() => {
    if (purchases.length === 0) return 0;

    const recent = purchases.slice(-8); // last 8 buys
    if (recent.length < 2) return 0;

    const timeSpan = Date.now() - recent[0].timestamp;
    const buysPerMinute = (recent.length / (timeSpan / 60000)) || 0;

    const recentEth = recent.reduce((sum, p) => sum + p.ethSpent, 0);
    const avgRecent = recentEth / recent.length;

    // Normalize: >0.05 eth/min + increasing price = strong bullish
    const activityFactor = Math.min(buysPerMinute * 20, 1); // cap at 1
    const priceFactor = priceChangePercent / 100; // e.g. +83% = 0.83

    return activityFactor + priceFactor * 0.6;
  }, [purchases, priceChangePercent]);

  const direction = useMemo<'up' | 'down' | 'neutral'>(() => {
    if (momentumScore > 1.2) return 'up';     // strong bullish
    if (momentumScore > 0.4) return 'up';     // mild bullish
    if (momentumScore < -0.3) return 'down';  // bearish (unlikely in presale)
    return 'neutral';
  }, [momentumScore]);

  const directionLabel = useMemo(() => {
    if (direction === 'up') {
      if (momentumScore > 1.2) return 'Strong Buying Pressure ↑';
      return 'Bullish Momentum ↑';
    }
    if (direction === 'down') return 'Cooling Off ↓';
    return 'Stable →';
  }, [direction, momentumScore]);

  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID;
  const nextStage = currentStage.stage < PRESALE_STAGES.length ? PRESALE_STAGES[currentStage.stage] : null;

  const calculateTokenAmount = useCallback(
    (ethInput: string): string => {
      if (!ethInput || isNaN(parseFloat(ethInput))) return '0';
      const eth = parseFloat(ethInput);
      if (eth <= 0) return '0';
      const tokens = eth / currentStage.priceEth;
      return tokens.toLocaleString('en-US', { maximumFractionDigits: 0 });
    },
    [currentStage.priceEth]
  );

  const switchToSepolia = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
    } catch (err: any) {
      setTxError(err?.shortMessage || 'Failed to switch network');
    }
  }, [switchChainAsync, setTxError]);

  const buyWithEth = useCallback(
    async (amountEth: string) => {
      if (!isConnected || !address) {
        setTxError('Connect your wallet first');
        return;
      }
      if (!isOnSepolia) {
        setTxError('Please switch to Sepolia');
        await switchToSepolia();
        return;
      }

      const eth = parseFloat(amountEth);
      if (isNaN(eth) || eth < MIN_ETH) {
        setTxError(`Minimum ${MIN_ETH} ETH`);
        return;
      }
      if (eth > MAX_ETH) {
        setTxError(`Maximum ${MAX_ETH} ETH per transaction`);
        return;
      }
      if (ethBalance && eth > parseFloat(formatEther(ethBalance.value))) {
        setTxError('Insufficient Sepolia ETH balance');
        return;
      }

      resetTx();
      setTxStatus('pending');

      try {
        sendTransaction({
          to: PRESALE_WALLET,
          value: parseEther(amountEth),
        });
      } catch (err: any) {
        setTxStatus('error');
        setTxError(err?.shortMessage || 'Failed to send transaction');
      }
    },
    [
      isConnected,
      address,
      isOnSepolia,
      ethBalance,
      switchToSepolia,
      resetTx,
      setTxStatus,
      setTxError,
      sendTransaction,
    ]
  );

  // Placeholder for future Stripe integration (call from BuySection)
  const buyWithCard = useCallback(async (usdAmount: number) => {
    // → redirect to Stripe Checkout
    // On success → webhook or client poll → addPurchase(...)
    console.warn('Stripe buy not implemented yet — amount:', usdAmount);
    // Future: fetch('/api/create-checkout-session', { method: 'POST', body: JSON.stringify({ usdAmount, wallet: address }) })
  }, []);

  return {
    isConnected,
    address,
    isOnSepolia,
    ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',

    buyWithEth,
    buyWithCard,               // future card payment entry point
    switchToSepolia,
    calculateTokenAmount,
    resetTx,

    txHash,
    txStatus,
    txError,
    isSending,
    isConfirming,

    currentStage,
    nextStage,
    stageProgress,
    overallProgress,
    totalRaised,
    hardCapEth: HARD_CAP_ETH,
    listingPrice: LISTING_PRICE,
    stages: PRESALE_STAGES,

    priceDirection,
    priceChangePercent,
    momentumScore,
    direction,
    directionLabel,

    tokensSoldPercentage: overallProgress,
    ethRemainingInStage: currentStage.ethTarget - (totalRaised - (currentStage.cumulativeEth - currentStage.ethTarget)),
    totalKleoPurchased: purchases.reduce((sum, p) => sum + p.kleoReceived, 0),
    totalEthSpent: purchases.reduce((sum, p) => sum + p.ethSpent, 0),
    totalBuyers: purchases.length,

    minEth: MIN_ETH,
    maxEth: MAX_ETH,
  };
}
