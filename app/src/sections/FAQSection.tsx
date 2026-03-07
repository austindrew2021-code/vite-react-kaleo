import { useEffect } from 'react';
import { gsap } from 'gsap';
import { HelpCircle, ArrowRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqCategories = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Xenia?',
        a: 'Xenia is a decentralized leverage trading platform built specifically for memecoins on Solana. It integrates directly with Pump.fun to let you trade any memecoin with up to 100x leverage. All trading fees are pooled into weekly trading contests, making Xenia the first community-rewarding leverage platform in the memecoin space.',
      },
      {
        q: 'What blockchain does Xenia use?',
        a: 'Xenia launches natively on Solana via Pump.fun, chosen for its ultra-low fees, sub-second finality, and the largest memecoin ecosystem in crypto. The XEN token will be listed on Solana DEXs at launch, with cross-chain expansion planned in later phases.',
      },
      {
        q: 'Is Xenia safe to use?',
        a: 'Security is our top priority. Smart contracts will undergo a full third-party audit before the platform goes live. All protocol funds are managed by a multi-signature wallet, and an insurance fund (5% of all trading fees) protects against extreme market events. Core contracts will be open-sourced for community review.',
      },
    ],
  },
  {
    category: 'Presale & Token',
    questions: [
      {
        q: 'How does the presale work?',
        a: 'The presale runs across 12 stages with prices increasing at each stage. Stage 1 starts at $0.0010/XEN (98% discount vs listing at $0.05) and Stage 12 ends at $0.0200/XEN. Each stage has a fixed USD target and token allocation. When a stage fills, the price moves automatically to the next. All purchases use real funds — SOL, ETH, BNB, BTC, USDC, USDT, or card.',
      },
      {
        q: 'What is the XEN token used for?',
        a: 'XEN is the native utility token of the Xenia ecosystem. It provides governance voting rights, fee discount tiers for leverage trading, staking rewards, access to exclusive platform features, and entry into premium weekly trading contests with larger prize pools.',
      },
      {
        q: 'What are the tokenomics?',
        a: 'Total supply is 1,000,000,000 XEN. Allocation: 22.45% Presale, 20% Liquidity & Market Making, 15% Ecosystem & Rewards, 15% Community Airdrops, 10% Team & Advisors (vested over 24 months with 6-month cliff). Listing price will be $0.05/XEN on Solana DEXs.',
      },
      {
        q: 'Is there a vesting period for team tokens?',
        a: 'Yes, team and advisor tokens (10% of supply) are fully locked for 6 months after launch, then vest linearly over 24 months. This ensures the team is committed to long-term project success and prevents early sell pressure.',
      },
      {
        q: 'When will XEN be listed?',
        a: 'The token launch date is TBA. Our focus right now is completing the presale and securing the funds needed to build and launch properly. Once the presale is complete and the platform is ready, we will announce the exact launch date across all our channels. Buy during the presale to lock in your allocation before the listing price of $0.05/XEN.',
      },
    ],
  },
  {
    category: 'Trading & Platform',
    questions: [
      {
        q: 'How does leverage trading work on Xenia?',
        a: 'Xenia uses a peer-to-pool model. You deposit collateral (XEN or SOL), select your desired leverage (up to 100x), and open a long or short position on any Pump.fun memecoin. The platform uses isolated margin, meaning each position has its own margin and liquidation price, limiting your maximum loss to the collateral for that specific trade.',
      },
      {
        q: 'What is liquidation protection?',
        a: 'Unlike most platforms that liquidate your entire position at once, Xenia implements tiered liquidation. When your margin ratio drops below 10%, the engine closes 25% of your position at a time. This gives you multiple chances to add margin or for the market to recover, significantly reducing the chance of total loss.',
      },
      {
        q: 'How do the weekly trading contests work?',
        a: '100% of all trading fees (opening, closing, liquidation) are pooled weekly. Every Monday–Sunday UTC cycle, traders are ranked by realized PnL percentage. The top 50 traders split the entire fee pool: 1st place gets 20%, 2nd gets 12%, 3rd gets 8%, and places 4–50 share the remaining 60%. Everyone has an equal chance regardless of account size.',
      },
      {
        q: 'What order types are supported?',
        a: 'At launch, Xenia will support market orders, limit orders, stop-loss, and take-profit. Advanced features like trailing stops, OCO (one-cancels-other), and conditional orders are planned for later phases.',
      },
    ],
  },
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I buy XEN in the presale?',
        a: 'Connect any supported wallet (Phantom for SOL, MetaMask or Trust Wallet for ETH/BNB, Xverse for BTC, or any EVM-compatible wallet), enter the amount you want to invest, and confirm the transaction. You can also pay by card via Stripe. Your XEN tokens are recorded immediately and delivered to your wallet at mainnet launch.',
      },
      {
        q: 'Which wallets are supported?',
        a: 'For SOL: Phantom, Solflare, Backpack, OKX, and more. For ETH/BNB/USDC/USDT: MetaMask, Coinbase Wallet, Trust Wallet, OKX, Rabby, and 20+ others via WalletConnect. For BTC: Phantom, Xverse, OKX, and Unisat. You can also pay by card without any wallet.',
      },
      {
        q: 'What happens to my tokens after the presale?',
        a: 'Your purchase is recorded against your wallet address. Once the presale goal is reached and XEN launches on Solana, tokens are distributed directly to the wallet address you connected during purchase. Card buyers receive an email receipt and can track their allocation on this page at any time.',
      },
      {
        q: 'Is there a minimum purchase?',
        a: 'The minimum purchase is $10 USD equivalent for all payment methods. There is no maximum. Prices only increase as stages fill, so earlier participants always get the best rates.',
      },
    ],
  },
];

export function FAQSection() {
  useEffect(() => {
    gsap.fromTo('.faq-category',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.faq-container',
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      }
    );
    gsap.fromTo('.faq-item',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.faq-container',
          start: 'top 80%',
          toggleActions: 'play none none none',
        }
      }
    );
  }, []);

  return (
    <section id="faq" className="fade-in-section relative py-20 bg-gradient-to-b from-black to-gray-900 overflow-hidden">
      <div className="faq-container max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-sm font-medium uppercase tracking-widest mb-4">
            <HelpCircle className="w-4 h-4" />
            Support Center
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-[#F4F6FA] mb-4">
            Frequently Asked <span className="text-[#2BFFF1]">Questions</span>
          </h2>
          <p className="text-[#A7B0B7] text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Xenia, the presale, and how to get started.
          </p>
        </div>

        <div className="space-y-16">
          {faqCategories.map((cat, catIdx) => (
            <div key={catIdx} className="faq-category">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#2BFFF1]" />
                </div>
                <h3 className="text-2xl font-bold text-[#F4F6FA]">{cat.category}</h3>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {cat.questions.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${catIdx}-${idx}`}
                    className="faq-item glass-card rounded-xl overflow-hidden border border-white/[0.08] data-[state=open]:border-[#2BFFF1]/30 transition-all duration-300 hover:border-[#2BFFF1]/20"
                  >
                    <AccordionTrigger className="px-6 py-5 text-left text-[#F4F6FA] hover:text-[#2BFFF1] transition-colors font-medium text-base [&[data-state=open]]:text-[#2BFFF1]">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 text-[#A7B0B7] text-base leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 glass-card rounded-2xl p-8 md:p-10 text-center border border-cyan-500/20">
          <h3 className="text-2xl font-bold text-[#F4F6FA] mb-3">Still have questions?</h3>
          <p className="text-[#A7B0B7] text-base mb-6 max-w-xl mx-auto">
            Our team and community are ready to help. Join our channels for real-time support and updates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="neon-button px-6 py-3 text-base font-semibold flex items-center gap-2 hover:gap-3">
              Join Discord
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#" className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[#A7B0B7] text-base font-medium hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors flex items-center gap-2">
              Telegram Group
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
