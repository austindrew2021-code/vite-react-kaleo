import { create } from 'zustand';

interface PresaleState {
  ethAmount: string;
  tokenAmount: string;
  setEthAmount: (amount: string) => void;
  setTokenAmount: (amount: string) => void;
  reset: () => void;
}

export const usePresaleStore = create<PresaleState>((set) => ({
  ethAmount: '',
  tokenAmount: '',
  setEthAmount: (amount) => set({ ethAmount: amount }),
  setTokenAmount: (amount) => set({ tokenAmount: amount }),
  reset: () => set({ ethAmount: '', tokenAmount: '' }),
}));
