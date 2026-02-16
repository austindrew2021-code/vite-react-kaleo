import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes intelligently.
 * - Combines multiple class strings/objects/arrays
 * - Resolves conflicts (last class wins)
 * - Handles conditional classes cleanly
 * 
 * Usage examples:
 * cn("p-4", "bg-blue-500", isActive && "ring-2 ring-blue-300")
 * cn("text-lg", { "font-bold": isBold, "italic": isItalic })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format ETH amount with proper decimals and symbol
 * - Always shows at least 4 decimals for small amounts
 * - Uses compact notation for large numbers
 */
export function formatEth(value: number | string, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0 ETH';

  if (num < 0.0001) {
    return num.toFixed(8) + ' ETH';
  }
  if (num < 1) {
    return num.toFixed(decimals) + ' ETH';
  }
  if (num >= 1000) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ETH';
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ETH';
}

/**
 * Format token amount (KLEO) – removes trailing zeros
 */
export function formatToken(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0 KLEO';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals }) + ' KLEO';
}

/**
 * Truncate Ethereum address for display
 * Example: 0x1234...abcd
 */
export function shortenAddress(address: string | undefined | null, chars = 4): string {
  if (!address) return '0x...';
  if (address.length <= chars * 2 + 2) return address;
  return `\( {address.slice(0, chars + 2)}... \){address.slice(-chars)}`;
}

/**
 * Detect if running on mobile device (for UI decisions)
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Sleep utility – useful for testing delays or rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format percentage with sign and color class
 * Returns object for easy use in JSX
 */
export function formatPercentage(value: number): {
  text: string;
  colorClass: string;
  icon: 'up' | 'down' | 'same';
} {
  const abs = Math.abs(value);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const text = `\( {sign} \){abs.toFixed(2)}%`;

  let colorClass = 'text-gray-400';
  let icon: 'up' | 'down' | 'same' = 'same';

  if (value > 0) {
    colorClass = 'text-green-400';
    icon = 'up';
  } else if (value < 0) {
    colorClass = 'text-red-400';
    icon = 'down';
  }

  return { text, colorClass, icon };
}
