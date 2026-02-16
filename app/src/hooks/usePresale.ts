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
} from '../store/presaleStore';
import { SEPOLIA_CHAIN_ID } from '../wagmi';

export function usePresale() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: ethBalance, refetch: refetchBalance } = useBalance({ address });
  const { switchChainAsync } = useSwitchChain();

  const {
    ethAmount,
    tokenAmount,
    setEthAmount,
    setTokenAmount,
    totalRaised,
    purchases,
    txHash,
    txStatus,
    txError,
    setTxHash,
    setTxStatus,
    setTxError,
    resetTx,
  } = usePresaleStore();

  // ── Send transaction hook ─────────────────────────────────────────────
  const {
    sendTransaction,
    data: sendTxHash,
    isPending: isSending,
    isError: isSendError,
    error: sendError,
  } = useSendTransaction();

  // ── Wait for confirmation ─────────────────────────────────────────────
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: sendTxHash,
  });

  // ── Sync tx hash into store ───────────────────────────────────────────
  useEffect(() => {
    if (sendTxHash) {
      setTxHash(sendTxHash);
      setTxStatus('confirming');
    }
  }, [sendTxHash]);

  // ── Handle send error ─────────────────────────────────────────────────
  useEffect(() => {
    if (isSendError && sendError) {
      let msg = 'Transaction failed. Please try again.';
      if (sendError.message?.includes('User rejected')) {
        msg = 'Transaction rejected by user';
      } else if (sendError.message?.includes('insufficient funds')) {
        msg = 'Insufficient Sepolia ETH balance';
      } else if (sendError.message?.includes('wrong chain')) {
        msg = 'Please switch to Sepolia network';
      }
      setTxStatus('error');
      setTxError(msg);
    }
  }, [isSendError, sendError]);

  // ── Handle confirmation & record purchase ─────────────────────────────
  useEffect(() => {
    if (isConfirmed && sendTxHash && ethAmount) {
      setTxStatus('success');

      const eth = parseFloat(ethAmount);
      if (!isNaN(eth) && eth > 0) {
        const stage = getCurrentStage(totalRaised);
        const kleoReceived = eth / stage.priceEth;

        usePresaleStore.getState().addRaised(eth);
        usePresaleStore.getState().addPurchase({
          ethSpent: eth,
          kleoReceived,
          stage: stage.stage,
          priceEth: stage.priceEth,
          txHash: sendTxHash,
          timestamp: Date.now(),
        });
      }

      refetchBalance();
    }
  }, [isConfirmed, sendTxHash, ethAmount, totalRaised, refetchBalance]);

  // ── Derived state (memoized) ──────────────────────────────────────────
  const currentStage = useMemo(() => getCurrentStage(totalRaised), [totalRaised]);
  const stageProgress = useMemo(() => getStageProgress(totalRaised), [totalRaised]);
  const overallProgress = useMemo(() => getOverallProgress(totalRaised), [totalRaised]);
  const priceDirection = useMemo(() => getPriceDirection(currentStage), [currentStage]);
  const priceChangePercent = useMemo(() => {
    const prevStage = PRESALE_STAGES.find(s => s.stage === currentStage.stage - 1);
    if (!prevStage) return 0;
    return ((currentStage.priceEth - prevStage.priceEth) / prevStage.priceEth) * 100;
  }, [currentStage]);

  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID;
  const nextStage = currentStage.stage < 12 ? PRESALE_STAGES[currentStage.stage] : null;

  // ── Calculate KLEO from ETH input ─────────────────────────────────────
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

  // ── Switch to Sepolia ─────────────────────────────────────────────────
  const switchToSepolia = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
    } catch (err) {
      setTxError('Failed to switch network. Please try manually.');
    }
  }, [switchChainAsync]);

  // ── Buy tokens (real Sepolia ETH transfer) ────────────────────────────
  const buyTokens = useCallback(
    async (ethInput: string) => {
      if (!isConnected || !address) {
        setTxError('Please connect your wallet first');
        return;
      }

      if (!isOnSepolia) {
        setTxError('Please switch to Sepolia network');
        await switchToSepolia();
        return;
      }

      const eth = parseFloat(ethInput);
      if (isNaN(eth) || eth <= 0) {
        setTxError('Please enter a valid ETH amount');
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
          value: parseEther(ethInput),
        });
      } catch (err: any) {
        setTxStatus('error');
        setTxError(err?.shortMessage || 'Failed to initiate transaction');
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

  return {
    isConnected,
    address,
    isOnSepolia,
    ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',

    buyTokens,
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
    tokensSoldPercentage: overallProgress,
    ethRemainingInStage: currentStage.ethTarget - (totalRaised - (currentStage.cumulativeEth - currentStage.ethTarget)),
    totalKleoPurchased: purchases.reduce((sum, p) => sum + p.kleoReceived, 0),
    totalEthSpent: purchases.reduce((sum, p) => sum + p.ethSpent, 0),
    totalBuyers: purchases.length,
  };
}
