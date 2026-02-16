import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

gsap.registerPlugin(ScrollTrigger);

const faqCategories = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Kaleo?',
        a: 'Kaleo is a decentralized leverage trading platform built specifically for memecoins. It integrates directly with Pump.fun to let you trade any memecoin with up to 100x leverage. All trading fees are pooled into weekly trading contests, making Kaleo the first community-rewarding leverage platform in the memecoin space.',
      },
      {
        q: 'What blockchain does Kaleo use?',
        a: 'Kaleo is currently in its testnet phase on Ethereum Sepolia. The mainnet launch will be on Polygon for low gas fees and fast transaction finality. Cross-chain expansion to Arbitrum and Base is planned for Q3 2026.',
      },
      {
        q: 'Is Kaleo safe to use?',
        a: 'Security is our top priority. Smart contracts will undergo a full audit before mainnet launch, all protocol funds are managed by a 3-of-5 multi-signature wallet, and an insurance fund (5% of all fees) protects against extreme market events. We also plan to open-source our core contracts for community review.',
      },
    ],
  },
  {
    category: 'Presale & Token',
    questions: [
      {
        q: 'How does the presale work?',
        a: 'The presale runs through 12 stages with increasing prices. Stage 1 starts at 0.000035 ETH/KLEO (83% discount vs listing) and Stage 12 ends at 0.000200 ETH/KLEO (5% discount). Each stage has a fixed ETH target and token allocation. When a stage fills, the price automatically moves to the next stage. Currently on testnet, you can practice with Sepolia ETH from a faucet.',
      },
      {
        q: 'What is the KLEO token used for?',
        a: 'KLEO is the native utility token of the Kaleo ecosystem. It provides governance voting rights, fee discount tiers for leverage trading, staking rewards, access to exclusive trading features, and entry into premium trading contests with larger prize pools.',
      },
      {
        q: 'What are the tokenomics?',
        a: 'Total supply is 1,000,000,000 KLEO. Allocation: 40% Presale, 20% Liquidity & Market Making, 15% Ecosystem & Rewards, 15% Community Airdrops, 10% Team & Advisors (vested over 24 months with 6-month cliff). Listing price will be 0.000210 ETH/KLEO.',
      },
      {
        q: 'Is there a vesting period for team tokens?',
        a: 'Yes, team and advisor tokens (10% of supply) are fully locked for 6 months after launch, then vest linearly over 24 months. This ensures the team is committed to long-term project success and prevents any early sell pressure.',
      },
    ],
  },
  {
    category: 'Trading & Platform',
    questions: [
      {
        q: 'How does leverage trading work on Kaleo?',
        a: 'Kaleo uses a peer-to-pool model. You deposit collateral (KLEO or ETH), select your desired leverage (up to 100x), and open a long or short position on any Pump.fun memecoin. The platform uses isolated margin, meaning each position has its own margin and liquidation price. This limits your maximum loss to the collateral for that specific trade.',
      },
      {
        q: 'What is liquidation protection?',
        a: 'Unlike most platforms that liquidate your entire position at once, Kaleo implements tiered liquidation. When your margin ratio drops below 10%, the engine closes 25% of your position at a time. This gives you multiple chances to add margin or for the market to recover, significantly reducing the chance of total loss.',
      },
      {
        q: 'How do the weekly trading contests work?',
        a: '100% of all trading fees (opening, closing, liquidation) are pooled weekly. Every Monday-Sunday UTC cycle, traders are ranked by realized PnL percentage. The top 50 traders split the entire fee pool: 1st place gets 20%, 2nd gets 12%, 3rd gets 8%, and places 4-50 share the remaining 60%. Everyone has an equal chance regardless of account size.',
      },
      {
        q: 'What order types are supported?',
        a: 'At launch, Kaleo will support market orders, limit orders, stop-loss, and take-profit. Advanced features like trailing stops, OCO (one-cancels-other), and conditional orders are planned for Q3 2026.',
      },
    ],
  },
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I buy KLEO on the testnet?',
        a: 'Connect a Web3 wallet (MetaMask, WalletConnect, etc.), switch to the Sepolia test network, get free Sepolia ETH from a faucet (like sepoliafaucet.com), then use the Buy section on this page to send test ETH and receive KLEO tokens. This is a practice run -- no real funds are needed.',
      },
      {
        q: 'Which wallets are supported?',
        a: 'Kaleo supports all major Web3 wallets through RainbowKit, including MetaMask, WalletConnect-compatible wallets, Coinbase Wallet, Rainbow, Trust Wallet, and many more. Simply click "Connect Wallet" to see the full list of supported options.',
      },
      {
        q: 'How do I get Sepolia test ETH?',
        a: 'You can get free Sepolia ETH from several faucets: Alchemy Sepolia Faucet (sepoliafaucet.com), Google Cloud Web3 Faucet, or Chainstack Sepolia Faucet. Simply paste your wallet address and receive test ETH within seconds. You need a small amount (0.01 ETH+) to practice buying KLEO.',
      },
    ],
  },
];

export function FAQSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.faq-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none', once: true }
        }
      );

      gsap.fromTo('.faq-category',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none', once: true }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="fade-in-section relative py-16 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05060B] via-[#080B12] to-[#05060B]" />

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="faq-header text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium uppercase tracking-widest">
              Support
            </span>
          </div>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold text-[#F4F6FA] mb-4 text-balance">
            Frequently Asked <span className="text-[#2BFFF1]">Questions</span>
          </h2>
          <p className="text-[#A7B0B7] text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Kaleo, the presale, and how leverage
            trading works on our platform.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((cat, catIdx) => (
            <div key={catIdx} className="faq-category">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="w-5 h-5 text-[#2BFFF1]" />
                <h3 className="text-lg font-bold text-[#F4F6FA]">{cat.category}</h3>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {cat.questions.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`${catIdx}-${idx}`}
                    className="glass-card rounded-xl overflow-hidden border-white/[0.08] data-[state=open]:border-[#2BFFF1]/20 transition-colors"
                  >
                    <AccordionTrigger className="px-5 py-4 text-left text-[#F4F6FA] hover:text-[#2BFFF1] transition-colors font-medium text-sm sm:text-base [&[data-state=open]]:text-[#2BFFF1]">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 text-[#A7B0B7] text-sm leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 glass-card rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-[#F4F6FA] mb-2">Still have questions?</h3>
          <p className="text-[#A7B0B7] text-sm mb-5 max-w-md mx-auto">
            Join our community channels to get real-time support from the team and fellow traders.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#" className="neon-button px-5 py-2.5 text-sm font-semibold">
              Join Discord
            </a>
            <a href="#" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#A7B0B7] text-sm font-medium hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors">
              Telegram Group
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
