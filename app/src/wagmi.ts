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
import { mainnet, bsc } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '69b686259ac98fa35d4188e56796ca47';

// ── Wallets shown in RainbowKit modal ────────────────────────────────────
const { wallets } = getDefaultWallets({ appName: 'Kaleo', projectId });

const connectors = connectorsForWallets(
  [
    ...wallets,
    {
      groupName: 'Recommended',
      wallets: [
        phantomWallet,       // Phantom (EVM + triggers window.phantom.solana)
        okxWallet,           // OKX (multi-chain)
        backpackWallet,      // Backpack (Solana-first)
        bitgetWallet,        // Bitget
        safepalWallet,       // SafePal
        trustWallet,
        coinbaseWallet,
      ],
    },
  ],
  { appName: 'Kaleo Presale', projectId }
);

export const config = createConfig({
  connectors,
  chains: [mainnet, bsc],
  transports: {
    [mainnet.id]: http('https://ethereum-rpc.publicnode.com'),
    [bsc.id]:     http('https://bsc-rpc.publicnode.com'),
  },
  ssr: false,
});
