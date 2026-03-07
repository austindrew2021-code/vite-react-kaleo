import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  injectedWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
  rainbowWallet,
  safeWallet,
  braveWallet,
  zerionWallet,
  rabbyWallet,
  oneInchWallet,
  uniswapWallet,
  oneKeyWallet,
  ledgerWallet,
  frameWallet,
  phantomWallet,
  okxWallet,
  bitgetWallet,
  safepalWallet,
  bybitWallet,
  binanceWallet,
  gateWallet,
  krakenWallet,
  tokenPocketWallet,
  imTokenWallet,
  frontierWallet,
  coin98Wallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http, fallback } from 'wagmi';
import {
  sepolia, bscTestnet,
  arbitrumSepolia, baseSepolia, polygonAmoy,
  polygon, arbitrum, base, mainnet,
} from 'wagmi/chains';

// ── Pre-flight: clear wagmi reconnect storage in SOL/BTC wallet browsers ──
// wagmi v2 stores session state under keys starting with "wagmi" and reads
// them synchronously on createConfig(). In Phantom/Xverse/Unisat browsers we
// want ONLY the native chain (SOL or BTC) to connect — if wagmi reconnects
// its own cached EVM session first, we end up with dual connections that our
// dropEvmConnection() calls (in BuySection mount) arrive too late to prevent.
// Clearing before createConfig() means wagmi starts with a blank slate in those
// browsers and never triggers a reconnect on its own.
(function clearWagmiInSolBtcBrowsers() {
  try {
    const eth = (window as any).ethereum;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isPhantomBrowser = !!(window as any).phantom?.solana && isMobile;
    const isXverseBrowser  = !!(window as any).XverseProviders?.BitcoinProvider && !eth;
    const isUnisatBrowser  = !!(window as any).unisat && !eth;
    if (isPhantomBrowser || isXverseBrowser || isUnisatBrowser) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('wagmi'))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {}
})();


const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '69b686259ac98fa35d4188e56796ca47';
const APP_NAME  = 'Xenia Presale';
const APP_ICON  = 'https://xenia-presale.vercel.app/logo.png';
const APP_URL   = 'https://xenia-presale.vercel.app';

// ── Wallet compatibility ───────────────────────────────────────────────────
// magicEdenWallet + backpackWallet REMOVED — Solana-native wallets that inject
// aggressively via EIP-6963, creating ghost connections alongside MetaMask.
// This caused the "two disconnects" bug (Magic Eden first, then MetaMask).
// BSC support:  Trust, Binance, OKX, Bitget, Bybit, Gate, TokenPocket, imToken, SafePal, Coin98, 1inch, Frontier
// No BSC:       Rainbow, Kraken, Zerion, Phantom-EVM, Uniswap, Coinbase-EOA
// All EVM:      MetaMask, OKX, Rabby, OneKey, Frame (via wallet_addEthereumChain)
// Coinbase Smart Wallet (default) BREAKS switchChain on non-Base — use EOA mode.
// Ledger ERC-20: requires Blind Signing enabled in Ledger Live settings.

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        trustWallet,
        rainbowWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
    {
      groupName: 'DeFi',
      wallets: [
        rabbyWallet,
        zerionWallet,
        oneInchWallet,
        uniswapWallet,
        frameWallet,
        oneKeyWallet,
        ledgerWallet,
        safeWallet,
        braveWallet,
      ],
    },
    {
      groupName: 'Multi-Chain',
      wallets: [
        okxWallet,
        bitgetWallet,
        phantomWallet,
        safepalWallet,
      ],
    },
    {
      groupName: 'Exchange Wallets',
      wallets: [binanceWallet, bybitWallet, gateWallet, krakenWallet, coin98Wallet],
    },
    {
      groupName: 'Mobile',
      wallets: [tokenPocketWallet, imTokenWallet, frontierWallet],
    },
  ],
  {
    appName:        APP_NAME,
    projectId,
    appIcon:        APP_ICON,
    appDescription: 'Xenia Token Presale — buy XEN at the earliest stage price',
    appUrl:         APP_URL,
  }
);

// Chain order = default WalletConnect chain on first connect.
// Chain order = default WalletConnect chain on first connect.
export const config = createConfig({
  connectors,
  chains: [
    bscTestnet,      // 97      default WC chain
    sepolia,         // 11155111
    arbitrumSepolia, // 421614
    baseSepolia,     // 84532
    polygonAmoy,     // 80002
    mainnet,         // 1       fallback for wallets on mainnet
    polygon,         // 137
    arbitrum,        // 42161
    base,            // 8453
  ],
  transports: {
    [bscTestnet.id]:      fallback([
      http('https://bsc-testnet-rpc.publicnode.com'),
      http('https://bsc-testnet.public.blastapi.io'),
      http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    ]),
    [sepolia.id]:         fallback([
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://sepolia.gateway.tenderly.co'),
      http('https://rpc.sepolia.org'),
    ]),
    [arbitrumSepolia.id]: fallback([
      http('https://sepolia-rollup.arbitrum.io/rpc'),
      http('https://arbitrum-sepolia.public.blastapi.io'),
    ]),
    [baseSepolia.id]:     fallback([
      http('https://sepolia.base.org'),
      http('https://base-sepolia.public.blastapi.io'),
    ]),
    [polygonAmoy.id]:     fallback([
      http('https://rpc-amoy.polygon.technology'),
      http('https://polygon-amoy.public.blastapi.io'),
    ]),
    [mainnet.id]:  fallback([
      http('https://eth.llamarpc.com'),
      http('https://ethereum.publicnode.com'),
      http('https://rpc.ankr.com/eth'),
    ]),
    [polygon.id]:  fallback([
      http('https://polygon-rpc.com'),
      http('https://polygon.llamarpc.com'),
    ]),
    [arbitrum.id]: fallback([
      http('https://arb1.arbitrum.io/rpc'),
      http('https://arbitrum.llamarpc.com'),
    ]),
    [base.id]:     fallback([
      http('https://mainnet.base.org'),
      http('https://base.llamarpc.com'),
    ]),
  },
  multiInjectedProviderDiscovery: true,
  ssr: false,
  pollingInterval: 12_000,  // poll every 12s (vs default 4s) — reduces RPC calls by 3x
});

export { sepolia, bscTestnet, arbitrumSepolia, baseSepolia, polygonAmoy };
