import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FileText, Shield, Coins, BarChart3, Users, Lock,
  ChevronDown, ChevronUp, Zap, TrendingUp, Award, Globe,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface WhitepaperBlock {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const sections: WhitepaperBlock[] = [
  {
    id: 'introduction',
    icon: FileText,
    title: '1. Introduction',
    content: (
      <div className="space-y-4">
        <p>
          Kaleo is a next-generation decentralized leverage trading platform built specifically
          for memecoins. By integrating directly with Pump.fun, Kaleo enables traders to take
          leveraged positions of up to 100x on any memecoin, combining the explosive potential
          of meme tokens with professional-grade trading tools.
        </p>
        <p>
          The memecoin market represents one of the fastest-growing sectors in crypto, yet lacks
          proper infrastructure for leverage trading. Kaleo fills this gap by providing a secure,
          transparent, and community-driven platform where all trading fees are redistributed
          through weekly trading contests.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Max Leverage', value: '100x' },
            { label: 'Contest Frequency', value: 'Weekly' },
            { label: 'Fee Redistribution', value: '100%' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-lg bg-[#2BFFF1]/5 border border-[#2BFFF1]/20 text-center">
              <p className="text-[#2BFFF1] text-lg font-bold">{stat.value}</p>
              <p className="text-[#A7B0B7] text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'tokenomics',
    icon: Coins,
    title: '2. Tokenomics',
    content: (
      <div className="space-y-4">
        <p>
          The KLEO token is the backbone of the Kaleo ecosystem, designed with a deflationary
          model and multi-utility structure to align long-term holder incentives with platform growth.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 pr-4 text-[#A7B0B7] font-medium">Allocation</th>
                <th className="text-right py-3 pr-4 text-[#A7B0B7] font-medium">Tokens</th>
                <th className="text-right py-3 text-[#A7B0B7] font-medium">Percentage</th>
              </tr>
            </thead>
            <tbody className="text-[#F4F6FA]">
              {[
                { name: 'Presale (12 stages)', tokens: '400,000,000', pct: '40%' },
                { name: 'Liquidity & Market Making', tokens: '200,000,000', pct: '20%' },
                { name: 'Ecosystem & Rewards', tokens: '150,000,000', pct: '15%' },
                { name: 'Community Airdrops', tokens: '150,000,000', pct: '15%' },
                { name: 'Team & Advisors (24mo vest)', tokens: '100,000,000', pct: '10%' },
              ].map((row) => (
                <tr key={row.name} className="border-b border-white/5">
                  <td className="py-3 pr-4">{row.name}</td>
                  <td className="py-3 pr-4 text-right font-mono text-[#2BFFF1]">{row.tokens}</td>
                  <td className="py-3 text-right font-mono">{row.pct}</td>
                </tr>
              ))}
              <tr className="border-t border-[#2BFFF1]/20">
                <td className="py-3 pr-4 font-bold text-[#2BFFF1]">Total Supply</td>
                <td className="py-3 pr-4 text-right font-mono font-bold text-[#2BFFF1]">1,000,000,000</td>
                <td className="py-3 text-right font-mono font-bold text-[#2BFFF1]">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-4">
          <p className="text-sm text-[#A7B0B7]">
            <strong className="text-[#F4F6FA]">Listing Price:</strong> 0.000210 ETH/KLEO.
            Presale stages offer discounts from 83% (Stage 1) down to 5% (Stage 12).
            Team tokens are fully locked for 6 months, then vest linearly over 24 months.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'leverage',
    icon: TrendingUp,
    title: '3. Leverage Trading Mechanism',
    content: (
      <div className="space-y-4">
        <p>
          Kaleo's leverage engine uses a peer-to-pool model where liquidity providers supply capital
          and traders borrow against their collateral. Positions are managed by an on-chain
          risk engine that monitors margin ratios in real-time.
        </p>
        <div className="space-y-3">
          <h4 className="text-[#F4F6FA] font-semibold">Key Features:</h4>
          <ul className="space-y-2">
            {[
              'Up to 100x leverage on any Pump.fun memecoin',
              'Isolated margin per position to limit downside',
              'Automatic liquidation with partial close options',
              'Stop-loss and take-profit order types',
              'Real-time PnL tracking and position management',
              'Funding rate mechanism to balance long/short interest',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[#A7B0B7]">
                <Zap className="w-4 h-4 text-[#2BFFF1] mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-[#2BFFF1]/5 border border-[#2BFFF1]/20">
          <p className="text-sm text-[#A7B0B7]">
            <strong className="text-[#2BFFF1]">Liquidation Protection:</strong>{' '}
            Kaleo implements a tiered liquidation system. When margin ratio drops below 10%,
            the engine partially closes the position (25% increments) to prevent total loss,
            giving traders more chances to recover.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'contests',
    icon: Award,
    title: '4. Trading Contests & Fee Distribution',
    content: (
      <div className="space-y-4">
        <p>
          What makes Kaleo unique is that 100% of trading fees are redistributed to the
          community through weekly leverage trading contests. This creates a perpetual
          incentive loop that rewards active traders and drives engagement.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-[#F4F6FA] font-semibold mb-2">Weekly Contest Structure</h4>
            <ul className="space-y-1.5 text-sm text-[#A7B0B7]">
              <li>Contest runs Monday 00:00 to Sunday 23:59 UTC</li>
              <li>Rankings based on realized PnL percentage</li>
              <li>Top 50 traders split the weekly fee pool</li>
              <li>Prize tiers: 1st (20%), 2nd (12%), 3rd (8%), 4-50th (shared 60%)</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-[#F4F6FA] font-semibold mb-2">Fee Breakdown</h4>
            <ul className="space-y-1.5 text-sm text-[#A7B0B7]">
              <li>Opening fee: 0.05% of position size</li>
              <li>Closing fee: 0.05% of position size</li>
              <li>Liquidation fee: 0.5% of remaining collateral</li>
              <li>Funding rate: dynamic (recalculated every 8h)</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'security',
    icon: Shield,
    title: '5. Security & Audits',
    content: (
      <div className="space-y-4">
        <p>
          Security is foundational to Kaleo. Our smart contracts undergo rigorous
          auditing and all critical operations are protected by multi-signature governance.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: Lock,
              title: 'Multi-Sig Treasury',
              desc: 'All protocol funds managed by 3-of-5 multi-signature wallet with time-locked transactions.',
            },
            {
              icon: Shield,
              title: 'Smart Contract Audits',
              desc: 'Full audit planned with leading security firms before mainnet launch. Bug bounty program active.',
            },
            {
              icon: Globe,
              title: 'Open Source',
              desc: 'Core smart contracts will be verified and open-sourced on Etherscan for full transparency.',
            },
            {
              icon: Users,
              title: 'Insurance Fund',
              desc: '5% of all fees go to an insurance fund to cover any shortfall from extreme market events.',
            },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3">
              <item.icon className="w-5 h-5 text-[#2BFFF1] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[#F4F6FA] font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-[#A7B0B7] text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'governance',
    icon: Users,
    title: '6. Governance & DAO',
    content: (
      <div className="space-y-4">
        <p>
          KLEO holders gain governance rights proportional to their token holdings. The
          community decides on key platform parameters, fee structures, and new feature
          priorities through a transparent on-chain voting mechanism.
        </p>
        <div className="space-y-3">
          <h4 className="text-[#F4F6FA] font-semibold">Governance Powers:</h4>
          <ul className="space-y-2">
            {[
              'Adjust trading fees and contest prize distributions',
              'Vote on new memecoin listings and supported chains',
              'Propose and fund ecosystem grants',
              'Modify staking reward rates',
              'Elect council members for day-to-day operations',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[#A7B0B7]">
                <BarChart3 className="w-4 h-4 text-[#2BFFF1] mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-[#A7B0B7] italic">
          Governance will be activated in Phase 3 (Q3 2026) after the platform has achieved
          sufficient decentralization and community participation.
        </p>
      </div>
    ),
  },
];

export function WhitePaperSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['introduction']));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.wp-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none', once: true }
        }
      );

      gsap.fromTo('.wp-block',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none', once: true }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="whitepaper"
      className="fade-in-section relative py-24 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05060B] via-[#080B12] to-[#05060B]" />

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="wp-header text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-[#2BFFF1] text-xs font-medium uppercase tracking-widest">
              Technical Documentation
            </span>
          </div>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold text-[#F4F6FA] mb-4 text-balance">
            Kaleo <span className="text-[#2BFFF1]">Whitepaper</span>
          </h2>
          <p className="text-[#A7B0B7] text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            A comprehensive overview of the Kaleo platform, tokenomics, trading
            mechanism, and governance model.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={expandAll}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-sm hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#A7B0B7] text-sm hover:border-[#2BFFF1]/50 hover:text-[#2BFFF1] transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-4">
          {sections.map((block) => {
            const isExpanded = expandedSections.has(block.id);

            return (
              <div
                key={block.id}
                className={`wp-block glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'border-[#2BFFF1]/20' : ''
                }`}
              >
                <button
                  onClick={() => toggleSection(block.id)}
                  className="w-full flex items-center gap-4 p-5 sm:p-6 text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isExpanded
                      ? 'bg-[#2BFFF1]/15 border border-[#2BFFF1]/30'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <block.icon className={`w-5 h-5 ${
                      isExpanded ? 'text-[#2BFFF1]' : 'text-[#A7B0B7]'
                    }`} />
                  </div>
                  <h3 className={`flex-1 text-lg font-bold transition-colors ${
                    isExpanded ? 'text-[#F4F6FA]' : 'text-[#A7B0B7]'
                  }`}>
                    {block.title}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#2BFFF1] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#A7B0B7] shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 text-[#A7B0B7] text-sm leading-relaxed">
                    {block.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <p className="text-[#A7B0B7] text-xs leading-relaxed">
            This whitepaper is for informational purposes only and does not constitute
            financial advice. Cryptocurrency investments carry significant risk. Always
            do your own research before participating.
            <span className="block mt-1 text-[#A7B0B7]/60">
              &copy; 2026 Kaleo Team. All rights reserved. v1.0
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
