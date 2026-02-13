import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
} from 'wagmi/chains';
import { http } from 'wagmi';
import { createWalletConnectConnector } from '@walletconnect/ethereum-provider'; // correct import for v2
import { injected } from '@wagmi/connectors';

// Debug logs - remove after confirming modal works
console.log('WalletConnect Project ID loaded:', import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'MISSING');
console.log('RPC URL loaded:', import.meta.env.VITE_RPC_URL || 'MISSING');
console.log('All VITE env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '69b686259ac98fa35d4188e56796ca47';

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
  // Connectors are configured automatically by RainbowKit in v2 when projectId is provided
  // Explicit connectors are optional - the above should suffice for WalletConnect + injected
  ssr: false,
});

// Optional: Log config for debugging
console.log('Wagmi config initialized with projectId:', projectId);
