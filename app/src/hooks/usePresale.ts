import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  useBalance,
  useChainId,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { createClient } from '@supabase/supabase-js';
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

const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = _sbUrl && _sbKey ? createClient(_sbUrl, _sbKey) : null;

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

  const [stripeLoading, setStripeLoading] = useState(false);
  const [momentum, setMomentum] = useState(0); // proxy: net buys in last \~10 min window (simplified)

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

  // Track momentum (simple: count recent purchases vs time)
  useEffect(() => {
    if (purchases.length < 2) return;
    const now = Date.now();
    const recent = purchases.filter(p => now - p.timestamp < 600_000); // 10 min
    const netMomentum = recent.length > 3 ? 1 : recent.length > 1 ? 0.3 : -0.2;
    setMomentum(netMomentum);
  }, [purchases]);

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
      else if (sendError.message?.includes('insufficient funds')) msg = 'Insufficient Sepolia ETH balance';
      else if (sendError.message?.includes('wrong chain')) msg = 'Please switch to Sepolia network';
      setTxStatus('error');
      setTxError(msg);
    }
  }, [isSendError, sendError, setTxStatus, setTxError]);

  useEffect(() => {
    if (!isConfirmed || !sendTxHash || !ethAmount || !address) return;

    setTxStatus('success');

    const eth = parseFloat(ethAmount);
    if (isNaN(eth) || eth <= 0) return;

    const stage = getCurrentStage(totalRaised);
    const kleoReceived = eth / stage.priceEth;

    // Update local store
    addRaised(eth);
    addPurchase({
      ethSpent: eth,
      kleoReceived,
      stage: stage.stage,
      priceEth: stage.priceEth,
      txHash: sendTxHash,
      timestamp: Date.now(),
    });

    // Persist to Supabase
    if (supabase) {
      supabase
        .from('presale_purchases')
        .insert({
          wallet_address: address.toLowerCase(),
          tokens: kleoReceived,
          eth_spent: eth,
          stage: stage.stage,
          price_eth: stage.priceEth,
          tx_hash: sendTxHash,
          payment_method: 'eth',
        })
        .then(({ error }) => {
          if (error) console.error('Supabase insert failed:', error.message, error.code);
        });
    }

    refetchBalance();
  }, [isConfirmed, sendTxHash, ethAmount, address, totalRaised, addRaised, addPurchase, refetchBalance]);

  const currentStage = useMemo(() => getCurrentStage(totalRaised), [totalRaised]);
  const stageProgress = useMemo(() => getStageProgress(totalRaised), [totalRaised]);
  const overallProgress = useMemo(() => getOverallProgress(totalRaised), [totalRaised]);
  const priceDirection = useMemo(() => getPriceDirection(currentStage), [currentStage]);
  const priceChangePercent = useMemo(() => {
    const prev = PRESALE_STAGES.find(s => s.stage === currentStage.stage - 1);
    return prev ? ((currentStage.priceEth - prev.priceEth) / prev.priceEth) * 100 : 0;
  }, [currentStage]);

  const directionIndicator = useMemo(() => {
    if (priceChangePercent > 10 || momentum > 0.5) return { text: 'Strong ↑ Bullish', color: 'text-green-400' };
    if (priceChangePercent > 0 || momentum > 0) return { text: '↑ Mild Bullish', color: 'text-emerald-300' };
    if (priceChangePercent < -5 || momentum < -0.3) return { text: '↓ Bearish Pressure', color: 'text-red-400' };
    return { text: '→ Neutral / Stable', color: 'text-gray-400' };
  }, [priceChangePercent, momentum]);

  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID;
  const nextStage = currentStage.stage < 12 ? PRESALE_STAGES[currentStage.stage] : null;

  const calculateTokenAmount = useCallback(
    (input: string, isEth = true): string => {
      if (!input || isNaN(parseFloat(input))) return '0';
      const val = parseFloat(input);
      if (val <= 0) return '0';
      const rate = isEth ? currentStage.priceEth : currentStage.priceEth * 2000; // rough USD/ETH proxy
      return (val / rate).toLocaleString('en-US', { maximumFractionDigits: 0 });
    },
    [currentStage.priceEth]
  );

  const switchToSepolia = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
    } catch (err) {
      setTxError('Failed to switch network. Please switch manually.');
    }
  }, [switchChainAsync, setTxError]);

  const buyWithEth = useCallback(
    async (ethInput: string) => {
      if (!isConnected || !address) {
        setTxError('Please connect your wallet first');
        return;
      }
      if (!isOnSepolia) {
        await switchToSepolia();
        return;
      }
      const eth = parseFloat(ethInput);
      if (isNaN(eth) || eth <= 0) {
        setTxError('Invalid ETH amount');
        return;
      }
      if (ethBalance && eth > parseFloat(formatEther(ethBalance.value))) {
        setTxError('Insufficient Sepolia ETH');
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
        setTxError(err?.shortMessage || 'Failed to send transaction');
      }
    },
    [isConnected, address, isOnSepolia, ethBalance, switchToSepolia, resetTx, setTxStatus, setTxError, sendTransaction]
  );

  const buyWithCard = useCallback(
    async (usdAmount: string) => {
      if (!isConnected || !address) {
        setTxError('Connect wallet first');
        return;
      }
      if (!usdAmount || parseFloat(usdAmount) < 10) {
        setTxError('Minimum $10');
        return;
      }

      setStripeLoading(true);
      try {
        const tokens = calculateTokenAmount(usdAmount, false);
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(parseFloat(usdAmount) * 100), // cents
            tokens: parseFloat(tokens),
            wallet: address,
            stage: currentStage.stage,
          }),
        });

        const { sessionId, error } = await res.json();
        if (error) throw new Error(error);

        const stripe = await import('@stripe/stripe-js').then(m => m.loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
        if (!stripe) throw new Error('Stripe failed to load');

        await stripe.redirectToCheckout({ sessionId });
      } catch (err: any) {
        setTxError(err.message || 'Card payment failed');
      } finally {
        setStripeLoading(false);
      }
    },
    [isConnected, address, currentStage.stage, calculateTokenAmount]
  );

  return {
    isConnected,
    address,
    isOnSepolia,
    ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',

    buyWithEth,
    buyWithCard,
    switchToSepolia,
    calculateTokenAmount,
    resetTx,

    txHash,
    txStatus,
    txError,
    isSending,
    isConfirming,
    stripeLoading,

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
    directionIndicator,
    momentum,
    tokensSoldPercentage: overallProgress,
    ethRemainingInStage: currentStage.ethTarget - (totalRaised - (currentStage.cumulativeEth - currentStage.ethTarget)),
    totalKleoPurchased: purchases.reduce((sum, p) => sum + p.kleoReceived, 0),
    totalEthSpent: purchases.reduce((sum, p) => sum + p.ethSpent, 0),
    totalBuyers: purchases.length,
  };
}
