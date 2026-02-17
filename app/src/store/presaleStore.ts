import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Recipient wallet for all presale funds ──────────────────────────────
export const PRESALE_WALLET = '0x0722ef1dcfa7849b3bf0db375793bfacc52b8e39' as const;

// ── Listing price at public launch ──────────────────────────────────────
export const LISTING_PRICE = 0.000210; // ETH per KLEO

// ── Hard cap & total presale tokens ─────────────────────────────────────
export const HARD_CAP_ETH = 31_775;
export const TOTAL_PRESALE_TOKENS = 224_500_000;

// ── 12-Stage Presale Pricing Model ──────────────────────────────────────
export interface PresaleStage {
  stage: number;
  priceEth: number;
  tokenAllocation: number;
  ethTarget: number;
  cumulativeEth: number;
  discount: number;
  direction?: 'up' | 'down';
}

export const PRESALE_STAGES: PresaleStage[] = [
  { stage: 1,  priceEth: 0.000035, tokenAllocation: 5_000_000,  ethTarget: 175,   cumulativeEth: 175,    discount: 83, direction: 'up' },
  { stage: 2,  priceEth: 0.000050, tokenAllocation: 7_000_000,  ethTarget: 350,   cumulativeEth: 525,    discount: 76, direction: 'up' },
  { stage: 3,  priceEth: 0.000065, tokenAllocation: 10_000_000, ethTarget: 650,   cumulativeEth: 1_175,  discount: 69, direction: 'up' },
  { stage: 4,  priceEth: 0.000080, tokenAllocation: 12_500_000, ethTarget: 1_000, cumulativeEth: 2_175,  discount: 62, direction: 'up' },
  { stage: 5,  priceEth: 0.000095, tokenAllocation: 15_000_000, ethTarget: 1_425, cumulativeEth: 3_600,  discount: 55, direction: 'up' },
  { stage: 6,  priceEth: 0.000110, tokenAllocation: 17_500_000, ethTarget: 1_925, cumulativeEth: 5_525,  discount: 48, direction: 'up' },
  { stage: 7,  priceEth: 0.000125, tokenAllocation: 20_000_000, ethTarget: 2_500, cumulativeEth: 8_025,  discount: 40, direction: 'up' },
  { stage: 8,  priceEth: 0.000140, tokenAllocation: 22_500_000, ethTarget: 3_150, cumulativeEth: 11_175, discount: 33, direction: 'up' },
  { stage: 9,  priceEth: 0.000155, tokenAllocation: 25_000_000, ethTarget: 3_875, cumulativeEth: 15_050, discount: 26, direction: 'up' },
  { stage: 10, priceEth: 0.000170, tokenAllocation: 27_500_000, ethTarget: 4_675, cumulativeEth: 19_725, discount: 19, direction: 'up' },
  { stage: 11, priceEth: 0.000185, tokenAllocation: 30_000_000, ethTarget: 5_550, cumulativeEth: 25_275, discount: 12, direction: 'up' },
  { stage: 12, priceEth: 0.000200, tokenAllocation: 32_500_000, ethTarget: 6_500, cumulativeEth: 31_775, discount: 5,  direction: 'up' },
];

// ── Helper: determine current stage from total raised ───────────────────
export function getCurrentStage(totalRaised: number): PresaleStage {
  for (const stage of PRESALE_STAGES) {
    if (totalRaised < stage.cumulativeEth) return stage;
  }
  return PRESALE_STAGES[PRESALE_STAGES.length - 1];
}

// ── Helper: progress within current stage (0-100) ──────────────────────
export function getStageProgress(totalRaised: number): number {
  const stage = getCurrentStage(totalRaised);
  const stageStart = stage.cumulativeEth - stage.ethTarget;
  const raisedInStage = Math.max(0, totalRaised - stageStart);
  return Math.min((raisedInStage / stage.ethTarget) * 100, 100);
}

// ── Helper: overall presale progress (0-100) ────────────────────────────
export function getOverallProgress(totalRaised: number): number {
  return Math.min((totalRaised / HARD_CAP_ETH) * 100, 100);
}

// ── Helper: price direction vs previous stage ───────────────────────────
export function getPriceDirection(currentStage: PresaleStage): 'up' | 'down' | 'same' {
  const prevStage = PRESALE_STAGES.find(s => s.stage === currentStage.stage - 1);
  if (!prevStage) return 'up';
  if (currentStage.priceEth > prevStage.priceEth) return 'up';
  if (currentStage.priceEth < prevStage.priceEth) return 'down';
  return 'same';
}

// ── Purchase record ─────────────────────────────────────────────────────
export interface PurchaseRecord {
  ethSpent: number;
  kleoReceived: number;
  stage: number;
  priceEth: number;
  txHash: string;
  timestamp: number;
}

// ── Zustand Store ───────────────────────────────────────────────────────
export type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface PresaleState {
  ethAmount: string;
  tokenAmount: string;
  setEthAmount: (amount: string) => void;
  setTokenAmount: (amount: string) => void;

  totalRaised: number;
  addRaised: (eth: number) => void;

  purchases: PurchaseRecord[];
  addPurchase: (purchase: PurchaseRecord) => void;

  txHash: string | null;
  txStatus: TxStatus;
  txError: string | null;
  setTxHash: (hash: string | null) => void;
  setTxStatus: (status: TxStatus) => void;
  setTxError: (error: string | null) => void;

  isPresaleActive: boolean;
  tokensSoldPercentage: number;
  ethRemainingInStage: number;
  totalKleoPurchased: number;
  totalEthSpent: number;

  reset: () => void;
  resetTx: () => void;
}

export const usePresaleStore = create<PresaleState>()(
  persist(
    (set, get) => ({
      ethAmount: '',
      tokenAmount: '',
      setEthAmount: (amount) => set({ ethAmount: amount }),
      setTokenAmount: (amount) => set({ tokenAmount: amount }),

      totalRaised: 0,
      addRaised: (eth) => set((state) => ({ totalRaised: state.totalRaised + eth })),

      purchases: [],
      addPurchase: (purchase) =>
        set((state) => ({ purchases: [...state.purchases, purchase] })),

      txHash: null,
      txStatus: 'idle' as TxStatus,
      txError: null,
      setTxHash: (hash) => set({ txHash: hash }),
      setTxStatus: (status) => set({ txStatus: status }),
      setTxError: (error) => set({ txError: error }),

      get isPresaleActive() {
        return get().totalRaised < HARD_CAP_ETH;
      },
      get tokensSoldPercentage() {
        const totalEthSpent = get().purchases.reduce((sum, p) => sum + p.ethSpent, 0);
        return Math.min((totalEthSpent / HARD_CAP_ETH) * 100, 100);
      },
      get ethRemainingInStage() {
        const stage = getCurrentStage(get().totalRaised);
        const stageStart = stage.cumulativeEth - stage.ethTarget;
        const raisedInStage = Math.max(0, get().totalRaised - stageStart);
        return stage.ethTarget - raisedInStage;
      },
      get totalKleoPurchased() {
        return get().purchases.reduce((sum, p) => sum + p.kleoReceived, 0);
      },
      get totalEthSpent() {
        return get().purchases.reduce((sum, p) => sum + p.ethSpent, 0);
      },

      reset: () => set({ ethAmount: '', tokenAmount: '' }),
      resetTx: () => set({ txHash: null, txStatus: 'idle', txError: null }),
    }),
    {
      name: 'kaleo-presale-storage',
      partialize: (state) => ({
        totalRaised: state.totalRaised,
        purchases: state.purchases,
      }),
    }
  )
);
