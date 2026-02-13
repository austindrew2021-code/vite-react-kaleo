import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
} from 'wagmi/chains';
import { http } from 'wagmi';
import WalletConnectConnector from '@walletconnect/ethereum-provider'; // correct default import
import { injected } from '@wagmi/connectors';

// Debug logs - remove after modal works
console.log('WalletConnect Project ID loaded:', import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'MISSING');
console.log('RPC URL loaded:', import.meta.env.VITE_RPC_URL || 'MISSING');
console.log('VITE env vars present:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

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
  // No explicit 'connectors' array needed here - RainbowKit v2 auto-configures WalletConnect + injected when projectId is provided
  ssr: false,
});

// Optional extra debug
console.log('Wagmi config created with projectId:', projectId);
