// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRESALE_CONFIG, getCurrentPrice, calculateTokens } from '../config/presaleConfig';

// Types
export interface Purchase {
  id: string;
  walletAddress: string;
  amountUSD: number;
  amountETH?: number;
  tokens: number;
  stage: number;
  price: number;
  paymentMethod: 'ETH' | 'CARD';
  timestamp: number;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface WalletData {
  address: string;
  totalPurchased: number;
  totalTokens: number;
  purchases: Purchase[];
  lastConnected: number;
}

interface PresaleState {
  currentStage: number;
  stageRaised: number[];
  totalRaised: number;
  purchases: Purchase[];
  walletData: Record<string, WalletData>;
  ethAmount: string;
  usdAmount: string;
  tokenAmount: string;
  selectedPaymentMethod: 'ETH' | 'CARD';
  setEthAmount: (amount: string) => void;
  setUsdAmount: (amount: string) => void;
  setTokenAmount: (amount: string) => void;
  setPaymentMethod: (method: 'ETH' | 'CARD') => void;
  addPurchase: (purchase: Purchase) => void;
  getWalletPurchases: (address: string) => WalletData | null;
  getTotalTokensForWallet: (address: string) => number;
  getCurrentStageProgress: () => number;
  getStageData: (stage: number) => { progress: number; raised: number; target: number; remaining: number };
  reset: () => void;
}

const initialStageRaised = PRESALE_CONFIG.STAGES.map((_, index) => {
  if (index === 0) return PRESALE_CONFIG.INITIAL_RAISED;
  return 0;
});

export const usePresaleStore = create<PresaleState>(
  persist(
    (set, get) => ({
      currentStage: PRESALE_CONFIG.CURRENT_STAGE,
      stageRaised: initialStageRaised,
      totalRaised: PRESALE_CONFIG.INITIAL_RAISED,
      purchases: [],
      walletData: {},
      ethAmount: '',
      usdAmount: '',
      tokenAmount: '',
      selectedPaymentMethod: 'ETH',
      
      setEthAmount: (amount) => {
        set({ ethAmount: amount });
        if (amount && !isNaN(parseFloat(amount))) {
          const ethPrice = 3500;
          const usd = parseFloat(amount) * ethPrice;
          const price = getCurrentPrice(get().currentStage - 1);
          const tokens = calculateTokens(usd, price);
          set({ usdAmount: usd.toFixed(2), tokenAmount: tokens.toLocaleString() });
        } else {
          set({ usdAmount: '', tokenAmount: '' });
        }
      },
      
      setUsdAmount: (amount) => {
        set({ usdAmount: amount });
        if (amount && !isNaN(parseFloat(amount))) {
          const price = getCurrentPrice(get().currentStage - 1);
          const tokens = calculateTokens(parseFloat(amount), price);
          set({ tokenAmount: tokens.toLocaleString() });
        } else {
          set({ tokenAmount: '' });
        }
      },
      
      setTokenAmount: (amount) => set({ tokenAmount: amount }),
      setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
      
      addPurchase: (purchase) => {
        set((state) => {
          const newPurchases = [...state.purchases, purchase];
          const walletData = { ...state.walletData };
          const normalizedAddress = purchase.walletAddress.toLowerCase();
          if (!walletData[normalizedAddress]) {
            walletData[normalizedAddress] = {
              address: normalizedAddress,
              totalPurchased: 0,
              totalTokens: 0,
              purchases: [],
              lastConnected: Date.now(),
            };
          }
          walletData[normalizedAddress].totalPurchased += purchase.amountUSD;
          walletData[normalizedAddress].totalTokens += purchase.tokens;
          walletData[normalizedAddress].purchases.push(purchase);
          walletData[normalizedAddress].lastConnected = Date.now();
          
          const stageRaised = [...state.stageRaised];
          stageRaised[purchase.stage - 1] = (stageRaised[purchase.stage - 1] || 0) + purchase.amountUSD;
          
          const currentStageConfig = PRESALE_CONFIG.STAGES[purchase.stage - 1];
          let currentStage = state.currentStage;
          if (stageRaised[purchase.stage - 1] >= currentStageConfig.target && currentStage < PRESALE_CONFIG.TOTAL_STAGES) {
            currentStage += 1;
          }
          
          return {
            purchases: newPurchases,
            walletData,
            stageRaised,
            totalRaised: state.totalRaised + purchase.amountUSD,
            currentStage,
          };
        });
      },
      
      getWalletPurchases: (address) => {
        const state = get();
        const normalizedAddress = address.toLowerCase();
        return state.walletData[normalizedAddress] || null;
      },
      
      getTotalTokensForWallet: (address) => {
        const state = get();
        const normalizedAddress = address.toLowerCase();
        return state.walletData[normalizedAddress]?.totalTokens || 0;
      },
      
      getCurrentStageProgress: () => {
        const state = get();
        const stageIndex = state.currentStage - 1;
        const stage = PRESALE_CONFIG.STAGES[stageIndex];
        const raised = state.stageRaised[stageIndex] || 0;
        return Math.min((raised / stage.target) * 100, 100);
      },
      
      getStageData: (stage) => {
        const state = get();
        const stageIndex = stage - 1;
        const stageConfig = PRESALE_CONFIG.STAGES[stageIndex];
        const raised = state.stageRaised[stageIndex] || 0;
        return {
          progress: Math.min((raised / stageConfig.target) * 100, 100),
          raised,
          target: stageConfig.target,
          remaining: Math.max(stageConfig.target - raised, 0),
        };
      },
      
      reset: () => set({ ethAmount: '', usdAmount: '', tokenAmount: '' }),
    }),
    {
      name: 'kaleo-presale-storage',
      partialize: (state) => ({
        purchases: state.purchases,
        walletData: state.walletData,
        stageRaised: state.stageRaised,
        totalRaised: state.totalRaised,
        currentStage: state.currentStage,
      }),
    }
  )
);
