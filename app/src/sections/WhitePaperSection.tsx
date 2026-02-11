import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Download, FileText, PieChart, Target, Shield, Zap, ChevronDown, ChevronUp, Calendar, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function WhitePaperSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'allocation'>('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.wp-card',
        { y: '6vh', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const tokenAllocations = [
    { name: 'Presale', percentage: 30, amount: '300M', color: '#2BFFF1', icon: Target },
    { name: 'Liquidity', percentage: 25, amount: '250M', color: '#1DD8CC', icon: Zap },
    { name: 'Development', percentage: 15, amount: '150M', color: '#3B82F6', icon: Shield },
    { name: 'Marketing', percentage: 10, amount: '100M', color: '#8B5CF6', icon: Users },
    { name: 'Community', percentage: 10, amount: '100M', color: '#EC4899', icon: Users },
    { name: 'Team', percentage: 5, amount: '50M', color: '#F59E0B', icon: Users },
    { name: 'Reserve', percentage: 5, amount: '50M', color: '#6B7280', icon: Shield },
  ];

  const roadmap = [
    {
      phase: 'Phase 1',
      title: 'Presale Launch',
      status: 'active',
      items: [
        'Website launch with full functionality',
        '9-stage presale with progressive pricing',
        'Wallet connect and purchase tracking',
        'Stripe integration for card payments',
        'Community building and marketing',
      ]
    },
    {
      phase: 'Phase 2',
      title: 'Token Launch & Listings',
      status: 'upcoming',
      items: [
        'Token distribution to presale buyers',
        'DEX listing on Uniswap',
        'CMC and CoinGecko listings',
        'Liquidity pool establishment',
        'First leverage trading beta',
      ]
    },
    {
      phase: 'Phase 3',
      title: 'Platform Launch',
      status: 'upcoming',
      items: [
        'Full leverage trading platform',
        'Pump.fun integration complete',
        'Up to 100x leverage trading',
        'Leverage trading contests launch',
        'Fee distribution to contest pools',
      ]
    },
    {
      phase: 'Phase 4',
      title: 'Expansion',
      status: 'upcoming',
      items: [
        'Additional DEX listings',
        'CEX partnership discussions',
        'Mobile app development',
        'Advanced trading features',
        'Cross-chain expansion',
      ]
    },
  ];

  const faqs = [
    {
      q: 'What is Kaleo?',
      a: 'Kaleo is the first leverage trading platform specifically designed for Pump.fun memecoins. Users can trade any memecoin with up to 100x leverage. All trading fees go to weekly leverage trading contests where top traders win prizes.'
    },
    {
      q: 'How does the presale work?',
      a: 'The presale consists of 9 stages with progressively increasing token prices. Each stage has a target amount to raise. Once a stage is complete, the price increases for the next stage. Early buyers get the best prices.'
    },
    {
      q: 'When will I receive my tokens?',
      a: 'Tokens will be distributed to all presale participants after the presale ends and before the DEX listing. You can view your token balance by connecting the same wallet you used to purchase.'
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept both cryptocurrency (ETH) and card payments via Stripe. All purchases are tracked and linked to your wallet address for token distribution.'
    },
    {
      q: 'How do leverage trading contests work?',
      a: 'All trading fees from the platform are pooled into weekly contests. Traders compete based on their trading performance (PnL), and top performers win prizes from the fee pool. The more fees generated, the bigger the prizes.'
    },
  ];

  const handleDownload = () => {
    // Create white paper content
    const whitepaperContent = `
KALEO WHITEPAPER
================

Executive Summary
-----------------
Kaleo is a revolutionary leverage trading platform built specifically for memecoins on Pump.fun. 
Our platform enables traders to access up to 100x leverage on any memecoin, while all trading 
fees are distributed back to the community through weekly trading contests.

Token Details
-------------
- Name: Kaleo (KLEO)
- Total Supply: 1,000,000,000 (1 Billion)
- Blockchain: Ethereum (ERC-20)
- Presale Stages: 9 stages with progressive pricing

Token Allocation
----------------
${tokenAllocations.map(t => `- ${t.name}: ${t.percentage}% (${t.amount} tokens)`).join('\n')}

Presale Structure
-----------------
Stage 1: $0.00010 per token - Target: $3,333
Stage 2: $0.00015 per token - Target: $5,000
Stage 3: $0.00022 per token - Target: $7,333
Stage 4: $0.00032 per token - Target: $10,667
Stage 5: $0.00047 per token - Target: $15,667
Stage 6: $0.00069 per token - Target: $23,000
Stage 7: $0.00101 per token - Target: $33,667
Stage 8: $0.00148 per token - Target: $49,333
Stage 9: $0.00217 per token - Target: $72,333

Platform Features
-----------------
1. Leverage Trading: Up to 100x leverage on any Pump.fun memecoin
2. Trading Contests: Weekly competitions with fee pool prizes
3. Instant Execution: No waiting, trade any memecoin instantly
4. Community Governance: Kaleo holders vote on platform decisions
5. Fee Distribution: 100% of trading fees go to contest pools

Roadmap
-------
${roadmap.map(r => `${r.phase}: ${r.title}\n${r.items.map(i => `  - ${i}`).join('\n')}`).join('\n\n')}

Contact
-------
Email: hello@kaleo.xyz
Website: https://kaleo.xyz
Twitter: @kaleo_xyz
    `;

    const blob = new Blob([whitepaperContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Kaleo_Whitepaper.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section 
      ref={sectionRef} 
      id="whitepaper"
      className="relative py-[10vh] z-40"
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src="/grid_city_bg_05.jpg" 
          alt="Cyberpunk city"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060B]/90 via-[#05060B]/80 to-[#05060B]/90" />
      </div>

      {/* Content */}
      <div className="relative px-[6vw]">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold text-[#F4F6FA] mb-4">
            Kaleo <span className="text-[#2BFFF1]">White Paper</span>
          </h2>
          <p className="text-[#A7B0B7] max-w-[500px] mx-auto mb-6">
            Learn about our vision, tokenomics, and roadmap for the first memecoin leverage trading platform.
          </p>
          <button
            onClick={handleDownload}
            className="neon-button px-6 py-3 text-sm font-semibold inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download White Paper
          </button>
        </div>

        {/* Tabs */}
        <div className="wp-card glass-card rounded-[28px] overflow-hidden max-w-[900px] mx-auto">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'roadmap', label: 'Roadmap', icon: Calendar },
              { id: 'allocation', label: 'Allocation', icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#2BFFF1] border-b-2 border-[#2BFFF1]'
                    : 'text-[#A7B0B7] hover:text-[#F4F6FA]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#F4F6FA] mb-3">What is Kaleo?</h3>
                  <p className="text-[#A7B0B7] leading-relaxed">
                    Kaleo is the first leverage trading platform built specifically for Pump.fun memecoins. 
                    Our mission is to bring professional-grade leverage trading tools to the memecoin market, 
                    allowing traders to maximize their exposure with up to 100x leverage.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: Zap, title: '100x Leverage', desc: 'Trade any memecoin with up to 100x leverage' },
                    { icon: Target, title: 'Fee Contests', desc: 'All fees go to weekly trading competitions' },
                    { icon: Shield, title: 'Secure Platform', desc: 'Audited contracts and secure infrastructure' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <item.icon className="w-8 h-8 text-[#2BFFF1] mb-3" />
                      <h4 className="text-[#F4F6FA] font-semibold mb-1">{item.title}</h4>
                      <p className="text-[#A7B0B7] text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* FAQ */}
                <div>
                  <h3 className="text-xl font-bold text-[#F4F6FA] mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                          className="w-full p-4 flex items-center justify-between text-left"
                        >
                          <span className="text-[#F4F6FA] font-medium">{faq.q}</span>
                          {expandedFaq === idx ? (
                            <ChevronUp className="w-5 h-5 text-[#A7B0B7]" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#A7B0B7]" />
                          )}
                        </button>
                        {expandedFaq === idx && (
                          <div className="px-4 pb-4">
                            <p className="text-[#A7B0B7] text-sm leading-relaxed">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Roadmap Tab */}
            {activeTab === 'roadmap' && (
              <div className="space-y-4">
                {roadmap.map((phase, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      phase.status === 'active'
                        ? 'bg-[#2BFFF1]/10 border-[#2BFFF1]/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        phase.status === 'active'
                          ? 'bg-[#2BFFF1] text-[#05060B]'
                          : 'bg-white/10 text-[#A7B0B7]'
                      }`}>
                        {phase.phase}
                      </span>
                      <h4 className="text-[#F4F6FA] font-semibold">{phase.title}</h4>
                      {phase.status === 'active' && (
                        <span className="text-[#2BFFF1] text-xs">In Progress</span>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#A7B0B7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2BFFF1] mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Allocation Tab */}
            {activeTab === 'allocation' && (
              <div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Chart */}
                  <div>
                    <h3 className="text-lg font-bold text-[#F4F6FA] mb-4">Token Distribution</h3>
                    <div className="space-y-3">
                      {tokenAllocations.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#F4F6FA]">{item.name}</span>
                              <span className="text-[#A7B0B7]">{item.percentage}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${item.percentage}%`,
                                  backgroundColor: item.color 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="text-lg font-bold text-[#F4F6FA] mb-4">Allocation Details</h3>
                    <div className="space-y-3">
                      {tokenAllocations.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                            <span className="text-[#F4F6FA] font-medium">{item.name}</span>
                          </div>
                          <p className="text-[#A7B0B7] text-sm">
                            {item.percentage}% ({item.amount} tokens)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-6 p-4 rounded-xl bg-[#2BFFF1]/10 border border-[#2BFFF1]/30 text-center">
                  <p className="text-[#A7B0B7] text-sm mb-1">Total Supply</p>
                  <p className="text-[#2BFFF1] text-2xl font-bold">1,000,000,000 KLEO</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
