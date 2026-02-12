import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
} from 'wagmi/chains';
import { http } from 'wagmi';

const alchemyKey = import.meta.env.VITE_ALCHEMY_KEY;
const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// Debug log - remove after testing
console.log('WalletConnect Project ID from env:', walletConnectProjectId);
console.log('RPC URL from env:', import.meta.env.VITE_RPC_URL);

export const config = getDefaultConfig({
  appName: 'Kaleo - Memecoin Leverage Platform',
  projectId: walletConnectProjectId || '69b686259ac98fa35d4188e56796ca47', // fallback only for local testing
  chains: [mainnet, base, arbitrum, optimism, polygon],
  transports: {
    [mainnet.id]: http(alchemyKey || 'https://eth-mainnet.g.alchemy.com/v2/7iiXgQQtGUhyi7a-fC0Sd'),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
  },
  ssr: false,
});
