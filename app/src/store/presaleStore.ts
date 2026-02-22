import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Listing price at public launch ──────────────────────────────────────
export const LISTING_PRICE_USD = 0.05; // USD per KLEO at launch

// ── Hard cap & total presale tokens ─────────────────────────────────────
export const HARD_CAP_USD = 2_368_000;
export const TOTAL_PRESALE_TOKENS = 224_500_000;

// ── 12-Stage Presale Pricing Model (USD) ────────────────────────────────
export interface PresaleStage {
  stage: number;
  priceUsd: number;
  tokenAllocation: number;
  usdTarget: number;
  cumulativeUsd: number;
  discount: number;
}

export const PRESALE_STAGES: PresaleStage[] = [
  { stage: 1,  priceUsd: 0.0010, tokenAllocation:  5_000_000, usdTarget:    5_000, cumulativeUsd:      5_000, discount: 98 },
  { stage: 2,  priceUsd: 0.0015, tokenAllocation:  7_000_000, usdTarget:   10_500, cumulativeUsd:     15_500, discount: 97 },
  { stage: 3,  priceUsd: 0.0022, tokenAllocation: 10_000_000, usdTarget:   22_000, cumulativeUsd:     37_500, discount: 96 },
  { stage: 4,  priceUsd: 0.0030, tokenAllocation: 12_500_000, usdTarget:   37_500, cumulativeUsd:     75_000, discount: 94 },
  { stage: 5,  priceUsd: 0.0042, tokenAllocation: 15_000_000, usdTarget:   63_000, cumulativeUsd:    138_000, discount: 92 },
  { stage: 6,  priceUsd: 0.0055, tokenAllocation: 17_500_000, usdTarget:   96_250, cumulativeUsd:    234_250, discount: 89 },
  { stage: 7,  priceUsd: 0.0070, tokenAllocation: 20_000_000, usdTarget:  140_000, cumulativeUsd:    374_250, discount: 86 },
  { stage: 8,  priceUsd: 0.0090, tokenAllocation: 22_500_000, usdTarget:  202_500, cumulativeUsd:    576_750, discount: 82 },
  { stage: 9,  priceUsd: 0.0110, tokenAllocation: 25_000_000, usdTarget:  275_000, cumulativeUsd:    851_750, discount: 78 },
  { stage: 10, priceUsd: 0.0135, tokenAllocation: 27_500_000, usdTarget:  371_250, cumulativeUsd:  1_223_000, discount: 73 },
  { stage: 11, priceUsd: 0.0165, tokenAllocation: 30_000_000, usdTarget:  495_000, cumulativeUsd:  1_718_000, discount: 67 },
  { stage: 12, priceUsd: 0.0200, tokenAllocation: 32_500_000, usdTarget:  650_000, cumulativeUsd:  2_368_000, discount: 60 },
];

export function getCurrentStage(totalRaisedUsd: number): PresaleStage {
  for (const stage of PRESALE_STAGES) {
    if (totalRaisedUsd < stage.cumulativeUsd) return stage;
  }
  return PRESALE_STAGES[PRESALE_STAGES.length - 1];
}

export function getStageProgress(totalRaisedUsd: number): number {
  const stage = getCurrentStage(totalRaisedUsd);
  const stageStart = stage.cumulativeUsd - stage.usdTarget;
  const raisedInStage = Math.max(0, totalRaisedUsd - stageStart);
  return Math.min((raisedInStage / stage.usdTarget) * 100, 100);
}

export function getOverallProgress(totalRaisedUsd: number): number {
  return Math.min((totalRaisedUsd / HARD_CAP_USD) * 100, 100);
}

export interface PurchaseRecord {
  usdSpent: number;
  kleoReceived: number;
  stage: number;
  priceUsd: number;
  txHash: string;
  timestamp: number;
  cryptoType?: string;
}

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

interface PresaleState {
  usdAmount: string;
  tokenAmount: string;
  setUsdAmount: (amount: string) => void;
  setTokenAmount: (amount: string) => void;

  totalRaised: number;
  addRaised: (usd: number) => void;
  setTotalRaised: (usd: number) => void;

  purchases: PurchaseRecord[];
  addPurchase: (purchase: PurchaseRecord) => void;

  txStatus: TxStatus;
  txError: string | null;
  setTxStatus: (status: TxStatus) => void;
  setTxError: (error: string | null) => void;

  reset: () => void;
  resetTx: () => void;
}

export const usePresaleStore = create<PresaleState>()(
  persist(
    (set) => ({
      usdAmount: '',
      tokenAmount: '',
      setUsdAmount: (amount) => set({ usdAmount: amount }),
      setTokenAmount: (amount) => set({ tokenAmount: amount }),

      totalRaised: 0,
      addRaised: (usd) => set((state) => ({ totalRaised: state.totalRaised + usd })),
      setTotalRaised: (usd) => set({ totalRaised: usd }),

      purchases: [],
      addPurchase: (purchase) =>
        set((state) => ({ purchases: [...state.purchases, purchase] })),

      txStatus: 'idle' as TxStatus,
      txError: null,
      setTxStatus: (status) => set({ txStatus: status }),
      setTxError: (error) => set({ txError: error }),

      reset: () => set({ usdAmount: '', tokenAmount: '' }),
      resetTx: () => set({ txStatus: 'idle', txError: null }),
    }),
    {
      name: 'kaleo-presale-v2',
      partialize: (state) => ({
        totalRaised: state.totalRaised,
        purchases: state.purchases,
      }),
    }
  )
);
