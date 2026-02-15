import { useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function WhitePaperSection() {
  useEffect(() => {
    // Quick fade-in animation when modal opens (triggered by Dialog open state)
    const modal = document.querySelector('[data-radix-dialog-content]');
    if (modal) {
      gsap.fromTo(modal,
        { opacity: 0, scale: 0.95, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []); // Runs once on mount; can be improved with open state if using controlled Dialog

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105">
          View Whitepaper
        </button>
      </DialogTrigger>

      <DialogContent className="fade-in-section w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-950 to-black border border-cyan-500/30 text-white rounded-2xl shadow-2xl shadow-cyan-900/30 backdrop-blur-md mx-4 sm:mx-auto">
        <DialogHeader className="sticky top-0 bg-gradient-to-b from-black to-transparent pb-6 pt-8 z-10">
          <DialogTitle className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-500 bg-clip-text text-transparent">
            Kaleo Whitepaper
          </DialogTitle>
        </DialogHeader>

        <div className="prose prose-invert prose-cyan max-w-none space-y-8 px-6 pb-12">
          {/* 1. Introduction */}
          <h2 className="text-3xl font-bold text-cyan-300 mt-12 border-b border-cyan-500/30 pb-4">
            1. Introduction
          </h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Kaleo is a next-generation memecoin leverage platform built on Polygon, designed to empower traders with up to 100x leverage on Pump.fun tokens while maintaining strong risk controls and liquidation protection.
          </p>

          {/* 2. Tokenomics */}
          <h2 className="text-3xl font-bold text-cyan-300 mt-16 border-b border-cyan-500/30 pb-4">
            2. Tokenomics
          </h2>
          <ul className="list-disc pl-8 space-y-4 text-gray-300 text-lg">
            <li><strong>Total Supply:</strong> 1,000,000,000 KLEO</li>
            <li><strong>Presale Allocation:</strong> 40% (400M tokens)</li>
            <li><strong>Liquidity & Marketing:</strong> 20%</li>
            <li><strong>Team & Advisors:</strong> 10% (vested 24 months)</li>
            <li><strong>Ecosystem & Rewards:</strong> 15%</li>
            <li><strong>Community Airdrops:</strong> 15%</li>
          </ul>

          {/* 3. Roadmap */}
          <h2 className="text-3xl font-bold text-cyan-300 mt-16 border-b border-cyan-500/30 pb-4">
            3. Roadmap
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="p-6 bg-gray-900/50 rounded-xl border border-cyan-500/20">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Q1 2026 – Launch</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Presale & Token Generation</li>
                <li>DEX Listing</li>
                <li>Initial Community Marketing</li>
              </ul>
            </div>
            <div className="p-6 bg-gray-900/50 rounded-xl border border-cyan-500/20">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Q2 2026 – Platform</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                <li>Leverage Dashboard</li>
                <li>Advanced Orders</li>
                <li>Mobile App Beta</li>
              </ul>
            </div>
            {/* Add more phases as needed */}
          </div>

          {/* Closing */}
          <p className="text-sm text-gray-500 mt-16 text-center italic">
            © 2026 Kaleo Team. All rights reserved. This document is for informational purposes only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
