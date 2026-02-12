import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
} from 'wagmi/chains';
import { http } from 'wagmi';
import { WalletConnectConnector } from '@walletconnect/ethereum-provider';
import { injected } from '@wagmi/connectors';

// Debug logs – remove after testing
console.log('WalletConnect Project ID:', import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID);
console.log('RPC URL:', import.meta.env.VITE_RPC_URL);

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '69b686259ac98fa35d4188e56796ca47'; // fallback only for local testing

export const config = getDefaultConfig({
  appName: 'Kaleo - Memecoin Leverage Platform',
  projectId,
  chains: [polygon, mainnet, base, arbitrum, optimism],
  transports: {
    [polygon.id]: http(import.meta.env.VITE_RPC_URL || 'https://polygon-rpc.com'),
    [mainnet.id]: http(import.meta.env.VITE_RPC_URL || 'https://ethereum.publicnode.com'),
    [base.id]: http('https://mainnet.base.org'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io'),
  },
  connectors: [
    new WalletConnectConnector({
      options: {
        projectId,
        showQrModal: true,
      },
    }),
    injected(),
  ],
  ssr: false,
});
