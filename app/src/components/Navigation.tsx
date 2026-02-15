import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'; // shadcn/ui Dialog component

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-5 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-cyan-500/20">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <span className="text-black font-black text-2xl tracking-tighter">K</span>
        </div>
        <span className="text-white font-bold text-2xl tracking-tight">Kaleo</span>
      </div>

      {/* Nav Links - Hidden on mobile, centered on desktop */}
      <div className="hidden md:flex items-center gap-10">
        <a
          href="#buy"
          className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-base"
        >
          Buy
        </a>

        <a
          href="#staking"
          className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-base"
        >
          Staking
        </a>

        {/* Whitepaper Modal Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-gray-300 hover:text-cyan-400 transition-colors font-medium text-base">
              Whitepaper
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-950 to-black border border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-8">
                Kaleo Whitepaper
              </DialogTitle>
            </DialogHeader>

            <div className="prose prose-invert prose-cyan max-w-none space-y-8 text-gray-200 leading-relaxed">
              {/* Paste or import your full whitepaper content here */}
              <h2 className="text-3xl font-semibold text-cyan-300 mt-12">1. Executive Summary</h2>
              <p>
                Kaleo is a decentralized leverage trading platform for memecoins on Polygon, offering up to 100x leverage with advanced risk controls...
              </p>

              <h2 className="text-3xl font-semibold text-cyan-300 mt-12">2. Tokenomics</h2>
              <ul className="list-disc pl-8 space-y-3">
                <li>Total Supply: 1,000,000,000 KLEO</li>
                <li>Presale: 40% (400M tokens)</li>
                <li>Liquidity & Marketing: 20%</li>
                <li>Team & Advisors: 10% (vested 24 months)</li>
                <li>Ecosystem & Rewards: 15%</li>
                <li>Community Airdrops: 15%</li>
              </ul>

              <h2 className="text-3xl font-semibold text-cyan-300 mt-12">3. Roadmap</h2>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 bg-gray-900/50 rounded-xl border border-cyan-500/20">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">Q1 2026 – Launch</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Presale & Token Generation</li>
                    <li>DEX Listing</li>
                    <li>Initial Community Marketing</li>
                  </ul>
                </div>
                <div className="p-6 bg-gray-900/50 rounded-xl border border-cyan-500/20">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">Q2 2026 – Platform</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Leverage Dashboard</li>
                    <li>Advanced Orders</li>
                    <li>Mobile App Beta</li>
                  </ul>
                </div>
                {/* Add more phases */}
              </div>

              <p className="text-sm text-gray-500 mt-16 text-center">
                © 2026 Kaleo Team. All rights reserved. This document is for informational purposes only.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connect Wallet Button */}
      <ConnectButton
        label="Connect Wallet"
        showBalance={false}
        chainStatus="none"
        accountStatus="address"
      />
    </nav>
  );
}
