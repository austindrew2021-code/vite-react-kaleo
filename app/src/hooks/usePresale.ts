import { useCallback, useEffect } from 'react';
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
  PRESALE_WALLET,
  PRESALE_STAGES,
  HARD_CAP_ETH,
  LISTING_PRICE,
} from '../store/presaleStore';
import { SEPOLIA_CHAIN_ID } from '../wagmi';

export function usePresale() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: ethBalance } = useBalance({ address });
  const { switchChain } = useSwitchChain();

  const {
    totalRaised,
    addRaised,
    addPurchase,
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
  }, [sendTxHash, setTxHash, setTxStatus]);

  // ── Handle send error ─────────────────────────────────────────────────
  useEffect(() => {
    if (isSendError && sendError) {
      const msg = sendError.message?.includes('User rejected')
        ? 'Transaction rejected by user'
        : sendError.message?.includes('insufficient funds')
          ? 'Insufficient Sepolia ETH balance'
          : 'Transaction failed. Please try again.';
      setTxStatus('error');
      setTxError(msg);
    }
  }, [isSendError, sendError, setTxStatus, setTxError]);

  // ── Handle confirmation ───────────────────────────────────────────────
  useEffect(() => {
    if (isConfirmed && sendTxHash) {
      setTxStatus('success');

      // Record the purchase using stored ethAmount
      const ethAmount = usePresaleStore.getState().ethAmount;
      const eth = parseFloat(ethAmount);
      if (!isNaN(eth) && eth > 0) {
        const stage = getCurrentStage(totalRaised);
        const kleoReceived = eth / stage.priceEth;

        addRaised(eth);
        addPurchase({
          ethSpent: eth,
          kleoReceived,
          stage: stage.stage,
          priceEth: stage.priceEth,
          txHash: sendTxHash,
          timestamp: Date.now(),
        });
      }
    }
  }, [isConfirmed, sendTxHash, totalRaised, addRaised, addPurchase, setTxStatus]);

  // ── Derived stage data ────────────────────────────────────────────────
  const currentStage = getCurrentStage(totalRaised);
  const stageProgress = getStageProgress(totalRaised);
  const overallProgress = getOverallProgress(totalRaised);
  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID;

  const nextStage =
    currentStage.stage < 12
      ? PRESALE_STAGES[currentStage.stage] // next stage (0-indexed + 1)
      : null;

  // ── Calculate KLEO from ETH input ─────────────────────────────────────
  const calculateTokenAmount = useCallback(
    (ethAmount: string): string => {
      if (!ethAmount || isNaN(parseFloat(ethAmount))) return '0';
      const eth = parseFloat(ethAmount);
      if (eth <= 0) return '0';
      const tokens = eth / currentStage.priceEth;
      return tokens.toLocaleString('en-US', {
        maximumFractionDigits: 0,
      });
    },
    [currentStage.priceEth]
  );

  // ── Switch to Sepolia ─────────────────────────────────────────────────
  const switchToSepolia = useCallback(() => {
    switchChain({ chainId: SEPOLIA_CHAIN_ID });
  }, [switchChain]);

  // ── Buy tokens (real Sepolia ETH transfer) ────────────────────────────
  const buyTokens = useCallback(
    async (ethAmount: string) => {
      if (!isConnected || !address) {
        setTxError('Please connect your wallet first');
        return;
      }

      if (!isOnSepolia) {
        setTxError('Please switch to Sepolia network');
        switchToSepolia();
        return;
      }

      const eth = parseFloat(ethAmount);
      if (isNaN(eth) || eth <= 0) {
        setTxError('Please enter a valid ETH amount');
        return;
      }

      // Check balance
      if (ethBalance && eth > parseFloat(formatEther(ethBalance.value))) {
        setTxError('Insufficient Sepolia ETH balance');
        return;
      }

      // Reset previous tx state
      resetTx();
      setTxStatus('pending');

      try {
        sendTransaction({
          to: PRESALE_WALLET,
          value: parseEther(ethAmount),
        });
      } catch (err) {
        setTxStatus('error');
        setTxError('Failed to initiate transaction');
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
    // Connection
    isConnected,
    address,
    isOnSepolia,
    ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',

    // Actions
    buyTokens,
    switchToSepolia,
    calculateTokenAmount,
    resetTx,

    // Transaction state
    txHash,
    txStatus,
    txError,
    isSending,
    isConfirming,

    // Presale data
    currentStage,
    nextStage,
    stageProgress,
    overallProgress,
    totalRaised,
    hardCapEth: HARD_CAP_ETH,
    listingPrice: LISTING_PRICE,
    stages: PRESALE_STAGES,
  };
}
