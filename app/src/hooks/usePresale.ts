// usePresale.ts — simplified hook now that ETH on-chain payments are removed
// Only handles card (Stripe) calculations and direction indicators
import { usePresaleStore, getCurrentStage, PRESALE_STAGES, LISTING_PRICE_USD } from '../store/presaleStore';

export function usePresale() {
  const { totalRaised } = usePresaleStore();
  const currentStage = getCurrentStage(totalRaised);
  const nextStageData = PRESALE_STAGES.find(s => s.stage === currentStage.stage + 1) || null;

  const directionIndicator = {
    text: 'Price Rising',
    color: 'text-green-400',
    icon: '↑',
  };

  const calculateTokenAmount = (usdAmount: string): string => {
    const usd = parseFloat(usdAmount);
    if (!usd || usd <= 0) return '0';
    return Math.floor(usd / currentStage.priceUsd).toLocaleString();
  };

  return {
    currentStage,
    nextStage: nextStageData,
    directionIndicator,
    calculateTokenAmount,
    listingPrice: LISTING_PRICE_USD,
  };
}
