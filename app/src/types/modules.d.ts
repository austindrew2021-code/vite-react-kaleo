// Type declarations for missing modules

declare module 'wagmi' {
  export interface Account {
    address: string | undefined;
    isConnected: boolean;
  }
  export function useAccount(): Account;
  export function useBalance(config: { address?: string }): { 
    data?: { formatted: string; value: bigint }; 
  };
  export interface SendTransactionConfig {
    to: string;
    value: bigint;
  }
  export interface SendTransactionResult {
    sendTransaction: (config: SendTransactionConfig, options?: any) => void;
    isPending: boolean;
    isSuccess?: boolean;
    isError?: boolean;
    error?: Error | null;
  }
  export function useSendTransaction(): SendTransactionResult;
  export function WagmiProvider(props: { config: any; children: React.ReactNode }): JSX.Element;
  export function http(url?: string): any;
}

declare module 'wagmi/chains' {
  export const mainnet: any;
  export const base: any;
  export const arbitrum: any;
  export const optimism: any;
  export const polygon: any;
}

declare module 'viem' {
  export function parseEther(value: string): bigint;
  export function formatEther(value: bigint): string;
}

declare module '@rainbow-me/rainbowkit' {
  export function ConnectButton(props: any): JSX.Element;
  export function RainbowKitProvider(props: { theme?: any; children: React.ReactNode }): JSX.Element;
  export function getDefaultConfig(config: any): any;
  export interface ConnectModal {
    openConnectModal?: () => void;
  }
  export function useConnectModal(): ConnectModal;
  export function darkTheme(theme: any): any;
}

declare module '@tanstack/react-query' {
  export class QueryClient {
    constructor();
  }
  export function QueryClientProvider(props: { client: QueryClient; children: React.ReactNode }): JSX.Element;
}

declare module 'gsap' {
  export interface Timeline {
    fromTo(target: any, fromVars: any, toVars: any, position?: number | string): Timeline;
    to(target: any, vars: any, position?: number | string): Timeline;
  }
  export function registerPlugin(...plugins: any[]): void;
  export function timeline(vars?: any): Timeline;
  export function fromTo(target: any, fromVars: any, toVars: any): any;
  export function set(target: any, vars: any): void;
  export function to(target: any, vars: any): any;
  export interface Context {
    revert: () => void;
  }
  export function context(fn: () => void, scope?: any): Context;
  const gsap: {
    registerPlugin: typeof registerPlugin;
    timeline: typeof timeline;
    fromTo: typeof fromTo;
    set: typeof set;
    to: typeof to;
    context: typeof context;
  };
  export default gsap;
}

declare module 'gsap/ScrollTrigger' {
  export interface ScrollTriggerStatic {
    create(vars: any): ScrollTriggerInstance;
    getAll(): ScrollTriggerInstance[];
    maxScroll(element: any): number;
  }
  export interface ScrollTriggerInstance {
    vars: { pin?: boolean };
    start: number;
    end?: number;
    kill(): void;
  }
  export const ScrollTrigger: ScrollTriggerStatic;
  export default ScrollTrigger;
}

declare module 'zustand' {
  export type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  export type GetState<T> = () => T;
  export type StoreApi<T> = {
    setState: SetState<T>;
    getState: GetState<T>;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  };
  export function create<T>(initializer: (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T): () => T;
}

declare module 'zustand/middleware' {
  export function persist<T, U = T>(config: { name: string; partialize?: (state: T) => U }): 
    (initializer: (set: any, get: any, api: any) => T) => (set: any, get: any, api: any) => T;
}

declare module 'sonner' {
  export interface ToasterProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    toastOptions?: any;
    theme?: string;
    className?: string;
    icons?: any;
    style?: React.CSSProperties;
  }
  export function Toaster(props: ToasterProps): JSX.Element;
  export interface Toast {
    success(message: string): void;
    error(message: string): void;
  }
  export const toast: {
    (message: string): void;
    success(message: string): void;
    error(message: string): void;
  };
}
