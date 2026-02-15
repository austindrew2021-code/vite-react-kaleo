import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
} from 'wagmi/chains';
import { http } from 'wagmi';

// Debug logs – keep these for now to verify env vars in console
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
  ssr: false,
});

// Optional extra debug – confirms config is created
console.log('Wagmi config created with projectId:', projectId);

// Optional: Log available chains (useful for debugging chain switching later)
console.log('Available chains:', config.chains.map(c => `${c.name} (ID: ${c.id})`));
