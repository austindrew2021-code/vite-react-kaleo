import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'; // shadcn/ui dialog

export function WhitePaperSection() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-full transition">
          View Whitepaper
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-cyan-400 mb-6">
            Kaleo Whitepaper
          </DialogTitle>
        </DialogHeader>

        <div className="prose prose-invert prose-cyan max-w-none space-y-6">
          {/* Paste your full whitepaper markdown/text here */}
          <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
          <p>Kaleo is a next-generation memecoin leverage platform built on Polygon...</p>

          <h2 className="text-2xl font-semibold mt-8">2. Tokenomics</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Total Supply: 1,000,000,000 KLEO</li>
            <li>Presale Allocation: 40%</li>
            <li>Liquidity & Marketing: 20%</li>
            {/* ... add the rest */}
          </ul>

          <h2 className="text-2xl font-semibold mt-8">3. Roadmap</h2>
          {/* ... add roadmap content */}

          {/* Add more sections as needed */}
          <p className="text-sm text-gray-400 mt-12">
            © 2026 Kaleo Team. All rights reserved.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
