import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEth(value: number | string, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0 ETH';

  if (num < 0.0001) return num.toFixed(8) + ' ETH';
  if (num < 1) return num.toFixed(decimals) + ' ETH';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ETH';
}

export function formatToken(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0 KLEO';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals }) + ' KLEO';
}

export function shortenAddress(address: string | undefined | null, chars = 4): string {
  if (!address) return '0x...';
  if (address.length <= chars * 2 + 2) return address;
  return `\( {address.slice(0, chars + 2)}... \){address.slice(-chars)}`;
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function formatPercentage(value: number): {
  text: string;
  colorClass: string;
  icon: 'up' | 'down' | 'same';
} {
  const absValue = Math.abs(value);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const text = `\( {sign} \){absValue.toFixed(2)}%`;

  if (value > 0) {
    return { text, colorClass: 'text-green-400', icon: 'up' };
  }
  if (value < 0) {
    return { text, colorClass: 'text-red-400', icon: 'down' };
  }
  return { text, colorClass: 'text-gray-400', icon: 'same' };
}
