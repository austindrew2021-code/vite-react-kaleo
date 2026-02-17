import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

// WalletConnect Project ID (use your own in .env!)
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// Fallback if missing (for local dev only – never use in production!)
if (!projectId) {
  console.warn(
    '[wagmi] Missing VITE_WALLET_CONNECT_PROJECT_ID in .env – using fallback ID. ' +
    'Get a real project ID at https://cloud.walletconnect.com'
  );
}

const FALLBACK_PROJECT_ID = '69b686259ac98fa35d4188e56796ca47';
const effectiveProjectId = projectId || FALLBACK_PROJECT_ID;

// Multiple public Sepolia RPCs for reliability (automatic fallback)
const SEPOLIA_RPC_URLS = [
  import.meta.env.VITE_SEPOLIA_RPC_URL || '',
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Infura public (limited)
  'https://sepolia.rpc.thirdweb.com',
].filter(Boolean); // remove empty strings

export const SEPOLIA_CHAIN_ID = sepolia.id;

// Optional debug logs (uncomment in development if needed)
// console.log('[wagmi] Using WalletConnect Project ID:', effectiveProjectId);
// console.log('[wagmi] Sepolia RPC URLs:', SEPOLIA_RPC_URLS);

export const config = getDefaultConfig({
  appName: 'Kaleo - Memecoin Leverage Platform',
  projectId: effectiveProjectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URLS[0]), // Primary RPC – others can be added via fallback if needed
  },
  ssr: false,
});
