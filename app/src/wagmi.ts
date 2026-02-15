import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '69b686259ac98fa35d4188e56796ca47';

export const SEPOLIA_CHAIN_ID = 11155111;

export const config = getDefaultConfig({
  appName: 'Kaleo - Memecoin Leverage Platform',
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  },
  ssr: false,
});
