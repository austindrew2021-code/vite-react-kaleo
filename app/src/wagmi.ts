import {
  connectorsForWallets,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  trustWallet,
  phantomWallet,
  okxWallet,
  backpackWallet,
  bitgetWallet,
  safepalWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { sepolia, bscTestnet, polygon, arbitrum, base, arbitrumSepolia, baseSepolia, polygonAmoy } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '69b686259ac98fa35d4188e56796ca47';

const { wallets } = getDefaultWallets({ appName: 'Kaleo', projectId });

const connectors = connectorsForWallets(
  [
    ...wallets,
    {
      groupName: 'Recommended',
      wallets: [
        phantomWallet,
        okxWallet,
        backpackWallet,
        bitgetWallet,
        safepalWallet,
        trustWallet,
        coinbaseWallet,
      ],
    },
  ],
  { appName: 'Kaleo Presale', projectId }
);

export const config = createConfig({
  connectors,
  // BSC first — default chain for WalletConnect sessions
  chains: [bscTestnet, sepolia, arbitrumSepolia, baseSepolia, polygonAmoy, polygon, arbitrum, base],
  // ⚠️ For mainnet launch: change to [bsc, mainnet, polygon, arbitrum, base]
  transports: {
    [bscTestnet.id]: http('https://bsc-testnet-rpc.publicnode.com'),
    [sepolia.id]:    http('https://ethereum-sepolia-rpc.publicnode.com'),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    [baseSepolia.id]:     http('https://sepolia.base.org'),
    [polygonAmoy.id]:     http('https://rpc-amoy.polygon.technology'),
    // Mainnet (kept in config for switching — only used if user selects mainnet chain)
    [polygon.id]:    http('https://polygon-rpc.com'),
    [arbitrum.id]:   http('https://arb1.arbitrum.io/rpc'),
    [base.id]:       http('https://mainnet.base.org'),
  },
  ssr: false,
});

// Export chain references used in BuySection
export { sepolia, bscTestnet, arbitrumSepolia, baseSepolia, polygonAmoy };
